import mongoose from "mongoose";
import { UserTemplate } from "../constants";

const UserSchema = new mongoose.Schema(UserTemplate, { timestamps: true });
export const UserModel = mongoose.model("User", UserSchema);
