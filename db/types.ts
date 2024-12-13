import { DatabaseManager } from "../connections";

export interface DatabaseManagerConfig {
	uri: string;
}

export interface Container {
	db: DatabaseManager;
}
