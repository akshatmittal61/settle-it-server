import { OtpModel } from "../models";
import { Otp } from "../types";
import { BaseRepo } from "./base";

class OtpRepo extends BaseRepo<Otp> {
	protected model = OtpModel;
}

export const otpRepo = new OtpRepo();
