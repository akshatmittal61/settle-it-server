import { config } from "dotenv";

config();

type GOOGLE_MAIL_SERVICE_KEYS =
	| "clientId"
	| "clientSecret"
	| "refreshToken"
	| "redirectUri"
	| "email";

export const googleEmailConfig: Record<GOOGLE_MAIL_SERVICE_KEYS, string> = {
	clientId: process.env.GOOGLE_CLIENT_ID || "",
	clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
	refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
	redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
	email: process.env.GOOGLE_EMAIL || "",
};
