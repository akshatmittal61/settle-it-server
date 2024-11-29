import express from "express";
import { PORT } from "./config";
import { ServerController } from "./controllers";
import { db } from "./db";
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

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(tracer);
app.use(cors);
app.use(parseCookies);
app.use(profiler);

app.get("/api/health", ServerController.health);
app.get("/api/heartbeat", ServerController.heartbeat);
app.use(useDb);
app.use("/api/v1", apiRouter);
app.use(errorHandler);

const init = async () => {
	Logger.info(`Server listening on port ${PORT}`);
	const connectionStatus = await db.connect();
	if (connectionStatus) {
		Logger.info("MongoDB connected");
	} else {
		Logger.error("Database connection failed");
		Logger.info("Server is running without database");
	}
};

app.listen(PORT, () => {
	init();
});
