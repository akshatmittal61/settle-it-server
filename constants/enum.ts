import {
	T_API_METHODS,
	T_EXPENSE_STATUS,
	T_OTP_STATUS,
	T_USER_STATUS,
} from "../types";
import { getEnumeration } from "../utils";

export const USER_STATUS = getEnumeration<T_USER_STATUS>(["INVITED", "JOINED"]);
export const OTP_STATUS = getEnumeration<T_OTP_STATUS>([
	"PENDING",
	"VERIFIED",
	"EXPIRED",
]);
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
