import { getCacheKey } from "../cache";
import { cacheParameter, HTTP } from "../constants";
import { ApiError } from "../errors";
import { expenseRepo, memberRepo } from "../repo";
import { IBalancesSummary, IMember } from "../types";
import { ExpenseService } from "./expense.service";
import { GroupService } from "./group.service";
import { UserService } from "./user.service";

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
	public static async settleOwedMembersInGroup({
		userA,
		userB,
		groupId,
		loggedInUserId,
	}: {
		userA: string;
		userB: string;
		groupId: string;
		loggedInUserId: string;
	}): Promise<IBalancesSummary["owes"]> {
		if (loggedInUserId !== userA && loggedInUserId !== userB) {
			throw new ApiError(
				HTTP.status.FORBIDDEN,
				"You can't settle someone else's expenses"
			);
		}
		const foundGroup = await GroupService.getGroupById(groupId);
		if (!foundGroup) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Group not found");
		}
		await MemberService.settleAllBetweenUsers(foundGroup.id, userA, userB);
		const allTransactionsForGroup =
			await memberRepo.getAllTransactionsSummaryForGroup(groupId);
		// get all users in this group
		const membersIds = Array.from(
			new Set(
				allTransactionsForGroup
					.map((t) => t.from)
					.concat(allTransactionsForGroup.map((t) => t.to))
			)
		);
		const usersMap = await UserService.getUsersMapForUserIds(membersIds);
		const owed = GroupService.getOwedBalances(
			allTransactionsForGroup,
			usersMap
		);
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: foundGroup.id,
			})
		);
		return owed;
	}
}
