import { NextFunction } from "express";
import { admins, HTTP } from "../constants";
import { AuthService } from "../services";
import { ApiRequest, ApiResponse } from "../types";

export const authenticatedRoute = async (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	const token = req.cookies.token;
	if (!token) {
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: "Please login to continue" });
	}
	try {
		const loggedInUser = await AuthService.getAuthenticatedUser(token);
		if (!loggedInUser) {
			return res
				.status(HTTP.status.UNAUTHORIZED)
				.json({ message: "Please login to continue" });
		}
		req.user = loggedInUser;
		return next();
	} catch (err) {
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: "Token is not valid" });
	}
};

export const adminRoute = async (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	const token = req.cookies.token;
	if (!token) {
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: "Please login to continue" });
	}
	try {
		const loggedInUser = await AuthService.getAuthenticatedUser(token);
		if (!loggedInUser) {
			return res
				.status(HTTP.status.UNAUTHORIZED)
				.json({ message: "Please login to continue" });
		}
		if (!admins.includes(loggedInUser.email)) {
			return res
				.status(HTTP.status.FORBIDDEN)
				.json({ message: "You are not an admin" });
		}
		req.user = loggedInUser;
		return next();
	} catch (err) {
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: "Token is not valid" });
	}
	return next();
};
