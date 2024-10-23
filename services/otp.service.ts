import otpGenerator from "otp-generator";
import { sendEmailTemplate } from "./email";
import { emailTemplates } from "../constants";
import { Otp } from "../types";

export class OtpService {
	constructor() {}
	public static generate(): string {
		return otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
			digits: true,
		});
	}
	public static async send(email: string, otp: string) {
		await sendEmailTemplate(
			email,
			"OTP requested for Login | Settle It",
			emailTemplates.OTP,
			{ otp }
		);
	}
	// if time difference between updated_at and current time is greater than 5 minutes, OTP is expired
	public static isExpired(otp: Otp): boolean {
		return (
			new Date().getTime() - new Date(otp.updatedAt).getTime() >
			5 * 60 * 1000
		);
	}
}
