import { getSessionFromReq } from './_session.js';
import { getCloneCount, getDailyCount, getMonthlyCount, getStarredInfo } from './_redis.js';
import { checkStarred } from './_ratelimit.js';

export default async function handler(req, res) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    const sessions = getSessionFromReq(req, jwtSecret);

    // Strip tokens — never expose to frontend
    const safe = (u) => u ? { provider: u.provider, name: u.name, email: u.email, picture: u.picture } : null;

    // Get rate limit info
    const email = sessions.google?.email || sessions.github?.email || '';
    let cloneCount = 0;
    let dailyCount = 0;
    let monthlyCount = 0;
    let starred = false;

    if (email) {
        try {
            [cloneCount, dailyCount, monthlyCount] = await Promise.all([
                getCloneCount(email),
                getDailyCount(email),
                getMonthlyCount(email),
            ]);

            // Check cached star first, then live GitHub API
            const cachedStar = await getStarredInfo(email);
            if (cachedStar) {
                starred = true;
            } else if (sessions.github?.token) {
                starred = await checkStarred(sessions.github.token);
            }
        } catch { /* Redis unavailable — continue with defaults */ }
    }

    return res.status(200).json({
        google: safe(sessions.google),
        github: safe(sessions.github),
        cloneCount,
        dailyCount,
        monthlyCount,
        starred,
    });
}
