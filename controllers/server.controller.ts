import { DatabaseManager } from "../connections";
import { HTTP } from "../constants";
import { ApiRequest, ApiResponse } from "../types";

export class ServerController {
	public static health =
		(db: DatabaseManager) => (_: ApiRequest, res: ApiResponse) => {
			if (db.isConnected() === false) {
				return res
					.status(HTTP.status.SERVICE_UNAVAILABLE)
					.json({ message: HTTP.message.DB_CONNECTION_ERROR });
			}
			const payload = {
				identity: process.pid,
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
				database: db.isConnected(),
			};
			return res
				.status(HTTP.status.SUCCESS)
				.json({ message: HTTP.message.HEALTHY_API, data: payload });
		};
	public static heartbeat =
		(db: DatabaseManager) => (_: ApiRequest, res: ApiResponse) => {
			const payload = {
				identity: process.pid,
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
				database: db.isConnected(),
			};
			return res
				.status(HTTP.status.SUCCESS)
				.json({ message: HTTP.message.HEARTBEAT, data: payload });
		};
}
