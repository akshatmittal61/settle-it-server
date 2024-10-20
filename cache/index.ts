import { CHECK_INTERVAL, TTL_SECONDS } from "../constants";
import { logger } from "../log";
import { CacheParameter } from "../types";
import NodeCache from "node-cache";

class Cache {
	private cache: NodeCache;

	constructor() {
		this.cache = new NodeCache({
			stdTTL: TTL_SECONDS,
			checkperiod: CHECK_INTERVAL,
			useClones: false,
			maxKeys: 2000,
		});
	}

	set(key: string, value: any, ttl: number = TTL_SECONDS) {
		this.cache.set(key, value, ttl);
	}

	get(key: string) {
		return this.cache.get(key);
	}

	getAll() {
		return this.cache.keys();
	}

	del(key: string) {
		this.cache.del(key);
	}

	flushAll() {
		this.cache.flushAll();
	}

	/**
	 * Fetches a value from the cache by key, or executes a callback to retrieve the value if it's not cached.
	 *
	 * @param {string} key - The cache key to fetch the value for.
	 * @param {(_?: any) => Promise<T>} callback - A callback function to execute if the value is not cached.
	 * @param {number} [ttl=TTL_SECONDS] - The time to live for the cached value.
	 * @return {Promise<T>} The cached or newly retrieved value.
	 */
	async fetch<T>(
		key: string,
		callback: (_?: any) => Promise<T>,
		ttl: number = TTL_SECONDS
	): Promise<T> {
		if (
			typeof key === "string" &&
			key.length > 0 &&
			key !== "undefined" &&
			key !== "null"
		) {
			const cachedValue: any = this.cache.get(key);
			if (cachedValue) {
				return cachedValue;
			}
			logger.debug(`Cache miss for ${key}`);
			const newValue = await callback();
			this.set(key, newValue, ttl);
			return newValue;
		} else {
			return callback();
		}
	}

	invalidate(key: string) {
		if (this.cache.has(key)) {
			this.cache.del(key);
		}
	}
}

declare global {
	// eslint-disable-next-line no-unused-vars
	var cache: Cache;
}

export const cache = global.cache || new Cache();

export const getCacheKey = (parameter: CacheParameter, data: any) => {
	switch (parameter) {
		case "USER":
			return `user:${data.id}`;
		case "GROUP":
			return `group:${data.id}`;
		case "EXPENSE":
			return `expense:${data.id}`;
		case "USER_GROUPS":
			return `user:${data.userId}:groups`;
		case "GROUP_EXPENSES":
			return `group:${data.groupId}:expenses`;
		default:
			return `cache:${parameter}:${JSON.stringify(data)}`;
	}
};
