export type T_USER_STATUS = "JOINED" | "INVITED";
export type T_OTP_STATUS = "PENDING" | "VERIFIED" | "EXPIRED";
export type T_EXPENSE_STATUS = "PENDING" | "SETTLED";
export type T_NODE_ENV = "development" | "test" | "production";

export type LOG_LEVEL =
	| "log"
	| "info"
	| "warn"
	| "error"
	| "debug"
	| "verbose"
	| "silly"
	| "http";
