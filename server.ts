import express from "express";
import { PORT } from "./config";
import { ServerController } from "./controllers";
import { db } from "./db";
import { logger } from "./log";
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
app.use(parseCookies);
app.use(cors);
app.use(tracer);
app.use(profiler);

app.get("/api/health", ServerController.health);
app.use(useDb);
app.use("/api/v1", apiRouter);
app.use(errorHandler);

const init = async () => {
	logger.info(`Server listening on port ${PORT}`);
	const connectionStatus = await db.connect();
	if (connectionStatus) {
		logger.info("MongoDB connected");
	} else {
		logger.error("Database connection failed");
		logger.info("Server is running without database");
	}
};

app.listen(PORT, () => {
	init();
});
