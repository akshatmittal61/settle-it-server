import mongoose from "mongoose";
import { AuthMappingTemplate } from "../templates";
import { AuthMapping } from "../types";

const AuthMappingSchema = new mongoose.Schema(AuthMappingTemplate, {
	timestamps: true,
});
export const AuthMappingModel = mongoose.model<AuthMapping>(
	"AuthMapping",
	AuthMappingSchema
);
