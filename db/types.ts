import { DatabaseManager } from "./base";

export interface DatabaseManagerConfig {
	uri: string;
}

export interface Container {
	db: DatabaseManager;
}
