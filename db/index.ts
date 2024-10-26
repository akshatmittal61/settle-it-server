/* eslint-disable no-unused-vars */
import mongoose from "mongoose";
import { dbUri } from "../constants";
import { logger } from "../log";

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
	}

	private ping(): boolean {
		try {
			if (!global.mongoose.conn || !global.mongoose.conn.connection.db) {
				logger.info("MongoDB is not connected");
				this.connect();
				return false;
			}
			global.mongoose.conn.connection.db.command({ ping: 1 });
			logger.info("MongoDB ping succeeded");
			return true;
		} catch (error) {
			logger.info("MongoDB ping failed");
			return false;
		}
	}

	public async connect() {
		if (
			global.mongoose.conn &&
			global.mongoose.conn.connection.db &&
			global.mongoose.conn.connections[0].readyState === 1
		) {
			logger.info("MongoDB is already connected");
			return global.mongoose.conn;
		}

		if (!global.mongoose.promise || !global.mongoose.conn) {
			try {
				mongoose.set("strictQuery", true);
				global.mongoose.promise = mongoose.connect(dbUri, {
					heartbeatFrequencyMS: 10000,
				});
				logger.debug("Connecting to MongoDB");
				// await new Promise<void>((resolve) => {
				// 	mongoose.connection.once("connected", () => {
				// 		logger.info("MongoDB connected in cb");
				// 		resolve();
				// 	});
				// 	mongoose.connection.on("error", (error: any) => {
				// 		logger.error(
				// 			"Error connecting to MongoDB in cb",
				// 			error.message
				// 		);
				// 		resolve();
				// 		// reject(error);
				// 	});
				// }).then(() => {
				// 	global.mongoose.conn = mongoose;
				// 	if (!DatabaseManager.isIntervalSet) {
				// 		DatabaseManager.isIntervalSet = true;
				// 		DatabaseManager.intervalId = setInterval(
				// 			() => this.ping(),
				// 			10000
				// 		);
				// 	}
				// });
				// const conn = await mongoose.connect(dbUri, {
				// 	heartbeatFrequencyMS: 10000,
				// });
				// global.mongoose.conn = conn;
				global.mongoose.conn = await global.mongoose.promise;
				await new Promise<void>((resolve) => {
					mongoose.connection.once("connected", () => {
						logger.info("MongoDB connected in cb");
						if (!DatabaseManager.isIntervalSet) {
							DatabaseManager.isIntervalSet = true;
							DatabaseManager.intervalId = setInterval(
								() => this.ping(),
								10000
							);
						}
						resolve();
					});
					mongoose.connection.on("error", (error: any) => {
						logger.error(
							"Error connecting to MongoDB in cb",
							error.message
						);
						resolve();
						// reject(error);
					});
				});
				return global.mongoose.conn;
			} catch (error: any) {
				logger.error(
					"Error connecting to MongoDB in connect",
					error.message
				);
				global.mongoose.conn = null;
				global.mongoose.promise = null;
				clearInterval(DatabaseManager.intervalId);
				return null;
			}
		}
		return global.mongoose.conn;
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
