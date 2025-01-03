/**
 * Creates an object where every key is a value from the given array and has itself as the value.
 * This is useful for creating enumerations.
 * @example
 * const enumFromString = getEnumeration(["a", "b", "c"]);
 * // enumFromString = { a: "a", b: "b", c: "c" }
 * @returns {Object} An object with the given values as keys and values.
 */
export const getEnumeration = <T extends string>(
	arr: Array<T>
): { [K in T]: K } => {
	const enumeration: { [K in T]: K } = arr.reduce((acc, key) => {
		acc[key] = key;
		return acc;
	}, {} as any);
	return enumeration;
};

/**
 * Omits the given keys from the object.
 * @param {Object} obj The object to omit keys from.
 * @param {string[]} keys The keys to omit.
 * @returns {Object} The new object with the omitted keys.
 */
export const omitKeys = (obj: any, keys: string[]): any => {
	const newObj: any = {};
	Object.keys(obj).forEach((key) => {
		if (!keys.includes(key)) {
			newObj[key] = obj[key];
		}
	});
	return newObj;
};

/**
 * Checks if the given subset is a subset of the given superset.
 * @example
 * isSubset([1, 2], [1, 2, 3]) // true
 * isSubset([1, 2, 4], [1, 2, 3]) // false
 * @param {Array<T>} subset The subset to check.
 * @param {Array<T>} superset The superset to check against.
 * @returns {boolean} If the subset is a subset of the superset.
 */
export const isSubset = <T = any>(
	subset: Array<T>,
	superset: Array<T>
): boolean => {
	return subset.every((value) => superset.includes(value));
};

/**
 * Simplifies a given fraction string to its simplest form.
 * If the input is not a valid fraction, returns the input as is.
 *
 * @example
 * simplifyFraction("4/8") // "1/2"
 * simplifyFraction("10/5") // "2/1"
 * simplifyFraction("3/7") // "3/7"
 * simplifyFraction("invalid") // "invalid"
 *
 * @param {string} fraction - The fraction string to simplify.
 * @returns {string} - The simplified fraction or the original input if invalid.
 */

export const simplifyFraction = (fraction: string): string => {
	const splitted = fraction.split("/");
	if (splitted.length !== 2 || isNaN(+splitted[0]) || isNaN(+splitted[1])) {
		return fraction;
	}
	const numerator = +splitted[0];
	const denominator = +splitted[1];
	const divisors = [];
	for (let i = 2; i <= Math.min(numerator, denominator); i++) {
		if (denominator % i === 0) {
			divisors.push(i);
		}
	}
	for (let i = divisors.length - 1; i >= 0; i--) {
		if (numerator % divisors[i] === 0) {
			return `${numerator / divisors[i]}/${denominator / divisors[i]}`;
		}
	}
	return fraction;
};

/**
 * Maps a given number from a range [min, max] to a new range [newMin, newMax].
 * @example
 * mapNumberBetween(5, 0, 10, 0, 100) // 50
 * mapNumberBetween(0, 0, 10, 0, 100) // 0
 * mapNumberBetween(10, 0, 10, 0, 100) // 100
 * @param {number} num - The number to map.
 * @param {number} min - The minimum of the original range.
 * @param {number} max - The maximum of the original range.
 * @param {number} newMin - The minimum of the new range.
 * @param {number} newMax - The maximum of the new range.
 * @returns {number} The mapped number.
 */
export const mapNumberBetween = (
	num: number,
	min: number,
	max: number,
	newMin: number,
	newMax: number
): number => {
	return ((num - min) * (newMax - newMin)) / (max - min) + newMin;
};
