import { HTTP } from "../constants";
import { GroupService, UserService } from "../services";
import { ApiRequest, ApiResponse } from "../types";

export class AdminController {
	public static async getAllGroups(_: ApiRequest, res: ApiResponse) {
		const groups = await GroupService.getAllGroups();
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: groups,
		});
	}
	public static async getAllUsers(_: ApiRequest, res: ApiResponse) {
		const users = await UserService.getAllUsers();
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: users,
		});
	}
}
