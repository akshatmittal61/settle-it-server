import { HTTP } from "../constants";
import { ApiError } from "../errors";
import { Logger } from "../log";
import { OtpService } from "../services";
import { ApiRequest, ApiResponse } from "../types";
import { genericParse, getNonEmptyString } from "../utils";

export class AuthController {
	public static async requestOtp(req: ApiRequest, res: ApiResponse) {
		const email = getNonEmptyString(req.body.email);
		await OtpService.requestOtpWithEmail(email);
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
		const { token, user, isNew } = await OtpService.verifyOtpWithEmail(
			email,
			otp
		);
		res.setHeader("x-auth-token", token);
		Logger.debug(token, user, isNew);
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
