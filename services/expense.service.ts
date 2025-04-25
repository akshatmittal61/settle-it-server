import { cache, getCacheKey } from "../cache";
import { cacheParameter, EXPENSE_STATUS, HTTP } from "../constants";
import { ApiError } from "../errors";
import { expenseRepo, memberRepo } from "../repo";
import {
	CreateModel,
	Expense,
	IExpense,
	IMember,
	Member,
	T_EXPENSE_STATUS,
	UpdateQuery,
} from "../types";
import { isSubset } from "../utils";
import { GroupService } from "./group.service";
import { MemberService } from "./member.service";

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
		const groups = await GroupService.getGroupsUserIsPartOf(userId);
		const groupIds = groups ? groups.map((group) => group.id) : [];
		const expenses = await expenseRepo.getExpensesForGroups(groupIds);
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
	public static async createExpense({
		body,
		loggedInUserId,
		members,
	}: {
		body: Omit<CreateModel<Expense>, "createdBy">;
		loggedInUserId: string;
		members: Array<{ userId: string; amount: number }>;
	}): Promise<IExpense> {
		const totalDistributedAmount = members
			.map((member) => member.amount)
			.reduce((a, b) => a + b, 0);
		// check if amount distributed among members is equal to expense amount
		if (totalDistributedAmount !== body.amount) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Total amount distributed doesn't match"
			);
		}
		// check if it is a valid group
		const foundGroup = await GroupService.getGroupById(
			body.groupId.toString()
		);
		if (!foundGroup) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Group not found");
		}
		const existingMemberIds = foundGroup.members.map((m) => m.id);
		const includedMembers = members.filter((member) => member.amount > 0);
		if (
			!isSubset(
				includedMembers.map((member) => member.userId),
				existingMemberIds
			)
		) {
			// check if all sent members are in the group
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Some members are not in the group"
			);
		}
		const payload = { ...body, createdBy: loggedInUserId };
		const createdExpense = await expenseRepo.create(payload);
		// initially, all members are pending, and they have to pay the expense
		const membersForCurrentExpense: Array<CreateModel<Member>> =
			includedMembers.map((member) => ({
				userId: member.userId,
				groupId: body.groupId.toString(),
				expenseId: createdExpense.id,
				amount: member.amount,
				owed: member.userId === body.paidBy ? 0 : member.amount,
				paid: member.userId === body.paidBy ? member.amount : 0,
			}));
		await memberRepo.bulkCreate(membersForCurrentExpense);
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: body.groupId,
			})
		);
		return createdExpense;
	}
	public static async updateExpense({
		id,
		loggedInUserId,
		title,
		amount,
		paidBy,
		paidOn,
		description,
		status,
		members,
	}: {
		id: string;
		loggedInUserId: string;
		title?: string | null;
		amount?: number | null;
		paidBy?: string | null;
		paidOn?: string | null;
		description?: string | null;
		status?: T_EXPENSE_STATUS | null;
		members?: Array<{ userId: string; amount: number }> | null;
	}): Promise<IExpense> {
		// if amount is updated, members should be sent as well for validation
		if ((amount !== null || amount !== undefined) && members === null) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				HTTP.message.BAD_REQUEST
			);
		}
		if (amount !== null && members !== null && members !== undefined) {
			const totalDistributedAmount = members
				.map((member) => member.amount)
				.reduce((a, b) => a + b, 0);
			// check if amount distributed among members is equal to expense amount
			if (totalDistributedAmount !== amount) {
				throw new ApiError(
					HTTP.status.BAD_REQUEST,
					"Total amount distributed doesn't match"
				);
			}
		}
		const foundExpense = await ExpenseService.getExpenseById(id);
		if (!foundExpense)
			throw new ApiError(HTTP.status.NOT_FOUND, "Expense not found");
		// the user can only edit expense if
		// - it is created by the user
		// - or it is paid by the user
		if (
			foundExpense.createdBy.id !== loggedInUserId &&
			foundExpense.paidBy.id !== loggedInUserId
		) {
			throw new ApiError(HTTP.status.FORBIDDEN, "Forbidden");
		}
		const groupId = foundExpense.group.id;
		const foundGroup = await GroupService.getGroupById(groupId);
		if (!foundGroup) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Group not found");
		}
		if (amount !== null && members !== null && members !== undefined) {
			// check if all sent members are in the group
			if (
				!isSubset(
					members.map((m) => m.userId),
					foundGroup.members.map((m) => m.id)
				)
			) {
				throw new ApiError(
					HTTP.status.BAD_REQUEST,
					"Some members are not in the group"
				);
			}
			const currentMembersOfExpense = await memberRepo.find({
				expenseId: id,
			});
			if (currentMembersOfExpense === null) {
				if (members.length > 0) {
					const membersToCreateForCurrentExpense: Array<
						CreateModel<Member>
					> = members.map((member) => ({
						userId: member.userId,
						groupId,
						expenseId: id,
						amount: member.amount,
						owed:
							member.userId === (paidBy || foundExpense.paidBy.id)
								? 0
								: member.amount,
						paid:
							member.userId === (paidBy || foundExpense.paidBy.id)
								? member.amount
								: 0,
					}));
					await memberRepo.bulkCreate(
						membersToCreateForCurrentExpense
					);
				}
			} else {
				const membersToUpdateForCurrentExpense: Array<
					UpdateQuery<Member>
				> = [];
				const membersToRemoveForCurrentExpense: Array<Partial<Member>> =
					[];
				currentMembersOfExpense.forEach((member) => {
					const foundMember = members.find(
						(m) => m.userId === member.user.id
					);
					if (foundMember) {
						membersToUpdateForCurrentExpense.push({
							id: member.id,
							userId: member.user.id,
							groupId: member.group.id,
							expenseId: member.expense.id,
							amount: foundMember.amount,
							owed:
								foundMember.userId ===
								(paidBy ?? foundExpense.paidBy.id)
									? 0
									: foundMember.amount,
							paid:
								foundMember.userId ===
								(paidBy ?? foundExpense.paidBy.id)
									? foundMember.amount
									: 0,
						});
					} else {
						membersToRemoveForCurrentExpense.push({
							id: member.id,
							userId: member.user.id,
							groupId: member.group.id,
							expenseId: member.expense.id,
						});
					}
				});
				const membersToCreateForCurrentExpense: Array<
					CreateModel<Member>
				> = members
					.filter(
						(m) =>
							!currentMembersOfExpense
								.map((m) => m.user.id)
								.includes(m.userId)
					)
					.map((member) => ({
						userId: member.userId,
						groupId,
						expenseId: id,
						amount: member.amount,
						owed:
							member.userId === (paidBy ?? foundExpense.paidBy.id)
								? 0
								: member.amount,
						paid:
							member.userId === (paidBy ?? foundExpense.paidBy.id)
								? member.amount
								: 0,
					}));
				if (membersToCreateForCurrentExpense.length > 0) {
					await memberRepo.bulkCreate(
						membersToCreateForCurrentExpense
					);
				}
				if (membersToRemoveForCurrentExpense.length > 0) {
					await memberRepo.bulkRemove({
						_id: {
							$in: membersToRemoveForCurrentExpense.map(
								(m) => m.id
							),
						},
					});
				}
				if (membersToUpdateForCurrentExpense.length > 0) {
					await memberRepo.bulkUpdate(
						membersToUpdateForCurrentExpense.map((m) => ({
							filter: { _id: m.id },
							update: {
								$set: {
									amount: m.amount,
									owed: m.owed,
									paid: m.paid,
								},
							},
						}))
					);
				}
			}
		}
		const updatedExpenseBody: Partial<Expense> = {};
		if (title) updatedExpenseBody.title = title;
		if (amount) updatedExpenseBody.amount = amount;
		if (description) updatedExpenseBody.description = description;
		if (paidOn) updatedExpenseBody.paidOn = paidOn;
		if (paidBy) {
			// person who paid should be a part of the group
			if (
				!isSubset(
					[paidBy],
					foundGroup.members.map((m) => m.id)
				)
			) {
				throw new ApiError(
					HTTP.status.BAD_REQUEST,
					"Person who paid should be a part of the group"
				);
			}
			updatedExpenseBody.paidBy = paidBy;
		}
		if (status) {
			if (status === EXPENSE_STATUS.SETTLED) {
				await memberRepo.settleMany({ expenseId: id });
			}
		}
		const updatedExpense = await expenseRepo.update(
			{ id },
			updatedExpenseBody
		);
		if (!updatedExpense) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Expense not found");
		}
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: updatedExpense?.group.id,
			})
		);
		cache.invalidate(
			getCacheKey(cacheParameter.EXPENSE, { id: updatedExpense?.id })
		);
		return updatedExpense;
	}
	public static async removeExpense({
		expenseId,
		loggedInUserId,
	}: {
		expenseId: string;
		loggedInUserId: string;
	}) {
		const foundExpense = await ExpenseService.getExpenseById(expenseId);
		if (!foundExpense)
			throw new ApiError(HTTP.status.NOT_FOUND, "Expense not found");
		if (
			foundExpense.createdBy.id !== loggedInUserId &&
			foundExpense.paidBy.id !== loggedInUserId
		) {
			throw new ApiError(HTTP.status.FORBIDDEN, HTTP.message.FORBIDDEN);
		}
		// remove all members for the current expense
		await memberRepo.bulkRemove({ expenseId });
		const removedExpense = await expenseRepo.remove({ id: expenseId });
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: foundExpense.group.id,
			})
		);
		cache.del(getCacheKey(cacheParameter.EXPENSE, { id: expenseId }));
		return removedExpense;
	}
	public static async settleExpense({
		expenseId,
		loggedInUserId,
	}: {
		expenseId: string;
		loggedInUserId: string;
	}): Promise<Array<IMember>> {
		const foundExpense = await ExpenseService.getExpenseById(expenseId);
		if (!foundExpense) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Expense not found");
		}
		if (foundExpense.paidBy.id !== loggedInUserId)
			throw new ApiError(
				HTTP.status.FORBIDDEN,
				"Only the person who paid can settle"
			);
		await memberRepo.settleMany({ expenseId });
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: foundExpense.group.id,
			})
		);
		cache.invalidate(
			getCacheKey(cacheParameter.EXPENSE, { id: expenseId })
		);
		return MemberService.getMembersOfExpense(expenseId);
	}
	public static async memberPaidForExpense({
		memberId,
		loggedInUserId,
		paidAmount,
	}: {
		memberId: string;
		loggedInUserId: string;
		paidAmount: number;
	}): Promise<Array<IMember>> {
		const foundMember = await memberRepo.findById(memberId);
		if (!foundMember) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Member not found");
		}
		const foundExpense = await ExpenseService.getExpenseById(
			foundMember.expense.id
		);
		if (!foundExpense) {
			throw new ApiError(HTTP.status.NOT_FOUND, "Expense not found");
		}
		if (foundExpense.paidBy.id !== loggedInUserId) {
			throw new ApiError(
				HTTP.status.FORBIDDEN,
				"Only the person who paid can settle"
			);
		}
		if (foundMember.owed === paidAmount) {
			await memberRepo.settleOne({
				expenseId: foundMember.expense.id,
				id: memberId,
			});
		} else {
			await memberRepo.update(
				{ id: memberId },
				{
					owed: foundMember.owed - paidAmount,
					paid: foundMember.paid + paidAmount,
				}
			);
		}
		cache.invalidate(
			getCacheKey(cacheParameter.GROUP_EXPENSES, {
				groupId: foundExpense.group.id,
			})
		);
		cache.invalidate(
			getCacheKey(cacheParameter.EXPENSE, { id: foundExpense?.id })
		);
		return MemberService.getMembersOfExpense(foundMember.expense.id);
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
			id: memberId,
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
