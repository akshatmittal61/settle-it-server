import { HTTP } from "../constants";
import { GroupService } from "../services";
import { ApiRequest, ApiResponse, Group } from "../types";
import { genericParse, getArray, getNonEmptyString, safeParse } from "../utils";

export class GroupController {
	public static async getGroupsForUser(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const groups = await GroupService.getGroupsUserIsPartOf(loggedInUserId);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: groups });
	}
	public static async getGroupDetails(req: ApiRequest, res: ApiResponse) {
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: req.group });
	}
	public static async getGroupExpenses(req: ApiRequest, res: ApiResponse) {
		const groupId = genericParse(getNonEmptyString, req.group?.id);
		const expenses = await GroupService.getGroupExpenses(groupId);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: expenses });
	}
	public static async createGroup(req: ApiRequest, res: ApiResponse) {
		const name = genericParse(getNonEmptyString, req.body.name);
		const icon = safeParse(getNonEmptyString, req.body.icon) || "";
		const banner = safeParse(getNonEmptyString, req.body.banner) || "";
		const type = safeParse(getNonEmptyString, req.body.type) || "";
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const members = safeParse(getArray<string>, req.body.members) || [
			loggedInUserId,
		];
		const createdGroup = await GroupService.createGroup({
			authorId: loggedInUserId,
			body: { name, icon, banner, type, members },
		});
		return res
			.status(HTTP.status.CREATED)
			.json({ message: HTTP.message.SUCCESS, data: createdGroup });
	}
	public static async updateGroupDetails(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const id = genericParse(getNonEmptyString, req.group?.id);
		const name = safeParse(getNonEmptyString, req.body.name) || "";
		const icon = safeParse(getNonEmptyString, req.body.icon) || "";
		const banner = safeParse(getNonEmptyString, req.body.banner) || "";
		const type = safeParse(getNonEmptyString, req.body.type) || "";
		const members = safeParse(getArray<string>, req.body.members);
		const updateBody: Partial<Group> = {};
		if (name) updateBody["name"] = name;
		if (icon) updateBody["icon"] = icon;
		if (banner) updateBody["banner"] = banner;
		if (type) updateBody["type"] = type;
		if (members) updateBody["members"] = members;
		const updatedGroup = await GroupService.updateGroupDetails({
			groupId: id,
			authorId: loggedInUserId,
			updateBody,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: updatedGroup });
	}
	public static async deleteGroup(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const groupId = genericParse(getNonEmptyString, req.group?.id);
		const deletedGroup = await GroupService.deleteGroup({
			groupId,
			loggedInUserId,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: deletedGroup });
	}
	public static async getBalancesSummary(req: ApiRequest, res: ApiResponse) {
		const groupId = genericParse(getNonEmptyString, req.group?.id);
		const groupSummary = await GroupService.getGroupSummary(groupId);
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: groupSummary,
		});
	}
	public static async getAllTransactions(req: ApiRequest, res: ApiResponse) {
		const groupId = genericParse(getNonEmptyString, req.group?.id);
		const allTransactionsForGroup =
			await GroupService.getAllGroupTransactions(groupId);
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: allTransactionsForGroup,
		});
	}
	public static async addMembers(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const groupId = genericParse(getNonEmptyString, req.group?.id);
		const members = genericParse(getArray<string>, req.body.members);
		const updatedGroup = await GroupService.addMembersInGroup({
			loggedInUserId,
			groupId,
			members,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: updatedGroup });
	}
}
