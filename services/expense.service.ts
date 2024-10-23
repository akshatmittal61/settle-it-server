import { cache, getCacheKey } from "../cache";
import { cacheParameter } from "../constants";
import { expenseRepo } from "../repo";
import { IExpense } from "../types";

export class ExpenseService {
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
