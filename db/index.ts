import mongoose from "mongoose";
import { dbUri } from "../constants";
import { Logger } from "../log";

declare global {
	// eslint-disable-next-line no-var
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
	private ping(): boolean {
		try {
			if (
				!global.mongoose.conn ||
				!global.mongoose.conn.connection.db ||
				global.mongoose.conn.connections[0].readyState !== 1
			) {
				Logger.info("MongoDB is not connected");
				this.connect();
				return false;
			}
			global.mongoose.conn.connection.db.command({ ping: 1 });
			Logger.info("MongoDB ping succeeded");
			return true;
		} catch {
			Logger.info("MongoDB ping failed");
			return false;
		}
	}

	public async connect() {
		if (
			global.mongoose.conn &&
			global.mongoose.conn.connection.db &&
			global.mongoose.conn.connections[0].readyState === 1
		) {
			Logger.info("MongoDB is already connected");
			return global.mongoose.conn;
		}

		if (!global.mongoose.promise || !global.mongoose.conn) {
			try {
				mongoose.set("strictQuery", true);
				global.mongoose.promise = mongoose.connect(dbUri, {
					heartbeatFrequencyMS: 10000,
				});
				Logger.debug("Connecting to MongoDB");
				global.mongoose.conn = await global.mongoose.promise;
				if (global.mongoose.conn.connections[0].readyState != 1) {
					await new Promise<void>((resolve) => {
						mongoose.connection.once("connected", () => {
							Logger.info("MongoDB connected in cb");
							resolve();
						});
						mongoose.connection.on("error", (error: any) => {
							Logger.error(
								"Error connecting to MongoDB in cb",
								error.message
							);
							resolve();
						});
					});
				}
				Logger.info("MongoDB connected");
				return global.mongoose.conn;
			} catch (error: any) {
				Logger.error(
					"Error connecting to MongoDB in connect",
					error.message
				);
				global.mongoose.conn = null;
				global.mongoose.promise = null;
				return null;
			}
		}
		return global.mongoose.conn;
	}

	public async disconnect() {
		if (!global.mongoose.conn) {
			Logger.info("MongoDB is already disconnected");
			return;
		}
		Logger.info("Disconnecting from MongoDB");
		await mongoose.disconnect();
		global.mongoose.conn = null;
		global.mongoose.promise = null;
		Logger.info("MongoDB disconnected");
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
