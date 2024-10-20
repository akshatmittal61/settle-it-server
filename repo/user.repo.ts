import { getCacheKey } from "../cache";
import { cacheParameter } from "../constants";
import { UserModel } from "../models";
import { User } from "../types";
import { BaseRepo } from "./base";

class UserRepo extends BaseRepo<User> {
	protected model = UserModel;
	public async findById(id: string) {
		const res = await cache.fetch(
			getCacheKey(cacheParameter.USER, { id }),
			() => super.findById(id)
		);
		return res;
	}
}

export const userRepo = new UserRepo();
