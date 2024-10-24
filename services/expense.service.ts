import { cache, getCacheKey } from "../cache";
import { cacheParameter } from "../constants";
import { expenseRepo, groupRepo } from "../repo";
import { IExpense } from "../types";

export class ExpenseService {
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
}
