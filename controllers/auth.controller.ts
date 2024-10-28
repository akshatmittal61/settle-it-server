import { HTTP } from "../constants";
import { ApiError } from "../errors";
import { AuthService } from "../services";
import { ApiRequest, ApiResponse } from "../types";
import { genericParse, getNonEmptyString } from "../utils";

export class AuthController {
	public static async requestOtp(req: ApiRequest, res: ApiResponse) {
		const email = getNonEmptyString(req.body.email);
		await AuthService.requestOtpWithEmail(email);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: "OTP sent successfully" });
	}
	public static async verifyOtp(req: ApiRequest, res: ApiResponse) {
		const email = getNonEmptyString(req.body.email);
		const otp = genericParse(getNonEmptyString, req.body.otp);
		if (!otp) {
			throw new ApiError(HTTP.status.BAD_REQUEST, "Invalid OTP");
		}
		await AuthService.verifyOtpWithEmail(email, otp);
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: "OTP verified successfully" });
	}
	public static async login(req: ApiRequest, res: ApiResponse) {
		const email = genericParse(getNonEmptyString, req.body.email);
		const otp = genericParse(getNonEmptyString, req.body.otp);
		const { token, user, isNew } = await AuthService.login(email, otp);
		res.setHeader("x-auth-token", token);
		const responseStatus = isNew
			? HTTP.status.CREATED
			: HTTP.status.SUCCESS;
		return res
			.status(responseStatus)
			.json({ message: HTTP.message.SUCCESS, data: user });
	}
	public static async verify(req: ApiRequest, res: ApiResponse) {
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: req.user,
		});
	}
	public static async logout(_: ApiRequest, res: ApiResponse) {
		res.clearCookie("token");
		return res
			.status(HTTP.status.SUCCESS)
			.json({ message: HTTP.message.SUCCESS });
	}
}
