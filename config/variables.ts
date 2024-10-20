import { config } from "dotenv";

config();

export const PORT = process.env.PORT || 4000;
export const dbUri = process.env.DB_URI || "mongodb://localhost:27017/";
