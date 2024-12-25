import { cache, getCacheKey } from "../cache";
import {
	cacheParameter,
	emailTemplates,
	HTTP,
	USER_STATUS,
} from "../constants";
import { ApiError } from "../errors";
import { userRepo } from "../repo";
import { CreateModel, IUser, User } from "../types";
import { genericParse, getNonEmptyString, getNonNullValue } from "../utils";
import { sendEmailTemplate } from "./email";

export class UserService {
	public static async getAllUsers(): Promise<Array<IUser>> {
		const users = await userRepo.findAll();
		return users;
	}
	public static async getUserById(id: string): Promise<User | null> {
		const user = await cache.fetch(
			getCacheKey(cacheParameter.USER, { id }),
			() => userRepo.findById(id)
		);
		return user;
	}
	public static async findOrCreateUser(
		body: CreateModel<User>
	): Promise<{ user: IUser; isNew: boolean }> {
		const email = genericParse(getNonEmptyString, body.email);
		const foundUser = await userRepo.findOne({ email });
		if (foundUser) {
			return { user: foundUser, isNew: false };
		}
		const createdUser = await userRepo.create(body);
		return { user: createdUser, isNew: true };
	}
	public static async getUsersMapForUserIds(
		userIds: string[]
	): Promise<Map<string, IUser>> {
		const res = await userRepo.find({ _id: { $in: userIds } });
		if (!res) return new Map();
		const parsedRes = res.map(getNonNullValue);
		const usersMap = new Map<string, IUser>(
			parsedRes.map((user) => [user.id, user])
		);
		return usersMap;
	}
	public static async searchByEmail(
		emailQuery: string
	): Promise<Array<IUser>> {
		if (!emailQuery) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Email query is required"
			);
		}
		if (emailQuery.length < 3) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"Email query too short"
			);
		}
		const query = emailQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const res = await userRepo.find({
			email: { $regex: query, $options: "i" },
		});
		if (!res) return [];
		return res;
	}
	public static async invite(email: string, invitedBy: string) {
		const invitedByUser = await UserService.getUserById(invitedBy);
		await sendEmailTemplate(
			email,
			"Invite to Settle It",
			emailTemplates.USER_INVITED,
			{
				invitedBy: {
					email: invitedByUser?.email,
					name: invitedByUser?.name,
				},
			}
		);
	}
	public static async updateUserDetails(
		id: string,
		update: Partial<IUser>
	): Promise<IUser | null> {
		const foundUser = await UserService.getUserById(id);
		if (!foundUser) return null;
		const keysToUpdate = ["name", "phone", "avatar"];
		const updatedBody: any = {};
		Object.keys(update).forEach((key) => {
			if (keysToUpdate.includes(key)) {
				if (
					((update as any)[key] === null ||
						(update as any)[key] === undefined ||
						(update as any)[key] === "") &&
					((foundUser as any)[key] === null ||
						(foundUser as any)[key] === undefined ||
						(foundUser as any)[key] === "")
				) {
					return;
				} else if ((update as any)[key] !== (foundUser as any)[key]) {
					updatedBody[key] = (update as any)[key];
				} else if (!(foundUser as any)[key]) {
					updatedBody[key] = (update as any)[key];
				}
			}
		});
		if (updatedBody.phone) {
			const phoneExists = await userRepo.findOne({
				phone: updatedBody.phone,
			});
			if (phoneExists) {
				throw new ApiError(
					HTTP.status.CONFLICT,
					"Phone number already in use"
				);
			}
		}
		const updatedUser = await userRepo.update({ id }, updatedBody);
		cache.invalidate(getCacheKey(cacheParameter.USER, { id }));
		return updatedUser;
	}
	public static async inviteUser(
		invitedByUserId: string,
		invitee: string
	): Promise<IUser> {
		if (invitedByUserId === invitee) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"You cannot invite yourself"
			);
		}
		const userExists = await UserService.getUserById(invitee);
		if (userExists) {
			throw new ApiError(HTTP.status.CONFLICT, "User already exists");
		}
		const invitedByUser = await UserService.getUserById(invitedByUserId);
		if (!invitedByUser) {
			throw new ApiError(
				HTTP.status.NOT_FOUND,
				"Invited by user not found"
			);
		}
		await this.invite(invitee, invitedByUserId);
		const createdUser = await userRepo.create({
			email: invitee,
			status: USER_STATUS.INVITED,
			invitedBy: invitedByUserId,
		});
		return createdUser;
	}
}
