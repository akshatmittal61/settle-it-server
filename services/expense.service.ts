import { cache, getCacheKey } from "../cache";
import { cacheParameter, HTTP } from "../constants";
import { ApiError } from "../errors";
import { expenseRepo, groupRepo, memberRepo } from "../repo";
import { IExpense } from "../types";

export class ExpenseService {
	public static async getExpenseById(id: string): Promise<IExpense | null> {
		const expense = await cache.fetch(
			getCacheKey(cacheParameter.EXPENSE, { id }),
			() => expenseRepo.findById(id)
		);
		return expense;
	}
	public static async getExpensesForUser(
		userId: string
	): Promise<Array<IExpense>> {
		const groups = await groupRepo.find({
			members: { $in: [userId] },
		});
		const groupIds = groups ? groups.map((group) => group.id) : [];
		const expenses = await expenseRepo.find({
			groupId: { $in: groupIds },
		});
		if (!expenses) return [];
		return expenses;
	}
	public static async getExpensesForGroup(
		groupId: string
	): Promise<Array<IExpense>> {
		const expenses = await cache.fetch(
			getCacheKey(cacheParameter.GROUP_EXPENSES, { groupId }),
			() => expenseRepo.getExpensesForGroup(groupId)
		);
		if (!expenses) return [];
		return expenses;
	}
	public static async settleMemberInExpense({
		expenseId,
		memberId,
		loggedInUserId,
	}: {
		expenseId: string;
		memberId: string;
		loggedInUserId: string;
	}) {
		const foundExpense = await ExpenseService.getExpenseById(expenseId);
		if (!foundExpense) throw new Error("Expense not found");
		if (foundExpense.paidBy.id !== loggedInUserId) {
			throw new ApiError(
				HTTP.status.FORBIDDEN,
				"You did not paid for this expense"
			);
		}
		const settledMember = await memberRepo.settleOne({
			expenseId,
			userId: memberId,
		});
		if (!settledMember)
			throw new ApiError(HTTP.status.NOT_FOUND, "Member not found");
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: foundExpense.group.id,
			})
		);
		cache.invalidate(
			getCacheKey(cacheParameter.EXPENSE, { id: foundExpense.id })
		);
		return settledMember;
	}
}
