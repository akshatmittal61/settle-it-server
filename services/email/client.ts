import { googleEmailConfig } from "../../config";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;
const id = googleEmailConfig.clientId;
const secret = googleEmailConfig.clientSecret;

export const myOAuth2Client = new OAuth2(id, secret);
