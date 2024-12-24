import { GOOGLE_MAIL_SERVICE_KEYS } from "../types";
import { configService } from "./base";

export const googleEmailConfig: Record<GOOGLE_MAIL_SERVICE_KEYS, string> = {
	email: configService.get("GOOGLE_EMAIL"),
	password: configService.get("GOOGLE_EMAIL_PASSWORD"),
};
