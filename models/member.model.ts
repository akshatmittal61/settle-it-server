import mongoose from "mongoose";
import { MemberTemplate } from "../constants";
import { Member } from "../types";

const MemberSchema = new mongoose.Schema(MemberTemplate, {
	timestamps: true,
});

export const MemberModel = mongoose.model<Member>("Member", MemberSchema);
