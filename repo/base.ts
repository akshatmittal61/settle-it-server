import mongoose from "mongoose";
import { CreateModel, FilterQuery, UpdateQuery } from "../types";
import { getNonNullValue, getObjectFromMongoResponse } from "../utils";

export abstract class BaseRepo<T = any, P = T> {
	protected abstract model: mongoose.Model<T>;

	constructor() {}
	public parser(input: T | null): P | null {
		if (!input) return null;
		const res = getObjectFromMongoResponse<T>(input);
		if (!res) return null;
		return res as P;
	}
	public async findOne(query: FilterQuery<T>): Promise<P | null> {
		const res = await this.model.findOne<T>(query);
		return this.parser(res);
	}
	public async findById(id: string): Promise<P | null> {
		try {
			const res = await this.model.findById<T>(id);
			return this.parser(res);
		} catch (error: any) {
			if (error.kind === "ObjectId") return null;
			throw error;
		}
	}
	public async find(query: FilterQuery<T>): Promise<Array<P> | null> {
		const res = await this.model.find<T>(query);
		const parsedRes = res.map(this.parser).filter((obj) => obj != null);
		if (parsedRes.length === 0) return null;
		return parsedRes;
	}
	public async findAll(): Promise<Array<P>> {
		const res = await this.model.find<T>().sort({ createdAt: -1 });
		const parsedRes = res.map(this.parser).filter((obj) => obj != null);
		if (parsedRes.length > 0) return parsedRes;
		return [];
	}
	public async create(body: CreateModel<T>): Promise<P> {
		const res = await this.model.create<CreateModel<T>>(body);
		return getNonNullValue(this.parser(res));
	}
	public async update(
		query: FilterQuery<T>,
		update: UpdateQuery<T>
	): Promise<P | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model.findOneAndUpdate<T>(filter, update, {
			new: true,
		});
		return this.parser(res);
	}
	public async remove(query: FilterQuery<T>): Promise<P | null> {
		const filter = query.id ? { _id: query.id } : query;
		const res = await this.model.findOneAndDelete<T>(filter);
		return this.parser(res);
	}
}
