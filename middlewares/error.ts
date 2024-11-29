import { NextFunction } from "express";
import { HTTP } from "../constants";
import { ApiError, DbConnectionError, ParserSafetyError } from "../errors";
import { ApiRequest, ApiResponse } from "../types";
import { Logger } from "../log";

export const errorHandler = (
	error: any,
	_: ApiRequest,
	res: ApiResponse,
	next: NextFunction
) => {
	Logger.debug("Error caught at final handler", error);
	if (res.headersSent) {
		return next(error);
	}
	if (error instanceof ApiError) {
		return res.status(error.status).json({ message: error.message });
	} else if (error instanceof DbConnectionError) {
		return res.status(HTTP.status.SERVICE_UNAVAILABLE).json({
			message: error.message || "Unable to connect to database",
		});
	} else if (error instanceof ParserSafetyError) {
		return res
			.status(HTTP.status.BAD_REQUEST)
			.json({ message: HTTP.message.BAD_REQUEST });
	} else {
		return res.status(HTTP.status.INTERNAL_SERVER_ERROR).json({
			message: error.message || HTTP.message.INTERNAL_SERVER_ERROR,
		});
	}
};
