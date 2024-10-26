import { NextFunction } from "express";
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
