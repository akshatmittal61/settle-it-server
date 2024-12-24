import { configService } from "./base";

export const oauth_google = Object.freeze({
	client_id: configService.get("GOOGLE_OAUTH_CLIENT_ID"),
	client_secret: configService.get("GOOGLE_OAUTH_CLIENT_SECRET"),
	redirect_uri: configService.get("GOOGLE_OAUTH_REDIRECT_URI"),
});
