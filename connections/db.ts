import mongoose from "mongoose";
import { DatabaseManagerConfig } from "../db";
import { DbConnectionError } from "../errors";
import { Logger } from "../log";

export class DatabaseManager {
	private config: DatabaseManagerConfig;

	constructor(config: DatabaseManagerConfig) {
		if (!config.uri) {
			throw new DbConnectionError("uri", "Database URI not provided");
		}
		this.config = config;
	}

	public async connect() {
		try {
			if (mongoose.connection.readyState === 1) {
				Logger.info("MongoDB is already connected");
				return true;
			}
			Logger.info("Connecting to MongoDB");
			await mongoose.connect(this.config.uri);
			Logger.info("MongoDB connected");
			return true;
		} catch (error: any) {
			Logger.error("Error connecting to MongoDB", error.message);
			return false;
		}
	}

	public async disconnect() {
		try {
			if (mongoose.connection.readyState === 0) {
				Logger.info("MongoDB is already disconnected");
				return;
			}
			Logger.info("Disconnecting from MongoDB");
			await mongoose.disconnect();
			Logger.info("MongoDB disconnected");
		} catch (error: any) {
			Logger.error("Error disconnecting from MongoDB", error.message);
		}
	}

	public isConnected() {
		return mongoose.connection.readyState === 1;
	}
}
