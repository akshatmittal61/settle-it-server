import { fallbackAssets, USER_STATUS } from "../constants";
import { ObjectId } from "../types";

export const UserTemplate = {
	name: {
		type: String,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		index: {
			unique: true,
			sparse: true,
		},
	},
	phone: {
		type: String,
		unique: true,
		sparse: true,
	},
	avatar: {
		type: String,
		default: fallbackAssets.avatar,
	},
	status: {
		type: String,
		enum: Object.values(USER_STATUS),
		default: USER_STATUS.JOINED,
	},
	invitedBy: {
		type: ObjectId,
		ref: "User",
		sparse: true,
	},
};
