import mongoose from "mongoose";
import { UserTemplate } from "../constants";
import { User } from "../types";

const UserSchema = new mongoose.Schema(UserTemplate, { timestamps: true });
export const UserModel = mongoose.model<User>("User", UserSchema);
