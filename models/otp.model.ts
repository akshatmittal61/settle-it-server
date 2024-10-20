import mongoose from "mongoose";
import { OtpTemplate } from "../constants";

const OtpSchema = new mongoose.Schema(OtpTemplate, { timestamps: true });

export const OtpModel = mongoose.model("Otp", OtpSchema);
