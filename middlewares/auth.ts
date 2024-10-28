import { NextFunction } from "express";
import { admins, HTTP } from "../constants";
import { AuthService, GroupService } from "../services";
import { ApiRequest, ApiResponse } from "../types";
import { genericParse, getNonEmptyString } from "../utils";
import { logger } from "../log";

export const authenticatedRoute = async (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	logger.debug("Cookies", req.cookies);
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
		logger.debug("loggedInUser", loggedInUser);
		req.user = loggedInUser;
		return next();
	} catch {
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
	} catch {
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: "Token is not valid" });
	}
};

export const isGroupMember = async (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	const loggedInUser = req.user;
	if (!loggedInUser) {
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: "Please login to continue" });
	}
	try {
		const groupId = genericParse(getNonEmptyString, req.params.groupId);
		const group = await GroupService.getGroupDetailsForUser(
			loggedInUser.id,
			groupId
		);
		if (!group) {
			return res
				.status(HTTP.status.FORBIDDEN)
				.json({ message: "You are not a member of this group" });
		}
		req.group = group;
		return next();
	} catch {
		return res
			.status(HTTP.status.FORBIDDEN)
			.json({ message: "You are not a member of this group" });
	}
};
