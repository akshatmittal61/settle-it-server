import { HTTP } from "../constants";
import { ApiError } from "../errors";
import { expenseRepo, memberRepo } from "../repo";
import { IMember } from "../types";
import { ExpenseService } from "./expense.service";

export class MemberService {
	public static async getMembersOfExpense(
		expenseId: string
	): Promise<Array<IMember>> {
		const foundExpense = await ExpenseService.getExpenseById(expenseId);
		if (!foundExpense)
			throw new ApiError(HTTP.status.NOT_FOUND, "Expense not found");
		const foundMembers = await memberRepo.find({ expenseId });
		if (!foundMembers) return [];
		return foundMembers;
	}
	public static async settleAllBetweenUsers(
		group: string,
		userA: string,
		userB: string
	) {
		const [expensesPaidByUserA, expensesPaidByUserB] = await Promise.all([
			expenseRepo.find({
				paidBy: userA,
				groupId: group,
			}),
			expenseRepo.find({
				paidBy: userB,
				groupId: group,
			}),
		]);
		const settlingProcesses = [];
		if (expensesPaidByUserB) {
			settlingProcesses.push(
				memberRepo.settleMany({
					userId: userA,
					groupId: group,
					expenseId: {
						$in: expensesPaidByUserB.map((e) => e.id),
					},
				})
			);
		}
		if (expensesPaidByUserA) {
			settlingProcesses.push(
				memberRepo.settleMany({
					userId: userB,
					groupId: group,
					expenseId: {
						$in: expensesPaidByUserA.map((e) => e.id),
					},
				})
			);
		}
		await Promise.all([settlingProcesses]);
	}
}
