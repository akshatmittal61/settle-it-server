import { url } from "../config";

export const logsBaseUrl: string = "logs";

export const frontendBaseUrl: string = url.frontend;
export const backendBaseUrl: string = url.backend;
export const dbUri: string = url.db;
export const fallbackAssets = Object.freeze({
	avatar: `${frontendBaseUrl}/vectors/user.svg`,
	groupIcon: `${frontendBaseUrl}/images/group-icon.png`,
	banner: `${frontendBaseUrl}/images/banner.png`,
});
