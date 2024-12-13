import { config } from "dotenv";
import { T_NODE_ENV } from "../types";

config();

export const service: string = "settle-it";
export const PORT: number = +(process.env.PORT || 4000);
export const dbUri = process.env.DB_URI || "mongodb://localhost:27017/";

type T_URL = "db" | "frontend" | "backend";

export const url: Record<T_URL, string> = {
	db: process.env.DB_URI || "mongodb://localhost:27017/nextjs",
	frontend: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
	backend: process.env.BACKEND_BASE_URL || "http://localhost:3000/api/v1",
};

export const jwtSecret: string = process.env.JWT_SECRET || "secret";
export const nodeEnv: T_NODE_ENV =
	(process.env.NODE_ENV as T_NODE_ENV) || "development";
