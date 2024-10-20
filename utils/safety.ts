import { ParserSafetyError } from "../errors";
// TODO: Replace with zod

export const genericParse = <T>(parse: (_: any) => T, input: any): T => {
	try {
		const output = parse(input);
		return output;
	} catch (error) {
		if (error instanceof ParserSafetyError) {
			throw error;
		} else {
			throw new ParserSafetyError(
				`Invalid input: ${input}`,
				input,
				input
			);
		}
	}
};

export const safeParse = <T>(parse: (_: any) => T, input: any): T | null => {
	try {
		const output = parse(input);
		return output;
	} catch {
		return null;
	}
};

export const getString = <T extends string>(input: any): T => {
	if (typeof input != "string") {
		throw new ParserSafetyError(
			`${input} of type ${typeof input} is not a valid string!`,
			"String",
			input
		);
	}
	return input as T;
};

export const getNonEmptyString = <T extends string>(input: any): T => {
	const output = getString<T>(input);
	if (output === "") {
		throw new ParserSafetyError(
			`${input} is an empty string!`,
			"Non-empty string",
			input
		);
	}
	return output;
};

export const getNumber = (input: any): number => {
	if (typeof input !== "string" && typeof input !== "number") {
		throw new ParserSafetyError(
			`${input} of type ${typeof input} is not a valid number!`,
			"Number",
			input
		);
	}
	const int = Number(`${input}`);

	if (isNaN(int)) {
		throw new ParserSafetyError(
			`${input} of type ${typeof input} is not a valid number!`,
			"Number",
			input
		);
	}

	return int;
};

export const getNonNegativeNumber = (input: any): number => {
	const int = getNumber(input);

	if (int < 0) {
		throw new ParserSafetyError(
			`${int} is not a non-negative number!`,
			"Non-negative number",
			input
		);
	}

	return int;
};

export const getBoolean = (input: any): boolean => {
	if (
		typeof input !== "boolean" ||
		(typeof input === "string" && input !== "true" && input !== "false") ||
		(typeof input === "number" && input !== 0 && input !== 1)
	) {
		throw new ParserSafetyError(
			`${input} of type ${typeof input} is not a valid boolean!`,
			"Boolean",
			input
		);
	}

	if (typeof input === "string") {
		return input === "true";
	} else if (typeof input === "number") {
		return input === 0 ? false : true;
	} else {
		return input;
	}
};

export const getArray = <T = string>(input: any): T[] => {
	if (!Array.isArray(input)) {
		throw new ParserSafetyError(
			`${input} of type ${typeof input} is not a valid array!`,
			"Array",
			input
		);
	}

	return input;
};

export const getSingletonValue = <T>(input: T[]): T => {
	const arr = getArray<T>(input);
	if (arr.length !== 1) {
		throw new ParserSafetyError(
			`${arr} is not a singleton array!`,
			"Singleton",
			arr
		);
	}

	return arr[0];
};

export const getNonNullValue = <T>(input: T | undefined | null): T => {
	if (input === null || input === undefined) {
		throw new ParserSafetyError(`${input} is null!`, "Non-null", input);
	}

	return input;
};
