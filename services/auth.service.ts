import jwt from "jsonwebtoken";
import { jwtSecret } from "../config";
import { Logger } from "../log";
import { authRepo } from "../repo";
import { IAuthMapping, IUser } from "../types";
import { genericParse, getNonEmptyString } from "../utils";
import { UserService } from "./user.service";

export class AuthService {
	public static async findOrCreateAuthMapping(
		email: string,
		provider: { id: string; name: string },
		user: string | null = null,
		misc: any = {}
	): Promise<IAuthMapping> {
		const foundAuthMapping = await authRepo.findOne({
			identifier: email,
			providerName: provider.name,
		});
		if (foundAuthMapping) {
			return foundAuthMapping;
		}
		return await authRepo.create({
			identifier: email,
			providerName: provider.name,
			providerId: provider.id,
			misc: JSON.stringify(misc),
			user,
		});
	}
	public static async getAuthenticatedUser(
		token: string
	): Promise<IUser | null> {
		try {
			const decoded: any = jwt.verify(token, jwtSecret);
			Logger.debug("decoded", decoded);
			const authMappingId = genericParse(getNonEmptyString, decoded.id);
			Logger.debug("authMappingId", authMappingId);
			const user =
				await AuthService.getUserByAuthMappingId(authMappingId);
			if (!user) return null;
			return user;
		} catch (error) {
			Logger.error(error);
			return null;
		}
	}
	public static async getUserByAuthMappingId(
		authMappingId: string
	): Promise<IUser | null> {
		const foundAuthMapping = await authRepo.findById(authMappingId);
		if (!foundAuthMapping || !foundAuthMapping.user) return null;
		Logger.debug("foundAuthMapping", foundAuthMapping);
		const userId = genericParse(
			getNonEmptyString,
			foundAuthMapping.user.id
		);
		Logger.debug("userId", userId);
		return await UserService.getUserById(userId);
	}
	public static generateToken(id: string): string {
		return jwt.sign({ id }, jwtSecret, {
			expiresIn: "30d",
		});
	}
	public static getCookie(token: string, isLoggedOut: boolean = false) {
		if (isLoggedOut)
			return "token=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure=true";
		return `token=${token}; HttpOnly; Path=/; Max-Age=${
			30 * 24 * 60 * 60 * 1000
		}; SameSite=None; Secure=true`;
	}
}
