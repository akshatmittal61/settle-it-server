import { cache, getCacheKey } from "../cache";
import { cacheParameter, HTTP } from "../constants";
import { ApiError } from "../errors";
import { expenseRepo, groupRepo, memberRepo, userRepo } from "../repo";
import { IBalancesSummary, IGroup, IUser, Transaction } from "../types";
import { getNonNullValue } from "../utils";
import { sendEmailTemplate } from "./email";
import { ExpenseService } from "./expense.service";

export class GroupService {
	public static async clear(id: string): Promise<boolean> {
		const group = await groupRepo.findById(id);
		if (!group) return false;
		await Promise.all([
			memberRepo.bulkRemove({ groupId: id }),
			expenseRepo.removeMultiple({ groupId: id }),
		]);
		return true;
	}
	public static async addMembers(
		groupId: string,
		newMembers: Array<string>
	): Promise<IGroup | null> {
		const updatedGroup = await groupRepo.update(
			{ id: groupId },
			{ $push: { members: { $each: newMembers } } }
		);
		return updatedGroup;
	}
	public static async removeMembers(
		groupId: string,
		members: Array<string>
	): Promise<IGroup | null> {
		const updatedGroup = await groupRepo.update(
			{ id: groupId },
			{ $pull: { members: { $in: members } } }
		);
		return updatedGroup;
	}
	public static async getGroupsUserIsPartOf(
		userId: string
	): Promise<Array<IGroup>> {
		const groups = await cache.fetch(
			getCacheKey(cacheParameter.USER_GROUPS, { userId }),
			() => groupRepo.find({ members: { $in: [userId] } })
		);
		if (!groups) return [];
		return groups;
	}
	public static async getGroupDetailsForUser(
		userId: string,
		id: string
	): Promise<IGroup | null> {
		const group = await cache.fetch(
			getCacheKey(cacheParameter.GROUP, { id }),
			() => groupRepo.findById(id)
		);
		if (!group) return null;
		if (!group.members.map((member) => member.id).includes(userId)) {
			throw new ApiError(
				HTTP.status.FORBIDDEN,
				"User is not a member of this group"
			);
		}
		return group;
	}
	public static async getGroupExpenses(userId: string, groupId: string) {
		const groupDetails = await GroupService.getGroupDetailsForUser(
			userId,
			groupId
		);
		const expenses = await ExpenseService.getExpensesForGroup(groupId);
		if (!groupDetails || !expenses) return [];
		return expenses;
	}
	public static async sendInvitationToUsers(
		group: { name: string; id: string },
		users: Array<string>,
		invitedBy: string
	): Promise<void> {
		const invitedByUser = await userRepo.findById(invitedBy);
		const allUsers = await userRepo.find({ _id: { $in: users } });
		if (!allUsers || !invitedByUser || !group) {
			throw new ApiError(
				HTTP.status.NOT_FOUND,
				"Could not send invitation to users"
			);
		}
		await Promise.all(
			allUsers.map((user) => {
				return sendEmailTemplate(
					user.email,
					`${invitedByUser.name} has added you to ${group.name}`,
					"USER_ADDED_TO_GROUP",
					{
						invitedBy: {
							email: invitedByUser.email,
							name: invitedByUser.name,
						},
						group: {
							id: group.id,
							name: group.name,
						},
					}
				);
			})
		);
	}
	public getOwedBalances(
		transactions: Array<Transaction>,
		usersMap: Map<string, IUser>
	): IBalancesSummary["owes"] {
		// build the map for all the amount that is still owed by every user
		const owesMap = new Map<
			string,
			{ transactions: { user: string; amount: number }[] }
		>();
		transactions.forEach((transaction) => {
			const from = transaction.from;
			const to = transaction.to;
			const fromInOwesMap = owesMap.get(from);
			const toInOwesMap = owesMap.get(to);
			if (transaction.owed !== 0) {
				if (fromInOwesMap && toInOwesMap) {
					const fromInToBucketOfOwesMap =
						toInOwesMap.transactions.find(
							(t: any) => t.user === from
						);
					if (fromInToBucketOfOwesMap) {
						const prevAmount = fromInToBucketOfOwesMap.amount;
						const newAmount = transaction.owed;
						if (prevAmount === newAmount) {
							// remove 'from' from 'to' bucket
							toInOwesMap.transactions =
								toInOwesMap.transactions.filter(
									(t: any) => t.user !== from
								);
						} else if (prevAmount > newAmount) {
							// reduce amount of 'from' in 'to' bucket
							fromInToBucketOfOwesMap.amount =
								prevAmount - newAmount;
						} else if (prevAmount < newAmount) {
							// remove 'from' from 'to' bucket and add reduced amount to 'from' bucket
							toInOwesMap.transactions =
								toInOwesMap.transactions.filter(
									(t: any) => t.user !== from
								);
							fromInOwesMap.transactions.push({
								user: to,
								amount: newAmount - prevAmount,
							});
						}
					} else {
						fromInOwesMap.transactions.push({
							user: to,
							amount: transaction.owed,
						});
					}
				} else if (fromInOwesMap) {
					fromInOwesMap.transactions.push({
						user: to,
						amount: transaction.owed,
					});
				} else if (toInOwesMap) {
					const fromInToBucketOfOwesMap =
						toInOwesMap.transactions.find(
							(t: any) => t.user === from
						);
					if (fromInToBucketOfOwesMap) {
						const prevAmount = fromInToBucketOfOwesMap.amount;
						const newAmount = transaction.owed;
						if (prevAmount === newAmount) {
							// remove 'from' from 'to' bucket
							toInOwesMap.transactions =
								toInOwesMap.transactions.filter(
									(t: any) => t.user !== from
								);
						} else if (prevAmount > newAmount) {
							fromInToBucketOfOwesMap.amount =
								prevAmount - newAmount;
						} else {
							// kick 'from' from the bucket
							toInOwesMap.transactions =
								toInOwesMap.transactions.filter(
									(t: any) => t.user !== from
								);
							// add 'to' to the map
							owesMap.set(from, {
								transactions: [
									{
										user: to,
										amount: newAmount - prevAmount,
									},
								],
							});
						}
					} else {
						owesMap.set(from, {
							transactions: [
								{
									user: to,
									amount: transaction.owed,
								},
							],
						});
					}
				} else {
					owesMap.set(from, {
						transactions: [
							{
								user: to,
								amount: transaction.owed,
							},
						],
					});
				}
			}
		});
		// populate the owes array with all the users
		const owesArray = Array.from(owesMap, ([fromUser, fromUserObject]) => ({
			user: fromUser,
			...fromUserObject,
		}))
			.map((obj) => {
				return {
					user: getNonNullValue(usersMap.get(obj.user)),
					amount: obj.transactions
						.map((t) => t.amount)
						.reduce((a, b) => a + b, 0),
					transactions: obj.transactions.map((t) => {
						return {
							user: getNonNullValue(usersMap.get(t.user)),
							amount: t.amount,
						};
					}),
				};
			})
			.filter((obj) => obj.amount > 0 && obj.transactions.length > 0);

		return owesArray;
	}

