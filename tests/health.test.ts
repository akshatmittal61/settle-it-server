import request from "supertest";
import { TestSuite } from "../connections";

describe("Server Health", () => {
	const suite: TestSuite = new TestSuite();

	beforeAll(async () => {
		await suite.init();
	});

	afterAll(async () => {
		await suite.stop();
	});

	suite.testCase("GET /health - should return 200", async (server) => {
		const response = await request(server.getApp()).get("/api/health");
		expect(response.status).toBe(200);
	});

	suite.testCase(
		"GET /health - should return 503 when db is not connected",
		async (server) => {
			await server.disconnectDb();
			const response = await request(server.getApp()).get("/api/health");
			expect(response.status).toBe(503);
		}
	);

	suite.testCase("GET /heartbeat - should return 200", async (server) => {
		const response = await request(server.getApp()).get("/api/heartbeat");
		expect(response.status).toBe(200);
	});

	suite.testCase(
		"GET /heartbeat - should return 200 even when db is not connected",
		async (server) => {
			await server.disconnectDb();
			const response = await request(server.getApp()).get(
				"/api/heartbeat"
			);
			expect(response.status).toBe(200);
		}
	);
});
