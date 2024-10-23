import { getCacheKey } from "../cache";
import { cacheParameter } from "../constants";
import { ExpenseModel } from "../models";
import {
	CreateModel,
	Expense,
	FilterQuery,
	Group,
	IExpense,
	IUser,
	UpdateQuery,
} from "../types";
import {
	getNonNullValue,
	getObjectFromMongoResponse,
	omitKeys,
} from "../utils";
import { BaseRepo } from "./base";
import { groupRepo } from "./group.repo";

class ExpenseRepo extends BaseRepo<Expense, IExpense> {
	protected model = ExpenseModel;
	public parser(expense: Expense | null): IExpense | null {
		if (!expense) return null;
		const parsed = getObjectFromMongoResponse<Expense>(expense);
		if (!parsed) return null;
		return {
			...omitKeys(parsed, ["groupId"]),
			group: groupRepo.parser(
				getObjectFromMongoResponse<Group>(parsed.groupId)
			),
			paidBy: getObjectFromMongoResponse<IUser>(parsed.paidBy),
			createdBy: getObjectFromMongoResponse<IUser>(parsed.createdBy),
		};
	}
	public async findOne(
		query: FilterQuery<Expense>
	): Promise<IExpense | null> {
		const res = await this.model
			.findOne<Expense>(query)
			.populate("groupId paidBy createdBy");
		return this.parser(res);
	}

	public async findById(id: string): Promise<IExpense | null> {
		const res = await cache.fetch(
			getCacheKey(cacheParameter.EXPENSE, { id }),
			() =>
				this.model
					.findById<Expense>(id)
					.populate("groupId paidBy createdBy")
					.then(this.parser)
					.catch((error: any) => {
						if (error.kind === "ObjectId") return null;
						throw error;
					})
		);
		return res;
	}

	public async find(query: FilterQuery<Expense>): Promise<IExpense[] | null> {
		const res = await this.model
			.find<Expense>(query)
			.populate("groupId paidBy createdBy");
		const parsedRes = res.map(this.parser).filter((obj) => obj !== null);
		if (parsedRes.length > 0) return parsedRes;
		return null;
	}

	public async findAll(): Promise<Array<IExpense>> {
		const res = await this.model
			.find<Expense>()
			.sort({ createdAt: -1 })
			.populate("groupId paidBy createdBy");
		const parsedRes = res.map(this.parser).filter((obj) => obj !== null);
		if (parsedRes.length > 0) return parsedRes;
		return [];
	}

	public async create(body: CreateModel<Expense>): Promise<IExpense> {
		const res = await this.model.create<CreateModel<Expense>>(body);
		await res.populate("paidBy createdBy groupId");
		return getNonNullValue(this.parser(res));
	}

	public async update(
		query: FilterQuery<Expense>,
		update: UpdateQuery<Expense>
	): Promise<IExpense | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndUpdate<Expense>(filter, update, { new: true })
			.populate("paidBy createdBy groupId");
		return this.parser(res);
	}

	public async remove(query: Partial<Expense>): Promise<IExpense | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndDelete<Expense>(filter)
			.populate("paidBy createdBy groupId");
		return this.parser(res);
	}

	public async removeMultiple(query: Partial<Expense>): Promise<number> {
		const res = await this.model.deleteMany(query);
		return res.deletedCount;
	}

	public async getExpensesForGroup(
		groupId: string
	): Promise<Array<IExpense>> {
		const res = await this.model
			.find<Expense>({ groupId })
			.populate("paidBy createdBy groupId")
			.populate({
				path: "groupId",
				populate: {
					path: "members createdBy",
				},
			});
		const expenses: Array<IExpense> = res
			.map(this.parser)
			.map(getNonNullValue);
		return expenses;
	}
}

export const expenseRepo = new ExpenseRepo();
