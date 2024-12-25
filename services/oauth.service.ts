import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { jwtSecret, oauth_google } from "../config";
import { fallbackAssets, HTTP, USER_STATUS } from "../constants";
import { ApiError } from "../errors";
import { Logger } from "../log";
import { authRepo } from "../repo";
import { IUser } from "../types";
import { genericParse, getNonEmptyString, safeParse } from "../utils";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";

const client = new OAuth2Client();

export class OAuthService {
	public static async verifyOAuthRequestByCode(auth_code: string) {
		const oauthRequest = {
			url: new URL("https://oauth2.googleapis.com/token"),
			params: {
				client_id: oauth_google.client_id,
				client_secret: oauth_google.client_secret,
				code: auth_code,
				grant_type: "authorization_code",
				redirect_uri: oauth_google.redirect_uri,
			},
		};
		const oauthResponse = await axios.post(
			oauthRequest.url.toString(),
			null,
			{ params: oauthRequest.params }
		);
		return oauthResponse.data;
	}
	public static async fetchUserFromIdToken(idToken: string) {
		const ticket = await client.verifyIdToken({
			idToken,
			audience: oauth_google.client_id,
		});
		const payload = ticket.getPayload();
		return payload;
	}
	public static async verifyOAuthSignIn(code: string): Promise<string> {
		const { id_token } = await OAuthService.verifyOAuthRequestByCode(code);
		Logger.debug("id_token", id_token);
		const userFromOAuth = await OAuthService.fetchUserFromIdToken(id_token);
		Logger.debug("userFromOAuth", userFromOAuth);
		if (!userFromOAuth) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Auth failed, please try again or contact support"
			);
		}
		const email = genericParse(getNonEmptyString, userFromOAuth.email);
		const name = safeParse(getNonEmptyString, userFromOAuth.name) || "";
		const picture = userFromOAuth.picture;
		Logger.debug("email name picture", email, name, picture);
		const authMapping = await AuthService.findOrCreateAuthMapping(
			email,
			{ id: userFromOAuth.sub, name: "google" },
			null,
			{ name, avatar: picture }
		);
		Logger.debug("authMapping", authMapping);
		const { user, isNew } = await UserService.findOrCreateUser({
			name,
			email,
			avatar: picture || fallbackAssets.avatar,
			status: USER_STATUS.JOINED,
		});
		Logger.debug("user isNew", user, isNew);
		if (
			isNew ||
			!authMapping.user ||
			(authMapping.user !== null && authMapping.user.id !== user.id)
		) {
			await authRepo.update({ id: authMapping.id }, { user: user.id });
		}
		const oauthValidatorToken = jwt.sign(
			{ id: authMapping.id },
			jwtSecret.oauthValidator,
			{ expiresIn: "1m" }
		);
		Logger.debug("oauthValidatorToken", oauthValidatorToken);
		return oauthValidatorToken;
	}
	public static async continueOAuthWithGoogle(
		validatorToken: string
	): Promise<{
		accessToken: string;
		refreshToken: string;
		user: IUser;
	}> {
		const decodedToken: any = jwt.verify(
			validatorToken,
			jwtSecret.oauthValidator
		);
		Logger.debug("decodedToken", decodedToken);
		const authMappingId = genericParse(getNonEmptyString, decodedToken.id);
		Logger.debug("authMappingId", authMappingId);
		const foundAuthMapping = await authRepo.findById(authMappingId);
		if (!foundAuthMapping || !foundAuthMapping.user) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Auth failed, please try again or contact support"
			);
		}
		Logger.debug("foundAuthMapping", foundAuthMapping);
		const user = await UserService.getUserById(foundAuthMapping.user.id);
		if (!user) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Auth failed, please try again or contact support"
			);
		}
		Logger.debug("user", user);
		const { accessToken, refreshToken } = AuthService.generateTokens(
			`${foundAuthMapping.id}`
		);
		Logger.debug("accessToken refreshToken", accessToken, refreshToken);
		return { accessToken, refreshToken, user };
	}
}
