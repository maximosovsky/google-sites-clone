import { getCloneCount, getDailyCount, getMonthlyCount } from './_redis.js';

const MAX_ZIP_MB = 250;
const FREE_CLONES = 1;
const DAILY_LIMIT = 5;
const MONTHLY_LIMIT = 20;

/**
 * Check if user starred the repo
 * @param {string} ghToken - GitHub OAuth token
 * @returns {boolean}
 */
export async function checkStarred(ghToken) {
    if (!ghToken) return false;
    try {
        const res = await fetch(
            'https://api.github.com/user/starred/maximosovsky/google-sites-clone',
            {
                headers: {
                    Authorization: `Bearer ${ghToken}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'gsclone',
                },
            }
        );
        return res.status === 204;
    } catch {
        return false;
    }
}

/**
 * Check rate limit for a clone request
 * @param {object} sessions - { google, github } session objects
 * @param {number} estimatedZipMB - estimated ZIP size in MB
 * @returns {object} { allowed, reason, needsGithub, needsStar, limitReached, cloneCount, dailyCount, monthlyCount }
 */
export async function checkRateLimit(sessions, estimatedZipMB) {
    const result = {
        allowed: true,
        reason: '',
        needsGithub: false,
        needsStar: false,
        limitReached: false,
        cloneCount: 0,
        dailyCount: 0,
        monthlyCount: 0,
    };

    // ZIP size check (all tiers)
    if (estimatedZipMB > MAX_ZIP_MB) {
        result.allowed = false;
        result.reason = `Site too large (~${estimatedZipMB} MB). Max ${MAX_ZIP_MB} MB per clone. Use the CLI for larger sites: npx google-sites-clone URL`;
        return result;
    }

    const email = sessions.google?.email || sessions.github?.email || '';
    if (!email) {
        result.allowed = false;
        result.reason = 'Sign in to clone';
        return result;
    }

    const [cloneCount, dailyCount, monthlyCount] = await Promise.all([
        getCloneCount(email),
        getDailyCount(email),
        getMonthlyCount(email),
    ]);

    result.cloneCount = cloneCount;
    result.dailyCount = dailyCount;
    result.monthlyCount = monthlyCount;

    // Free tier: 1 clone allowed
    if (cloneCount < FREE_CLONES) {
        return result;
    }

    // Need GitHub auth for Starred tier
    if (!sessions.github) {
        result.allowed = false;
        result.needsGithub = true;
        result.reason = 'Sign in with GitHub to continue cloning';
        return result;
    }

    // Need star for Starred tier
    const starred = await checkStarred(sessions.github.token);
    if (!starred) {
        result.allowed = false;
        result.needsStar = true;
        result.reason = 'Star the repo on GitHub to unlock more clones';
        return result;
    }

    // Starred tier: check daily limit
    if (dailyCount >= DAILY_LIMIT) {
        result.allowed = false;
        result.limitReached = true;
        result.reason = `Daily limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`;
        return result;
    }

    // Starred tier: check monthly limit
    if (monthlyCount >= MONTHLY_LIMIT) {
        result.allowed = false;
        result.limitReached = true;
        result.reason = `Monthly limit reached (${MONTHLY_LIMIT}/month). Check your email for upgrade options.`;
        return result;
    }

    return result;
}
