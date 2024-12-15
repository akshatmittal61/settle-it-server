import { MemberModel } from "../models";
import {
	CreateModel,
	FilterQuery,
	IExpense,
	IGroup,
	IMember,
	ITransaction,
	IUser,
	Member,
	ObjectId,
	Transaction,
	UpdateQuery,
} from "../types";
import {
	getNonNullValue,
	getNumber,
	getObjectFromMongoResponse,
	omitKeys,
} from "../utils";
import { BaseRepo } from "./base";

class MemberRepo extends BaseRepo<Member, IMember> {
	protected model = MemberModel;
	public parser(member: Member | null): IMember | null {
		if (!member) return null;
		const parsed = getObjectFromMongoResponse<Member>(member);
		if (!parsed) return null;
		return {
			...omitKeys(parsed, ["userId", "groupId", "expenseId"]),
			user: getObjectFromMongoResponse<IUser>(parsed.userId),
			group: getObjectFromMongoResponse<IGroup>(parsed.groupId),
			expense: getObjectFromMongoResponse<IExpense>(parsed.expenseId),
		};
	}

	public async findOne(query: Partial<Member>): Promise<IMember | null> {
		const res = await this.model
			.findOne<Member>(query)
			.populate("userId groupId expenseId");
		return this.parser(res);
	}

	public async findById(id: string): Promise<IMember | null> {
		const res = await this.model
			.findById<Member>(id)
			.populate("userId groupId expenseId")
			.catch((error: any) => {
				if (error.kind === "ObjectId") return null;
				throw error;
			});
		return this.parser(res);
	}

	public async find(
		query: FilterQuery<Member>
	): Promise<Array<IMember> | null> {
		const res = await this.model
			.find<Member>(query)
			.populate("userId groupId expenseId");
		const parsedRes = res.map(this.parser).filter((obj) => obj !== null);
		if (parsedRes.length > 0) return parsedRes;
		return null;
	}

	public async findAll(): Promise<Array<IMember>> {
		const res = await this.model
			.find<Member>({})
			.sort({ createdAt: -1 })
			.populate("userId groupId expenseId");
		const parsedRes = res.map(this.parser).filter((obj) => obj !== null);
		if (parsedRes.length > 0) return parsedRes;
		return [];
	}

	public async create(body: CreateModel<Member>): Promise<IMember> {
		const res = await this.model.create<CreateModel<Member>>(body);
		await res.populate("userId groupId expenseId");
		return getNonNullValue(this.parser(res));
	}

	public async update(
		query: FilterQuery<Member>,
		update: UpdateQuery<Member>
	): Promise<IMember | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndUpdate<Member>(filter, update, { new: true })
			.populate("userId groupId expenseId");
		return this.parser(res);
	}

	public async remove(query: Partial<Member>): Promise<IMember | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndDelete<Member>(filter)
			.populate("userId groupId expenseId");
		return this.parser(res);
	}

	public async bulkCreate(
		body: Array<CreateModel<Member>>
	): Promise<Array<IMember>> {
		const res = await this.model.insertMany<CreateModel<Member>>(body);
		res.map(async (obj) => await obj.populate("userId groupId expenseId"));
		return res.map(this.parser).filter((obj) => obj !== null);
	}

	public async bulkUpdate(
		body: Array<FilterQuery<Member> & UpdateQuery<Member>>
	): Promise<any> {
		const res = await this.model.bulkWrite<Member>(
			body.map((obj) => ({
				updateOne: {
					filter: obj.filter,
					update: obj.update,
				},
			}))
		);
		return res;
	}

	public async bulkRemove(query: FilterQuery<Member>): Promise<number> {
		const res = await this.model.deleteMany(query);
		return res.deletedCount;
	}

	public async settleOne(query: Partial<Member>): Promise<IMember | null> {
		const updateRequest = [
			{
				$set: {
					paid: { $add: ["$paid", "$owed"] },
					owed: 0,
				},
			},
		];
		return this.update(query, updateRequest);
	}

	public async settleMany(query: FilterQuery<Member>): Promise<number> {
		const members = await this.find(query);
		if (!members || members.length === 0) return 0;
		const res = await this.model.bulkWrite(
			members.map((member) => ({
				updateOne: {
					filter: { _id: member.id },
					update: {
						$set: {
							owed: 0,
							paid: member.amount,
						},
					},
				},
			}))
		);
		return res.modifiedCount;
	}
	public async getAllTransactionsSummaryForGroup(
		groupId: string
	): Promise<Array<Transaction>> {
		const result = await this.model.aggregate([
			// get members involved in this group
			{
				$match: {
					groupId: new ObjectId(groupId),
				},
			},
			// populate expenses in every member
			{
				$lookup: {
					from: "expenses",
					localField: "expenseId",
					foreignField: "_id",
					as: "expense",
				},
			},
			// only get first expense from the array
			{
				$unwind: "$expense",
			},
			// group by member.userId and member.expense.paidBy
			{
				$group: {
					_id: {
						userId: "$userId",
						expensePaidBy: "$expense.paidBy",
					},
					totalOwed: { $sum: "$owed" },
					totalPaid: { $sum: "$paid" },
				},
			},
		]);
		// buld the summary array of 'from-to-stillOwes-hasPaid'
		const transactions: Array<Transaction> = result
			.map((a) => ({
				from: a._id.userId.toString(),
				to: a._id.expensePaidBy.toString(),
				stillOwes: a.totalOwed,
				hasPaid: a.totalPaid,
			}))
			.filter((a) => a.from !== a.to)
			.filter((a) => a.stillOwes > 0 || a.hasPaid > 0)
			.map((a) => ({
				from: a.from,
				to: a.to,
				owed: a.stillOwes,
				paid: a.hasPaid,
			}));
		return transactions;
	}
	public async getAllTransactionsForGroup(
		groupId: string
	): Promise<Array<ITransaction>> {
		const result = await this.model.aggregate([
			// get members involved in this group
			{
				$match: {
					groupId: new ObjectId(groupId),
				},
			},
			// populate expenses in every member
			{
				$lookup: {
					from: "expenses",
					localField: "expenseId",
					foreignField: "_id",
					as: "expense",
				},
			},
			// only get first expense from the array
			{
				$unwind: "$expense",
			},
			// populate user
			{
				$lookup: {
					from: "users",
					localField: "userId",
					foreignField: "_id",
					as: "user",
				},
			},
			// only get first user from the array
			{
				$unwind: "$user",
			},
			// populate expense.paidBy
			{
				$lookup: {
					from: "users",
					localField: "expense.paidBy",
					foreignField: "_id",
					as: "expense.paidBy",
				},
			},
			// only get first user from the array
			{
				$unwind: "$expense.paidBy",
			},
			{
				$project: {
					_id: 0,
					title: "$expense.title",
					from: "$user",
					to: "$expense.paidBy",
					owed: "$owed",
					paid: "$paid",
				},
			},
		]);
		return result
			.map((obj: any) => ({
				...obj,
				from: getObjectFromMongoResponse<IUser>(obj.from),
				to: getObjectFromMongoResponse<IUser>(obj.to),
				owed: getNumber(obj.owed),
				paid: getNumber(obj.paid),
			}))
			.filter((obj) => obj.from.id !== obj.to.id);
	}
}

export const memberRepo = new MemberRepo();
