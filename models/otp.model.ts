import mongoose from "mongoose";
import { OtpTemplate } from "../constants";
import { Otp } from "../types";

const OtpSchema = new mongoose.Schema(OtpTemplate, { timestamps: true });

export const OtpModel = mongoose.model<Otp>("Otp", OtpSchema);
