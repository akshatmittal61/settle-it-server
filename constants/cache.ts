import { CacheParameter } from "../types";
import { getEnumeration } from "../utils";

// Maximum TTL for cache in seconds - 24 hours
export const TTL_SECONDS = 60 * 60 * 24;

export const CHECK_INTERVAL = 2 * TTL_SECONDS;

export const cacheParameter = getEnumeration<CacheParameter>([
	"USER",
	"GROUP",
	"EXPENSE",
	"USER_GROUPS",
	"GROUP_EXPENSES",
]);
