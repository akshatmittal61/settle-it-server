import { ObjectId } from "../types";

export const MemberTemplate = {
	userId: {
		type: ObjectId,
		required: true,
		ref: "User",
	},
	groupId: {
		type: ObjectId,
		required: true,
		ref: "Group",
	},
	expenseId: {
		type: ObjectId,
		required: true,
		ref: "Expense",
	},
	amount: {
		type: Number,
		required: true,
	},
	owed: {
		type: Number,
		required: true,
	},
	paid: {
		type: Number,
		required: true,
	},
};