	public getSummaryBalances(
		transactions: Array<Transaction>,
		usersMap: Map<string, IUser>
	): IBalancesSummary["balances"] {
		// build the map for the summary for every user
		const balancesMap = new Map<
			string,
			{ transactions: { user: string; gives: number; gets: number }[] }
		>();
		transactions.forEach((transaction) => {
			const from = transaction.from;
			const to = transaction.to;
			const fromInBalancesMap = balancesMap.get(from);
			const toInBalancesMap = balancesMap.get(to);
			if (fromInBalancesMap && toInBalancesMap) {
				const fromInToBucketOfBalancesMap =
					toInBalancesMap.transactions.find((t) => t.user === from);
				const toInFromBucketOfBalancesMap =
					fromInBalancesMap.transactions.find((t) => t.user === to);
				if (
					fromInToBucketOfBalancesMap &&
					toInFromBucketOfBalancesMap
				) {
					const prevAmount = fromInToBucketOfBalancesMap.gives;
					const newAmount = transaction.paid + transaction.owed;
					if (prevAmount === newAmount) {
						// kick both from each others bucket
						toInBalancesMap.transactions =
							toInBalancesMap.transactions.filter(
								(t) => t.user !== from
							);
						fromInBalancesMap.transactions =
							fromInBalancesMap.transactions.filter(
								(t) => t.user !== to
							);
					} else if (prevAmount > newAmount) {
						fromInToBucketOfBalancesMap.gives =
							prevAmount - newAmount;
						toInFromBucketOfBalancesMap.gets =
							prevAmount - newAmount;
					} else {
						fromInToBucketOfBalancesMap.gives = 0;
						fromInToBucketOfBalancesMap.gets =
							newAmount - prevAmount;
						toInFromBucketOfBalancesMap.gives =
							newAmount - prevAmount;
						toInFromBucketOfBalancesMap.gets = 0;
					}
				} else {
					fromInBalancesMap.transactions.push({
						user: to,
						gives: transaction.paid + transaction.owed,
						gets: 0,
					});
					toInBalancesMap.transactions.push({
						user: from,
						gives: 0,
						gets: transaction.paid + transaction.owed,
					});
				}
			} else if (fromInBalancesMap) {
				fromInBalancesMap.transactions.push({
					user: to,
					gives: transaction.paid + transaction.owed,
					gets: 0,
				});
				balancesMap.set(to, {
					transactions: [
						{
							user: from,
							gives: 0,
							gets: transaction.paid + transaction.owed,
						},
					],
				});
			} else if (toInBalancesMap) {
				toInBalancesMap.transactions.push({
					user: from,
					gives: 0,
					gets: transaction.paid + transaction.owed,
				});
				balancesMap.set(from, {
					transactions: [
						{
							user: to,
							gives: transaction.paid + transaction.owed,
							gets: 0,
						},
					],
				});
			} else {
				balancesMap.set(from, {
					transactions: [
						{
							user: to,
							gives: transaction.paid + transaction.owed,
							gets: 0,
						},
					],
				});
				balancesMap.set(to, {
					transactions: [
						{
							user: from,
							gives: 0,
							gets: transaction.paid + transaction.owed,
						},
					],
				});
			}
		});
		// populate the summary array with all the users
		const balancesArray = Array.from(
			balancesMap,
			([fromUser, fromUserObject]) => {
				const gives = fromUserObject.transactions
					.map((t: any) => t.gives)
					.reduce((a: number, b: number) => a + b, 0);
				const gets = fromUserObject.transactions
					.map((t: any) => t.gets)
					.reduce((a: number, b: number) => a + b, 0);
				const givesInTotal = gives > gets ? gives - gets : 0;
				const getsInTotal = gets > gives ? gets - gives : 0;
				return {
					user: fromUser,
					gives: givesInTotal,
					gets: getsInTotal,
					...fromUserObject,
				};
			}
		)
			.filter((obj) => obj.gives > 0 || obj.gets > 0)
			.map((obj) => {
				return {
					user: getNonNullValue(usersMap.get(obj.user)),
					gives: obj.gives,
					gets: obj.gets,
					transactions: obj.transactions.map((t) => {
						return {
							user: getNonNullValue(usersMap.get(t.user)),
							gives: t.gives,
							gets: t.gets,
						};
					}),
				};
			});

		return balancesArray;
	}
}
