import { EXPENSE_STATUS, HTTP } from "../constants";
import { ExpenseService } from "../services";
import { ApiRequest, ApiResponse, T_EXPENSE_STATUS } from "../types";
import {
	genericParse,
	getArray,
	getNonEmptyString,
	getNonNegativeNumber,
	safeParse,
} from "../utils";

export class ExpenseController {
	public static async createExpense(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const title = genericParse(getNonEmptyString, req.body.title);
		const amount = genericParse(getNonNegativeNumber, req.body.amount);
		const groupId = genericParse(getNonEmptyString, req.group?.id);
		const paidBy =
			safeParse(getNonEmptyString, req.body.paidBy) || loggedInUserId;
		const paidOn =
			safeParse(getNonEmptyString, req.body.paidOn) ||
			new Date().toISOString();
		const description =
			safeParse(getNonEmptyString, req.body.description) || "";
		const members = genericParse(
			getArray<{ userId: string; amount: number }>,
			req.body.members
		);
		const createdExpense = await ExpenseService.createExpense({
			body: { title, amount, groupId, paidBy, paidOn, description },
			loggedInUserId,
			members,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: createdExpense });
	}
	public static async updateExpense(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const expenseId = genericParse(getNonEmptyString, req.params.expenseId);
		const title = safeParse(getNonEmptyString, req.body.title);
		const amount = safeParse(getNonNegativeNumber, req.body.amount);
		const paidBy = safeParse(getNonEmptyString, req.body.paidBy);
		const paidOn = safeParse(getNonEmptyString, req.body.paidOn);
		const description = safeParse(getNonEmptyString, req.body.description);
		const status = safeParse(
			(s: T_EXPENSE_STATUS) => EXPENSE_STATUS[s],
			req.body.status
		);
		const members = safeParse(
			getArray<{ userId: string; amount: number }>,
			req.body.members
		);
		const updatedExpense = await ExpenseService.updateExpense({
			id: expenseId,
			loggedInUserId,
			title,
			amount,
			paidBy,
			description,
			paidOn,
			status,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: updatedExpense });
	}
	public static async removeExpense(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const expenseId = genericParse(getNonEmptyString, req.params.expenseId);
		const removedExpense = await ExpenseService.removeExpense({
			expenseId,
			loggedInUserId,
		});
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: removedExpense,
		});
	}
	public static async settleExpense(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const expenseId = genericParse(getNonEmptyString, req.params.expenseId);
		const updatedMembersInfo = await ExpenseService.settleExpense({
			expenseId,
			loggedInUserId,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: updatedMembersInfo });
	}
	public static async memberPaidAmount(req: ApiRequest, res: ApiResponse) {
		const loggedInUserId = genericParse(getNonEmptyString, req.user?.id);
		const memberId = genericParse(getNonEmptyString, req.params.memberId);
		const paidAmount = genericParse(
			getNonNegativeNumber,
			req.body.paidAmount
		);
		const updatedMembersInfo = await ExpenseService.memberPaidForExpense({
			memberId,
			loggedInUserId,
			paidAmount,
		});
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS, data: updatedMembersInfo });
	}
}
