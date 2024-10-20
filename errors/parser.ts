export class ParserSafetyError extends Error {
	public expected: string;
	public found: any;
	constructor(message: string, expected: string, found: any) {
		super(message);
		this.expected = expected;
		this.found = found;
		this.name = "ParserSafetyError";
	}
}
