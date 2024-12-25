import {
	T_API_METHODS,
	T_EMAIL_TEMPLATE,
	T_EXPENSE_STATUS,
	T_NODE_ENV,
	T_OTP_STATUS,
	T_USER_STATUS,
} from "../types";
import { getEnumeration } from "../utils";

export const USER_STATUS = getEnumeration<T_USER_STATUS>(["INVITED", "JOINED"]);
export const OTP_STATUS = getEnumeration<T_OTP_STATUS>(["PENDING", "EXPIRED"]);
export const EXPENSE_STATUS = getEnumeration<T_EXPENSE_STATUS>([
	"PENDING",
	"SETTLED",
]);

export const apiMethods = getEnumeration<T_API_METHODS>([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
]);

export const emailTemplates = getEnumeration<T_EMAIL_TEMPLATE>([
	"OTP",
	"NEW_USER_ONBOARDED",
	"USER_INVITED",
	"USER_ADDED_TO_GROUP",
]);

export const NODE_ENV = getEnumeration<T_NODE_ENV>([
	"development",
	"test",
	"production",
]);
