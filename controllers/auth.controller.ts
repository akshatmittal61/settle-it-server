import { HTTP } from "../constants";
import { ApiError } from "../errors";
import { Logger } from "../log";
import { OAuthService, OtpService } from "../services";
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
		const { accessToken, refreshToken, user, isNew } =
			await OtpService.verifyOtpWithEmail(email, otp);
		res.setHeader("x-auth-access-token", accessToken);
		res.setHeader("x-auth-refresh-token", refreshToken);
		Logger.debug(accessToken, refreshToken, user, isNew);
		const responseStatus = isNew
			? HTTP.status.CREATED
			: HTTP.status.SUCCESS;
		return res
			.status(responseStatus)
			.json({ message: HTTP.message.SUCCESS, data: user });
	}
	public static async verifyOAuthSignIn(req: ApiRequest, res: ApiResponse) {
		const code = genericParse(getNonEmptyString, req.body.code);
		Logger.debug("code", code);
		const oauthValidatorToken = await OAuthService.verifyOAuthSignIn(code);
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: oauthValidatorToken,
		});
	}
	public static async continueOAuthWithGoogle(
		req: ApiRequest,
		res: ApiResponse
	) {
		const validatorToken = genericParse(getNonEmptyString, req.body.token);
		const { user, accessToken, refreshToken } =
			await OAuthService.continueOAuthWithGoogle(validatorToken);
		res.setHeader("x-auth-access-token", accessToken);
		res.setHeader("x-auth-refresh-token", refreshToken);
		return res.status(HTTP.status.SUCCESS).json({
			message: HTTP.message.SUCCESS,
			data: user,
		});
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
