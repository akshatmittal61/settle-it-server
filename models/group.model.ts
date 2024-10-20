import mongoose from "mongoose";
import { GroupTemplate } from "../constants";

const GroupSchema = new mongoose.Schema(GroupTemplate, { timestamps: true });
export const GroupModel = mongoose.model("Group", GroupSchema);
