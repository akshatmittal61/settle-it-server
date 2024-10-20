import express, { Request, Response } from "express";
import { PORT } from "./config";
import { HTTP } from "./constants";
import { logger } from "./log";
import { db } from "./db";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_: Request, res: Response) => {
	return res
		.status(HTTP.status.SUCCESS)
		.json({ message: HTTP.message.HEALTHY_API });
});

app.listen(PORT, () => {
	db.connect();
	logger.info(`Server listening on port ${PORT}`);
});
