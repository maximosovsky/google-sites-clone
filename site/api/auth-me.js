import { getSessionFromReq } from './_session.js';

export default async function handler(req, res) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    const sessions = getSessionFromReq(req, jwtSecret);

    // Strip tokens — never expose to frontend
    const safe = (u) => u ? { provider: u.provider, name: u.name, email: u.email, picture: u.picture } : null;

    return res.status(200).json({
        google: safe(sessions.google),
        github: safe(sessions.github),
    });
}
