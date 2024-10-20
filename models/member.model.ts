import mongoose from "mongoose";
import { MemberTemplate } from "../constants";

const MemberSchema = new mongoose.Schema(MemberTemplate, {
	timestamps: true,
});

export const MemberModel = mongoose.model("Member", MemberSchema);
