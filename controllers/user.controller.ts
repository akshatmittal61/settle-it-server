import { HTTP } from "../constants";
import { UserService } from "../services";
import { ApiRequest, ApiResponse } from "../types";
import { genericParse, getNonEmptyString } from "../utils";

export class UserControllers {
	public static async updateUserDetails(req: ApiRequest, res: ApiResponse) {
		const id = genericParse<string>(getNonEmptyString, req.params.id);
		const updatedUser = await UserService.updateUserDetails(id, req.body);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: updatedUser });
	}

	public static async inviteUser(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse<string>(
			getNonEmptyString,
			req.user?.id
		);
		const invitee = genericParse<string>(getNonEmptyString, req.body.email);
		const invitedUser = await UserService.inviteUser(
			loggedInUserId,
			invitee
		);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: invitedUser });
	}

	public static async searchForUsers(req: ApiRequest, res: ApiResponse) {
		const query = genericParse(getNonEmptyString, req.body.query);
		const users = await UserService.searchByEmail(query);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: users });
	}
}
