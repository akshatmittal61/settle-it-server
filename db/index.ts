/* eslint-disable no-unused-vars */
import { dbUri } from "../constants";
import { logger } from "../log";
import mongoose from "mongoose";

declare global {
	var mongoose: {
		conn: typeof import("mongoose") | null;
		promise: Promise<typeof import("mongoose")> | null;
	};
}

global.mongoose = global.mongoose || {
	conn: null,
	promise: null,
};

class DatabaseManager {
	private static isIntervalSet = false;
	private static intervalId: any = null;
	constructor() {
		this.connect();
		if (!DatabaseManager.isIntervalSet) {
			DatabaseManager.isIntervalSet = true;
			DatabaseManager.intervalId = setInterval(() => this.ping(), 10000);
		}
	}

	private ping() {
		if (!global.mongoose.conn || !global.mongoose.conn.connection.db) {
			logger.info("MongoDB is not connected");
			this.connect();
			return false;
		}
		try {
			global.mongoose.conn.connection.db.command({ ping: 1 });
			logger.info("MongoDB ping succeeded");
			return true;
		} catch (error) {
			logger.info("MongoDB ping failed");
			return false;
		}
	}

	public async connect() {
		if (global.mongoose.conn && global.mongoose.conn.connection.db) {
			logger.info("MongoDB is already connected");
			return global.mongoose.conn;
		}

		if (!global.mongoose.promise || !global.mongoose.conn) {
			mongoose.set("strictQuery", true);
			global.mongoose.promise = mongoose.connect(dbUri, {
				heartbeatFrequencyMS: 10000,
			});
			try {
				logger.info("Connecting to MongoDB");
				global.mongoose.conn = await global.mongoose.promise;
				logger.info("MongoDB connected");
				return global.mongoose.conn;
			} catch (error) {
				logger.error("Error connecting to MongoDB", error);
				global.mongoose.conn = null;
				global.mongoose.promise = null;
				throw error;
			}
		}
	}

	public async disconnect() {
		if (DatabaseManager.intervalId) {
			clearInterval(DatabaseManager.intervalId);
		}
		if (!global.mongoose.conn) {
			logger.info("MongoDB is already disconnected");
			return;
		}
		logger.info("Disconnecting from MongoDB");
		await mongoose.disconnect();
		global.mongoose.conn = null;
		global.mongoose.promise = null;
		logger.info("MongoDB disconnected");
	}

	public isReady() {
		return this.ping();
	}

	public status() {
		if (!global.mongoose.conn || !global.mongoose.conn.connection.db) {
			return false;
		}
		return true;
	}
}

export const db = new DatabaseManager();
