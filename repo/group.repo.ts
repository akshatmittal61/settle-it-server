import { getCacheKey } from "../cache";
import { cacheParameter } from "../constants";
import { GroupModel } from "../models";
import {
	CreateModel,
	FilterQuery,
	Group,
	IGroup,
	IUser,
	UpdateQuery,
	User,
} from "../types";
import { getNonNullValue, getObjectFromMongoResponse } from "../utils";
import { BaseRepo } from "./base";

class GroupRepo extends BaseRepo<Group, IGroup> {
	protected model = GroupModel;
	public parser(group: Group | null): IGroup | null {
		const parsed = super.parser(group);
		if (!parsed) return null;
		return {
			...parsed,
			createdBy: getNonNullValue(
				getObjectFromMongoResponse<IUser>(parsed.createdBy)
			),
			members: parsed.members
				.map(getObjectFromMongoResponse<User>)
				.filter((obj) => obj !== null),
		};
	}
	public async findOne(query: Partial<Group>): Promise<IGroup | null> {
		const res = await this.model
			.findOne<Group>(query)
			.populate("members createdBy");
		return this.parser(res);
	}

	public async findById(id: string): Promise<IGroup | null> {
		const res = await cache.fetch(
			getCacheKey(cacheParameter.GROUP, { id }),
			() =>
				this.model
					.findById<Group>(id)
					.populate("members createdBy")
					.then(this.parser)
					.catch((error: any) => {
						if (error.kind === "ObjectId") return null;
						throw error;
					})
		);
		return res;
	}

	public async find(query: FilterQuery<Group>): Promise<IGroup[] | null> {
		const res = await this.model
			.find<Group>(query)
			.populate("members createdBy");
		const parsedRes = res.map(this.parser).filter((obj) => obj !== null);
		if (parsedRes.length > 0) return parsedRes;
		return null;
	}

	public async findAll(): Promise<Array<IGroup>> {
		const res = await this.model
			.find<Group>()
			.sort({ createdAt: -1 })
			.populate("members createdBy");
		const parsedRes = res.map(this.parser).filter((obj) => obj !== null);
		return parsedRes;
	}

	public async create(body: CreateModel<Group>): Promise<IGroup> {
		const res = await this.model.create<CreateModel<Group>>(body);
		await res.populate("members createdBy");
		return getNonNullValue(this.parser(res));
	}

	public async update(
		query: FilterQuery<Group>,
		update: UpdateQuery<Group>
	): Promise<IGroup | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndUpdate(filter, update, { new: true })
			.populate("members createdBy");
		return this.parser(res);
	}

	public async remove(query: Partial<Group>): Promise<IGroup | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndDelete(filter)
			.populate("members createdBy");
		if (res) cache.del(getCacheKey(cacheParameter.GROUP, { id: res.id }));
		return this.parser(res);
	}
}

export const groupRepo = new GroupRepo();
