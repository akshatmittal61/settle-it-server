export type T_URL = "db" | "frontend" | "backend";
export type T_USER_STATUS = "JOINED" | "INVITED";
export type T_OTP_STATUS = "PENDING" | "EXPIRED";
export type T_EXPENSE_STATUS = "PENDING" | "SETTLED";
export type T_NODE_ENV = "development" | "test" | "production";

export type GOOGLE_MAIL_SERVICE_KEYS = "email" | "password";

export type LOG_LEVEL =
	| "log"
	| "info"
	| "warn"
	| "error"
	| "debug"
	| "verbose"
	| "silly"
	| "http";
