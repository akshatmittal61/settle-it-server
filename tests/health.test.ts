import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { Server } from "../connections";

describe("Health API", () => {
	// let server: Server;
	let mongoServer: MongoMemoryServer;
	let dbUri: string;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		dbUri = mongoServer.getUri();
	});

	afterAll(async () => {
		await mongoServer.stop();
	});

	test("GET /health - should return 200", async () => {
		const server = new Server(0, dbUri);
		await server.start();
		const response = await request(server.getApp()).get("/api/health");
		expect(response.status).toBe(200);
		server.stop();
	});

	test("GET /health - should return 503 when db is not connected", async () => {
		const server = new Server(0, dbUri);
		await server.start();
		await server.disconnectDb();
		const response = await request(server.getApp()).get("/api/health");
		expect(response.status).toBe(503);
		server.stop();
	});

	test("GET /heartbeat - should return 200", async () => {
		const server = new Server(0, dbUri);
		await server.start();
		const response = await request(server.getApp()).get("/api/heartbeat");
		expect(response.status).toBe(200);
		server.stop();
	});

	test("GET /heartbeat - should return 200 even when db is not connected", async () => {
		const server = new Server(0, dbUri);
		await server.start();
		await server.disconnectDb();
		const response = await request(server.getApp()).get("/api/heartbeat");
		expect(response.status).toBe(200);
		server.stop();
	});
});
