import { ObjectId } from "../types";

export const ExpenseTemplate = {
	title: {
		type: String,
		required: true,
	},
	amount: {
		type: Number,
		required: true,
	},
	groupId: {
		type: ObjectId,
		required: true,
		ref: "Group",
	},
	paidBy: {
		type: ObjectId,
		required: true,
		ref: "User",
	},
	createdBy: {
		type: ObjectId,
		required: true,
		ref: "User",
	},
	description: {
		type: String,
	},
	paidOn: {
		type: Date,
	},
};
