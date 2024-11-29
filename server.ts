import { dbUri, PORT } from "./config";
import { Server } from "./connections";

const server = new Server(PORT, dbUri);
server.start();
