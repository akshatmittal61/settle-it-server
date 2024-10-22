import { Request, Response } from "express";
import { IUser } from "./user";

export type ApiRequest = Request & {
	user?: IUser;
};

export type ApiResponse = Response;
