import { UserModel } from "../models";
import { User } from "../types";
import { BaseRepo } from "./base";

class UserRepo extends BaseRepo<User> {
	protected model = UserModel;
}

export const userRepo = new UserRepo();
