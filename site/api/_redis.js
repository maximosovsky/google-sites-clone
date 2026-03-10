import { Redis } from '@upstash/redis';

let _redis = null;

function getRedis() {
    if (_redis) return _redis;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    _redis = new Redis({ url, token });
    return _redis;
}

/**
 * Get total clone count for a user
 * @param {string} email
 * @returns {number}
 */
export async function getCloneCount(email) {
    const redis = getRedis();
    if (!redis) return 0;
    const count = await redis.get(`clones:${email}`);
    return Number(count) || 0;
}

/**
 * Get today's clone count for a user
 * @param {string} email
 * @returns {number}
 */
export async function getDailyCount(email) {
    const redis = getRedis();
    if (!redis) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const count = await redis.get(`clones:daily:${email}:${today}`);
    return Number(count) || 0;
}

/**
 * Get this month's clone count for a user
 * @param {string} email
 * @returns {number}
 */
export async function getMonthlyCount(email) {
    const redis = getRedis();
    if (!redis) return 0;
    const month = new Date().toISOString().slice(0, 7);
    const count = await redis.get(`clones:monthly:${email}:${month}`);
    return Number(count) || 0;
}

/**
 * Increment all clone counters for a user
 * @param {string} email
 */
export async function incrementCloneCount(email) {
    const redis = getRedis();
    if (!redis) return;
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    await Promise.all([
        redis.incr(`clones:${email}`),
        redis.incr(`clones:daily:${email}:${today}`).then(() =>
            redis.expire(`clones:daily:${email}:${today}`, 86400)
        ),
        redis.incr(`clones:monthly:${email}:${month}`).then(() =>
            redis.expire(`clones:monthly:${email}:${month}`, 35 * 86400)
        ),
    ]);
}
