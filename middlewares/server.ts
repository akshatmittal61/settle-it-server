import { NextFunction } from "express";
import { HTTP } from "../constants";
import { db } from "../db";
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

export const cors = (_: ApiRequest, res: ApiResponse, next: NextFunction) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"X-Requested-With,content-type,Authorization"
	);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	next();
};

export const useDb = (_: ApiRequest, res: ApiResponse, next: NextFunction) => {
	if (db.isReady() === false) {
		return res
			.status(HTTP.status.SERVICE_UNAVAILABLE)
			.json({ message: HTTP.message.DB_CONNECTION_ERROR });
	}
	return next();
};
