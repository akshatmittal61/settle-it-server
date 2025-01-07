import { cache, getCacheKey } from "../cache";
import {
	cacheParameter,
	emailTemplates,
	HTTP,
	USER_STATUS,
} from "../constants";
import { ApiError } from "../errors";
import { Logger } from "../log";
import { userRepo } from "../repo";
import { CreateModel, IUser, User } from "../types";
import { genericParse, getNonEmptyString, getNonNullValue } from "../utils";
import { sendBulkEmailTemplate, sendEmailTemplate } from "./email";

type CollectionUser = { name: string; email: string };

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
	public static async getUserByEmail(email: string): Promise<IUser | null> {
		try {
			return await userRepo.findOne({ email });
		} catch {
			return null;
		}
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
	public static async invite(email: string, invitedByUser: IUser) {
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
	public static async inviteMany(emails: string[], invitedByUser: IUser) {
		await userRepo.bulkCreate(
			emails.map((email) => ({
				name: email.split("@")[0],
				email,
				status: USER_STATUS.INVITED,
				invitedBy: invitedByUser.id,
			}))
		);
		await sendBulkEmailTemplate(
			emails,
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
		await this.invite(invitee, invitedByUser);
		const createdUser = await userRepo.create({
			email: invitee,
			status: USER_STATUS.INVITED,
			invitedBy: invitedByUserId,
		});
		return createdUser;
	}
	private static isValidEmail(email: string): boolean {
		const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
		return emailRegex.test(email);
	}
	private static capitalizeName(name: string): string {
		return name
			.split(/\s+/)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join(" ");
	}
	private static getDistinctUsersFromCollection = (
		users: Array<CollectionUser>
	) => {
		const m = new Map();
		users.forEach((user) => {
			if (m.has(user.email)) {
				const us = m.get(user.email);
				m.set(user.email, [...us, user.name]);
			} else {
				m.set(user.email, [user.name]);
			}
		});
		const finals: Array<CollectionUser> = [];
		m.forEach((value, key) => {
			const email = key;
			let name = value[0];
			if (value.length === 0) {
				name = UserService.capitalizeName(email.split("@")[0]);
			} else if (value.length === 1) {
				name = value[0];
			} else {
				for (const v of value) {
					if (v.length > name.length) {
						name = v;
					}
				}
			}
			finals.push({ name, email });
		});
		return finals;
	};
	private static parseBulkEmailInput(value: string): Array<CollectionUser> {
		const a = value
			.split(",")
			.map((a) => a.split(";"))
			.flat()
			.map((a) => a.trim());
		const valids = a
			.map((e) => {
				const r = /^([^<]+)?<([\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,})>$/;
				const f = e.match(r);
				if (f) {
					const email = f?.[2]?.trim();
					if (!UserService.isValidEmail(email)) {
						return null;
					}
					const trimmedName = f?.[1]?.trim() || email?.split("@")[0];
					const obj = {
						name: UserService.capitalizeName(trimmedName),
						email,
					};
					return obj;
				} else {
					const potentialEmails = e.split(/[;,\s]+/);
					const result = [];

					for (const item of potentialEmails) {
						let name = null;
						let email = null;
						if (UserService.isValidEmail(item)) {
							email = item.trim();
						}

						if (email) {
							name = name || email.split("@")[0];

							result.push({
								name: UserService.capitalizeName(name),
								email: email,
							});
						}
					}
					return result;
				}
			})
			.flat()
			.filter((f) => f != null);
		return UserService.getDistinctUsersFromCollection(valids);
	}
	public static async searchInBulk(
		query: string,
		invitee: IUser
	): Promise<{
		users: Array<IUser>;
		message: string;
	}> {
		const usersFromQuery = UserService.parseBulkEmailInput(query);
		Logger.debug("usersFromQuery", usersFromQuery, invitee);
		const emails = usersFromQuery.map((user) => user.email);
		Logger.debug("emails", emails);
		const users = await Promise.all(emails.map(UserService.getUserByEmail));
		const allFoundUsers = users.filter((user) => user !== null);
		const nonFoundUsers = emails.filter(
			(email) => !allFoundUsers.find((user) => user.email === email)
		);
		if (nonFoundUsers.length > 0) {
			Logger.debug("nonFoundUsers", nonFoundUsers);
			await UserService.inviteMany(nonFoundUsers, invitee);
		}
		const newUsersCollection = await Promise.all(
			emails.map(UserService.getUserByEmail)
		);
		const finalCollection = newUsersCollection.filter(
			(user) => user !== null
		);
		if (!finalCollection.map((a) => a.email).includes(invitee.email)) {
			finalCollection.push(invitee);
		}
		const message =
			nonFoundUsers.length > 0
				? `Invited ${nonFoundUsers.length} users`
				: "";
		return {
			users: finalCollection,
			message,
		};
	}
}
