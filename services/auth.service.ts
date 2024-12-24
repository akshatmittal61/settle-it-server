import jwt from "jsonwebtoken";
import { jwtSecret } from "../config";
import { Logger } from "../log";
import { IUser } from "../types";
import { genericParse, getNonEmptyString } from "../utils";
import { UserService } from "./user.service";

export class AuthService {
	public static async getAuthenticatedUser(
		token: string
	): Promise<IUser | null> {
		try {
			const decoded: any = jwt.verify(token, jwtSecret);
			const userId = genericParse(getNonEmptyString, decoded.id);
			const foundUser = await UserService.getUserById(userId);
			return foundUser;
		} catch (error) {
			Logger.error(error);
			return null;
		}
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
