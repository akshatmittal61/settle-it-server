import express from "express";
import { dbUri, PORT } from "./config";
import { ServerController } from "./controllers";
import { createDbContainer } from "./db";
import { Logger } from "./log";
import {
	cors,
	errorHandler,
	parseCookies,
	profiler,
	tracer,
	useDb,
} from "./middlewares";
import { apiRouter } from "./routes";

export class Server {
	private static app = express();
	private static port = PORT;
	private container;

	public constructor(dbUri: string) {
		this.container = createDbContainer(dbUri);
	}

	public static bindMiddlewares() {
		Server.app.use(express.json());
		Server.app.use(express.urlencoded({ extended: true }));
		Server.app.use(tracer);
		Server.app.use(cors);
		Server.app.use(parseCookies);
		Server.app.use(profiler);
	}

	public createRouter() {
		Server.app.get(
			"/api/health",
			ServerController.health(this.container.db)
		);
		Server.app.get(
			"/api/heartbeat",
			ServerController.heartbeat(this.container.db)
		);
		Server.app.use(useDb(this.container.db));
		Server.app.use("/api/v1", apiRouter);
		Server.app.use(errorHandler);
	}

	public async connectDb() {
		const connectionStatus = await this.container.db.connect();
		if (connectionStatus) {
			Logger.info("MongoDB connected");
		} else {
			Logger.error("Database connection failed");
			Logger.info("Server is running without database");
		}
	}

	public start() {
		Server.bindMiddlewares();
		this.createRouter();
		this.connectDb();
		Server.app.listen(Server.port, () => {
			Logger.info(`Server listening on port ${Server.port}`);
		});
	}
}

const server = new Server(dbUri);
server.start();
