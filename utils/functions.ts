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
