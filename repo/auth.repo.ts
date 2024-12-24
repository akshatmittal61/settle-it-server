import { AuthMappingModel } from "../models";
import {
	AuthMapping,
	CreateModel,
	FilterQuery,
	IAuthMapping,
	IUser,
	UpdateQuery,
} from "../types";
import { getNonNullValue, getObjectFromMongoResponse } from "../utils";
import { BaseRepo } from "./base";

class AuthRepo extends BaseRepo<AuthMapping, IAuthMapping> {
	protected model = AuthMappingModel;
	public parser(input: AuthMapping | null): IAuthMapping | null {
		const res = super.parser(input);
		if (!res) return null;
		const user = getObjectFromMongoResponse<IUser>(res.user);
		res.user = user;
		return res;
	}
	public async findOne(
		query: FilterQuery<AuthMapping>
	): Promise<IAuthMapping | null> {
		const res = await this.model
			.findOne<AuthMapping>(query)
			.populate("user");
		return this.parser(res);
	}
	public async findById(id: string): Promise<IAuthMapping | null> {
		try {
			const res = await this.model
				.findById<AuthMapping>(id)
				.populate("user");
			return this.parser(res);
		} catch (error: any) {
			if (error.kind === "ObjectId") return null;
			throw error;
		}
	}
	public async find(
		query: FilterQuery<AuthMapping>
	): Promise<Array<IAuthMapping> | null> {
		const res = await this.model
			.find<AuthMapping>(query)
			.populate("user")
			.sort({ createdAt: -1 });
		const parsedRes = res.map(this.parser).filter((obj) => obj != null);
		if (parsedRes.length === 0) return null;
		return parsedRes;
	}
	public async findAll(): Promise<Array<IAuthMapping>> {
		const res = await this.model
			.find<AuthMapping>()
			.populate("user")
			.sort({ createdAt: -1 });
		const parsedRes = res.map(this.parser).filter((obj) => obj != null);
		if (parsedRes.length > 0) return parsedRes;
		return [];
	}
	public async create(body: CreateModel<AuthMapping>): Promise<IAuthMapping> {
		const res = await this.model.create<CreateModel<AuthMapping>>(body);
		return getNonNullValue(this.parser(await res.populate("user")));
	}
	public async update(
		query: FilterQuery<AuthMapping>,
		update: UpdateQuery<AuthMapping>
	): Promise<IAuthMapping | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndUpdate<AuthMapping>(filter, update, { new: true })
			.populate("user");
		return this.parser(res);
	}
	public async remove(
		query: FilterQuery<AuthMapping>
	): Promise<IAuthMapping | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model
			.findOneAndDelete<AuthMapping>(filter)
			.populate("user");
		return this.parser(res);
	}
}

export const authRepo = new AuthRepo();
