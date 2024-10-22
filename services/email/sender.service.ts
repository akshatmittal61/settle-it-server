import { googleEmailConfig } from "../../config";
import { createTransport } from "nodemailer";
import { myOAuth2Client } from "./client";

export const sendEmailService = async (
	to: string,
	subject: string,
	html: string
) => {
	myOAuth2Client.setCredentials({
		refresh_token: googleEmailConfig.refreshToken,
	});
	const accessToken = await myOAuth2Client.getAccessToken();
	const transportOptions: any = {
		service: "gmail",
		// host: "smtp.gmail.com",
		// port: 465,
		// secure: true,
		auth: {
			type: "OAuth2",
			user: googleEmailConfig.email,
			clientId: googleEmailConfig.clientId,
			// clientSecret: googleEmailConfig.clientSecret,
			refreshToken: googleEmailConfig.refreshToken,
			accessToken: accessToken.token,
		},
	};
	const smtpTransport = createTransport(transportOptions);
	const mailOptions = {
		from: {
			name: "Settle It!",
			address: googleEmailConfig.email,
		},
		to,
		subject,
		html,
	};
	await smtpTransport.sendMail(mailOptions);
};
