import { NextFunction } from "express";
import { admins, HTTP } from "../constants";
import { Logger } from "../log";
import { AuthService, GroupService } from "../services";
import { ApiRequest, ApiResponse } from "../types";
import { genericParse, getNonEmptyString } from "../utils";

export const authenticatedRoute = async (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	try {
		const accessToken = genericParse(
			getNonEmptyString,
			req.cookies.accessToken
		);
		const refreshToken = genericParse(
			getNonEmptyString,
			req.cookies.refreshToken
		);
		const authResponse = await AuthService.getAuthenticatedUser({
			accessToken,
			refreshToken,
		});
		if (!authResponse) {
			return res
				.status(HTTP.status.UNAUTHORIZED)
				.json({ message: "Please login to continue" });
		}
		const {
			user,
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		} = authResponse;
		if (accessToken !== newAccessToken) {
			res.setHeader("x-auth-access-token", newAccessToken);
		}
		if (refreshToken !== newRefreshToken) {
			res.setHeader("x-auth-refresh-token", newRefreshToken);
		}
		req.user = user;
		return next();
	} catch (error: any) {
		Logger.error(error);
		return res
			.status(HTTP.status.UNAUTHORIZED)
			.json({ message: HTTP.message.UNAUTHORIZED });
	}
};

export const adminRoute = (
	req: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	try {
		const loggedInUser = req.user;
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
			.status(HTTP.status.FORBIDDEN)
			.json({ message: "You are not an admin" });
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
