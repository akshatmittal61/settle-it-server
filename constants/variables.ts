import { service, url } from "../config";

export const logsBaseUrl: string = "logs";
export const serviceName = service;

export const frontendBaseUrl: string = url.frontend;
export const backendBaseUrl: string = url.backend;
export const dbUri: string = url.db;
export const fallbackAssets = Object.freeze({
	avatar: `${frontendBaseUrl}/vectors/user.svg`,
	groupIcon: `${frontendBaseUrl}/images/group-icon.png`,
	banner: `${frontendBaseUrl}/images/banner.png`,
});

export const admins = [
	"akshatmittal2506@gmail.com",
	"snehasharma9205@gmail.com",
	"sambhav05062001@gmail.com",
	"anshikasharma25mar@gmail.com",
	"settleit.saas@gmail.com",
];
