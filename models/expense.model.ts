import mongoose from "mongoose";
import { ExpenseTemplate } from "../constants";
import { Expense } from "../types";

const ExpenseSchema = new mongoose.Schema(ExpenseTemplate, {
	timestamps: true,
});

export const ExpenseModel = mongoose.model<Expense>("Expense", ExpenseSchema);
