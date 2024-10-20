import { IGroup } from "./group";
import { Expense } from "./models";
import { IUser } from "./user";

export type IExpense = Omit<Expense, "groupId" | "paidBy" | "createdBy"> & {
	group: IGroup;
	paidBy: IUser;
	createdBy: IUser;
};

export type CreateExpenseData = Omit<
	Expense,
	"id" | "createdBy" | "createdAt" | "updatedAt"
> & {
	members: { userId: string; amount: number }[];
};

export type UpdateExpenseData = CreateExpenseData;
