import { default as corsMiddleware } from "cors";
import { NextFunction } from "express";
import { DatabaseManager } from "../connections";
import { frontendBaseUrl, HTTP } from "../constants";
import { Logger } from "../log";
import { ApiRequest, ApiResponse } from "../types";

export const parseCookies = (
	req: ApiRequest,
	_: ApiResponse,
	next: NextFunction
) => {
	const cookie: typeof req.cookies = {};
	const list = req.headers.cookie?.split(";") || [];
	for (const item of list) {
		const parts = item.split("=");
		const key = parts.shift()?.trim() || "";
		if (!key) continue;
		const value = decodeURIComponent(parts.join("="));
		cookie[key] = value;
	}
	req.cookies = cookie;
	return next();
};

// export const cors = (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
// 	res.setHeader("Access-Control-Allow-Origin", frontendBaseUrl);
// 	res.setHeader(
// 		"Access-Control-Allow-Methods",
// 		"GET, POST, PUT, PATCH, DELETE, OPTIONS"
// 	);
// 	res.setHeader(
// 		"Access-Control-Allow-Headers",
// 		"X-Requested-With,content-type,Authorization"
// 	);
// 	res.setHeader("Access-Control-Allow-Credentials", "true");
// 	if (req.method === "OPTIONS") {
// 		return res.sendStatus(HTTP.status.SUCCESS);
// 	}
// 	return next();
// };
export const cors = corsMiddleware({
	origin: frontendBaseUrl,
	credentials: true,
});

export const useDb =
	(db: DatabaseManager) =>
	(_: ApiRequest, res: ApiResponse, next: NextFunction) => {
		if (db.isConnected() === false) {
			Logger.error("Unable to connect to database");
			return db.connect().then((isConnected) => {
				if (isConnected) {
					return next();
				} else {
					return res
						.status(HTTP.status.SERVICE_UNAVAILABLE)
						.json({ message: HTTP.message.DB_CONNECTION_ERROR });
				}
			});
		}
		return next();
	};

export const tracer = (req: ApiRequest, _: ApiResponse, next: NextFunction) => {
	Logger.debug(req.method, req.path, req.params, req.body, req.headers);
	return next();
};

export const profiler = (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	const start = process.hrtime(); // Use high-resolution timer

	res.on("finish", () => {
		const end = process.hrtime(start);
		const elapsed = (end[0] * 1e9 + end[1]) / 1e6; // Convert to milliseconds
		Logger.debug(
			`Request: ${req.method} ${req.originalUrl} ${res.statusCode} took ${elapsed}ms`
		);
	});

	return next();
};
