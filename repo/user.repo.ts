import { UserModel } from "../models";
import { CreateModel, IUser, User } from "../types";
import { BaseRepo } from "./base";

class UserRepo extends BaseRepo<User> {
	protected model = UserModel;

	public async bulkCreate(
		body: Array<CreateModel<User>>
	): Promise<Array<IUser>> {
		const res = await this.model.insertMany<CreateModel<User>>(body);
		return res.map(this.parser).filter((obj) => obj !== null);
	}
}

export const userRepo = new UserRepo();
