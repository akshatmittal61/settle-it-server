export class DbConnectionError extends Error {
	public source: string;
	constructor(source: string, message: string = "Database not initialized") {
		super(message);
		this.source = source;
	}
}
