import jwt, { TokenExpiredError } from "jsonwebtoken";
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
	public static async getAuthenticatedUser({
		accessToken,
		refreshToken,
	}: {
		accessToken: string;
		refreshToken: string;
	}): Promise<{
		user: IUser;
		accessToken: string;
		refreshToken: string;
	} | null> {
		try {
			const decodedAccessToken: any = jwt.verify(
				accessToken,
				jwtSecret.authAccess
			);
			const authMappingId = genericParse(
				getNonEmptyString,
				decodedAccessToken.id
			);
			const user =
				await AuthService.getUserByAuthMappingId(authMappingId);
			if (!user) return null;
			return {
				user,
				accessToken,
				refreshToken,
			};
		} catch (error) {
			if (!(error instanceof TokenExpiredError)) {
				return null;
			}
		}
		try {
			const decodedRefreshToken: any = jwt.verify(
				refreshToken,
				jwtSecret.authRefresh
			);
			const authMappingId = genericParse(
				getNonEmptyString,
				decodedRefreshToken.id
			);
			const user =
				await AuthService.getUserByAuthMappingId(authMappingId);
			if (!user) return null;
			const newAccessToken =
				AuthService.generateAccessToken(authMappingId);
			return {
				user,
				accessToken: newAccessToken,
				refreshToken,
			};
		} catch {
			return null;
		}
	}
	public static generateRefreshToken(id: string) {
		return jwt.sign({ id }, jwtSecret.authRefresh, {
			expiresIn: "7d",
		});
	}
	public static generateAccessToken(id: string) {
		return jwt.sign({ id }, jwtSecret.authAccess, {
			expiresIn: "15m",
		});
	}
	public static generateTokens(id: string): {
		refreshToken: string;
		accessToken: string;
	} {
		return {
			refreshToken: AuthService.generateRefreshToken(id),
			accessToken: AuthService.generateAccessToken(id),
		};
	}
}
