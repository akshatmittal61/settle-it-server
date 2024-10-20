import mongoose from "mongoose";
import { ExpenseTemplate } from "../constants";

const ExpenseSchema = new mongoose.Schema(ExpenseTemplate, {
	timestamps: true,
});

export const ExpenseModel = mongoose.model("Expense", ExpenseSchema);
