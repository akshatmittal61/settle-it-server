import { config } from "dotenv";

config();

class ConfigService {
	constructor(private env: { [k: string]: string | undefined }) {
		this.env = env;
	}

	public get(key: string): string {
		if (!this.env[key]) {
			throw new Error(`Key ${key} not found in environment`);
		}

		return this.env[key] as string;
	}

	public getNumber(key: string): number {
		const value = this.env[key];
		if (!value) {
			throw new Error(`Key ${key} not found in environment`);
		}

		if (isNaN(Number(value))) {
			throw new Error(`${key} is not a number`);
		}

		return Number(this.env[key]);
	}

	public getBoolean(key: string): boolean {
		const value = this.env[key];
		if (!value) {
			throw new Error(`Key ${key} not found in environment`);
		}

		if (
			(typeof value === "string" &&
				value !== "true" &&
				value !== "false") ||
			(typeof value === "number" && value !== 0 && value !== 1)
		) {
			throw new Error(
				`${value} of type ${typeof value} is not a valid boolean!`
			);
		}

		if (typeof value === "string") {
			return value === "true";
		} else if (typeof value === "number") {
			return value === 0 ? false : true;
		} else {
			return value;
		}
	}

	public safeGet<T>(extractor: () => T, fallback: T): T {
		try {
			return extractor();
		} catch {
			return fallback;
		}
	}
}

export const configService = new ConfigService(process.env);
