import { DatabaseManager } from "../connections";
import { Container } from "./types";

export const createDbContainer = (dbUri: string): Container => {
	const db = new DatabaseManager({ uri: dbUri });
	return { db };
};
