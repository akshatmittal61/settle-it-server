import express, { Request, Response } from "express";
import { PORT } from "./config";
import { logger } from "./log";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_: Request, res: Response) => {
	return res.status(200).json({ message: "API is healthy" });
});

app.listen(PORT, () => {
	logger.info(`Server listening on port ${PORT}`);
});
