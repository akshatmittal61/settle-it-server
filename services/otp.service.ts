import otpGenerator from "otp-generator";
import { emailTemplates, HTTP, OTP_STATUS, USER_STATUS } from "../constants";
import { ApiError } from "../errors";
import { otpRepo, userRepo } from "../repo";
import { IUser, Otp } from "../types";
import { AuthService } from "./auth.service";
import { sendEmailTemplate } from "./email";
import { UserService } from "./user.service";

export class OtpService {
	public static async requestOtpWithEmail(email: string) {
		const foundOtp = await otpRepo.findOne({ email });
		const newOtp = OtpService.generate();
		if (foundOtp) {
			otpRepo.update(
				{ email },
				{
					otp: newOtp,
					status: OTP_STATUS.PENDING,
				}
			);
		} else {
			otpRepo.create({
				email,
				otp: newOtp,
				status: OTP_STATUS.PENDING,
			});
		}
		await OtpService.send(email, newOtp);
	}
	public static async verifyOtpWithEmail(
		email: string,
		otp: string
	): Promise<{ token: string; user: IUser; isNew: boolean }> {
		const foundOtp = await otpRepo.findOne({ email });
		if (!foundOtp) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"No OTP was requested from this email"
			);
		}
		if (foundOtp.status === OTP_STATUS.EXPIRED) {
			throw new ApiError(HTTP.status.BAD_REQUEST, "OTP Expired");
		}
		if (OtpService.isExpired(foundOtp)) {
			await otpRepo.update({ email }, { status: OTP_STATUS.EXPIRED });
			throw new ApiError(HTTP.status.BAD_REQUEST, "OTP Expired");
		}
		if (foundOtp.otp !== otp)
			throw new ApiError(HTTP.status.BAD_REQUEST, "Invalid OTP provided");
		await otpRepo.update({ email }, { status: OTP_STATUS.EXPIRED });
		// search in user table for email
		const { user: currentUser, isNew } =
			await UserService.findOrCreateUserByEmail({
				email,
				status: USER_STATUS.JOINED,
			});
		if (currentUser.status === USER_STATUS.INVITED) {
			await userRepo.update(
				{ id: currentUser.id },
				{ status: USER_STATUS.JOINED }
			);
		}
		const authMapping = await AuthService.findOrCreateAuthMapping(
			email,
			{ id: currentUser.id, name: "otp" },
			currentUser.id
		);
		const token = AuthService.generateToken(`${authMapping.id}`);
		return { token, user: currentUser, isNew };
	}
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
