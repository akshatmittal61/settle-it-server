import { ObjectId } from "mongoose";
import { T_OTP_STATUS, T_USER_STATUS } from "./enum";

export type User = {
	id: string;
	name?: string;
	email: string;
	phone?: string;
	avatar?: string;
	status: T_USER_STATUS;
	invitedBy?: string;
	createdAt: string;
	updatedAt: string;
};

export type Expense = {
	id: string;
	title: string;
	amount: number;
	groupId: string | ObjectId;
	paidBy: string | ObjectId;
	createdBy: string | ObjectId;
	description?: string;
	paidOn?: string;
	createdAt: string;
	updatedAt: string;
};

export type Group = {
	id: string;
	name: string;
	icon?: string;
	banner?: string;
	type?: string;
	members: string[];
	createdBy: string | ObjectId;
	createdAt: string;
	updatedAt: string;
};

export type Member = {
	id: string;
	userId: string;
	groupId: string;
	expenseId: string;
	amount: number;
	owed: number;
	paid: number;
	createdAt: string;
	updatedAt: string;
};

export type Otp = {
	id: string;
	email: string;
	otp: string;
	status: T_OTP_STATUS;
	createdAt: string;
	updatedAt: string;
};
