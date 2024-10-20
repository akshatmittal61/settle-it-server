import mongoose from "mongoose";
import { GroupTemplate } from "../constants";
import { Group } from "../types";

const GroupSchema = new mongoose.Schema(GroupTemplate, { timestamps: true });
export const GroupModel = mongoose.model<Group>("Group", GroupSchema);
