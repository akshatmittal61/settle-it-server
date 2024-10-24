import { expenseRepo, memberRepo } from "../repo";

export class MemberService {
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
