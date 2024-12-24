import { T_NODE_ENV, T_URL } from "../types";
import { configService } from "./base";

export const service = configService.safeGet(
	() => configService.get("SERVICE"),
	"settle-it"
);
export const PORT = configService.safeGet(
	() => configService.getNumber("PORT"),
	4000
);
export const dbUri = configService.get("DB_URI");

export const url: Record<T_URL, string> = {
	db: dbUri,
	frontend: configService.safeGet(
		() => configService.get("FRONTEND_BASE_URL"),
		"http://localhost:3000"
	),
	backend: configService.safeGet(
		() => configService.get("BACKEND_BASE_URL"),
		"http://localhost:3000/api/v1"
	),
};

export const jwtSecret: string = configService.get("JWT_SECRET");

export const nodeEnv = configService.safeGet(
	() => configService.get("NODE_ENV") as T_NODE_ENV,
	"development"
);
