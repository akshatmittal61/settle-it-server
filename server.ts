import express from "express";
import { PORT } from "./config";
import { HTTP } from "./constants";
import { db } from "./db";
import { logger } from "./log";
import { errorHandler, parseCookies } from "./middlewares";
import { apiRouter } from "./routes";
import { ApiRequest, ApiResponse } from "./types";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(parseCookies);

app.get("/api/health", (_: ApiRequest, res: ApiResponse) => {
	try {
		if (db.isReady() === false) {
			throw new Error("Database connection failed");
		}
	} catch (error) {
		return res
			.status(HTTP.status.SERVICE_UNAVAILABLE)
			.json({ message: HTTP.message.DB_CONNECTION_ERROR });
	}
	return res
		.status(HTTP.status.SUCCESS)
		.json({ message: HTTP.message.HEALTHY_API });
});

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
