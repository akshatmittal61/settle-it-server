import { Request, Response } from "express";
import { IGroup } from "./group";
import { IUser } from "./user";

export type ApiRequest = Request & {
	user?: IUser;
	group?: IGroup;
};

export type ApiResponse = Response;
