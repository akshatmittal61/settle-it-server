import jwt from "jsonwebtoken";
import { jwtSecret } from "../config";
import { HTTP, OTP_STATUS, USER_STATUS } from "../constants";
import { ApiError } from "../errors";
import { Logger } from "../log";
import { otpRepo, userRepo } from "../repo";
import { IUser } from "../types";
import { genericParse, getNonEmptyString } from "../utils";
import { OtpService } from "./otp.service";
import { UserService } from "./user.service";

export class AuthService {
	public static async getAuthenticatedUser(
		token: string
	): Promise<IUser | null> {
		try {
			const decoded: any = jwt.verify(token, jwtSecret);
			const userId = genericParse(getNonEmptyString, decoded.id);
			const foundUser = await UserService.getUserById(userId);
			return foundUser;
		} catch (error) {
			Logger.error(error);
			return null;
		}
	}
	public static generateToken(id: string): string {
		return jwt.sign({ id }, jwtSecret, {
			expiresIn: "30d",
		});
	}
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
	public static async verifyOtpWithEmail(email: string, otp: string) {
		const foundOtp = await otpRepo.findOne({ email });
		if (!foundOtp) {
			throw new ApiError(
				HTTP.status.BAD_REQUEST,
				"No OTP was requested from this email"
			);
		}
		if (foundOtp.status === OTP_STATUS.VERIFIED) {
			throw new ApiError(HTTP.status.BAD_REQUEST, "OTP already verified");
		}
		if (
			OtpService.isExpired(foundOtp) ||
			foundOtp.status === OTP_STATUS.EXPIRED
		) {
			otpRepo.update({ email }, { status: OTP_STATUS.EXPIRED });
			throw new ApiError(HTTP.status.BAD_REQUEST, "OTP Expired");
		}
		if (foundOtp.otp !== otp)
			throw new ApiError(HTTP.status.BAD_REQUEST, "Invalid OTP provided");
		await otpRepo.update({ email }, { status: OTP_STATUS.VERIFIED });
	}
	public static async login(
		email: string,
		otp: string
	): Promise<{ token: string; user: IUser; isNew: boolean }> {
		// search in otp table for email, otp, status = verified
		const foundOtp = await otpRepo.findOne({
			email,
			otp,
			status: OTP_STATUS.VERIFIED,
		});
		if (!foundOtp) {
			throw new ApiError(
				HTTP.status.UNAUTHORIZED,
				"Please verify your email"
			);
		}
		// update otp status to Expired
		await otpRepo.update({ email }, { status: OTP_STATUS.EXPIRED });
		if (
			OtpService.isExpired(foundOtp) ||
			foundOtp.status === OTP_STATUS.EXPIRED
		) {
			throw new ApiError(HTTP.status.GONE, "OTP Expired");
		}
		// search in user table for email
		const { user: currentUser, isNew } =
			await UserService.findOrCreateUserByEmail(email, {
				email,
				status: USER_STATUS.JOINED,
			});
		if (currentUser.status === USER_STATUS.INVITED) {
			await userRepo.update(
				{ id: currentUser.id },
				{ status: USER_STATUS.JOINED }
			);
		}
		const token = AuthService.generateToken(`${currentUser.id}`);
		return { token, user: currentUser, isNew };
	}
	public static getCookie(token: string, isLoggedOut: boolean = false) {
		if (isLoggedOut)
			return "token=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure=true";
		return `token=${token}; HttpOnly; Path=/; Max-Age=${
			30 * 24 * 60 * 60 * 1000
		}; SameSite=None; Secure=true`;
	}
}
