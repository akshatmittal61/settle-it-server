import { MemberModel } from "../models";
import {
	CreateModel,
	FilterQuery,
	IExpense,
	IGroup,
	IMember,
	IUser,
	Member,
	UpdateQuery,
} from "../types";
import {
	getNonNullValue,
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
}

export const memberRepo = new MemberRepo();
