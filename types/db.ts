import mongoose from "mongoose";
export type { FilterQuery, UpdateQuery } from "mongoose";

export const ObjectId = mongoose.Types.ObjectId;
export type CreateModel<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
