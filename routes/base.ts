import { NextFunction, Router } from "express";
import { ApiRequest, ApiResponse } from "../types";

export const router = Router();

const asyncMiddleware = (handler: any) => {
	return async (req: ApiRequest, res: ApiResponse, next: NextFunction) => {
		try {
			await handler(req, res, next);
		} catch (error) {
			next(error); // Passes the error to the error-handling middleware
		}
	};
};

export const wrapper = (router: Router) => {
	router.stack.forEach((layer) => {
		if (layer.route) {
			layer.route.stack.forEach((routeHandler) => {
				routeHandler.handle = asyncMiddleware(routeHandler.handle);
			});
		}
	});
	return router;
};
