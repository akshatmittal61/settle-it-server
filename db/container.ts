import { DatabaseManager } from "./base";
import { Container } from "./types";

export const createDbContainer = (dbUri: string): Container => {
	const db = new DatabaseManager({ uri: dbUri });
	return { db };
};
