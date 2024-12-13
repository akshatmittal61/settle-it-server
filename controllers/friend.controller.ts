import { HTTP } from "../constants";
import { FriendService } from "../services";
import { ApiRequest, ApiResponse } from "../types";
import { genericParse, getNonEmptyString } from "../utils";

export class FriendController {
	public static async getUserFriends(req: ApiRequest, res: ApiResponse) {
		const userId = genericParse(getNonEmptyString, req.user?.id);
		const friends = await FriendService.getFriends(userId);
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: friends,
		});
	}
}
