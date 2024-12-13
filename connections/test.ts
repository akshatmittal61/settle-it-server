import { MongoMemoryServer } from "mongodb-memory-server";
import { Server } from "./server";

export class TestSuite {
	private server: Server | null;
	private mongoServer: MongoMemoryServer | null = null;
	private dbUri: string = "";

	public constructor() {
		this.server = null;
		this.init();
	}
	public async init() {
		const mongoServer = await MongoMemoryServer.create();
		const dbUri = mongoServer.getUri();
		this.mongoServer = mongoServer;
		this.dbUri = dbUri;
	}
	public async stop() {
		await this.server?.stop();
		await this.mongoServer?.stop();
	}
	public testCase(name: string, callback: (server: Server) => Promise<void>) {
		test(name, async () => {
			const server = new Server(0, this.dbUri);
			await server.start();
			await callback(server);
			await server.stop();
		});
	}
}
