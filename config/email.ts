import { GOOGLE_MAIL_SERVICE_KEYS } from "../types";
import { configService } from "./base";

export const googleEmailConfig: Record<GOOGLE_MAIL_SERVICE_KEYS, string> = {
	clientId: configService.get("GOOGLE_CLIENT_ID"),
	clientSecret: configService.get("GOOGLE_CLIENT_SECRET"),
	refreshToken: configService.get("GOOGLE_REFRESH_TOKEN"),
	redirectUri: configService.get("GOOGLE_REDIRECT_URI"),
	email: configService.get("GOOGLE_EMAIL"),
};
