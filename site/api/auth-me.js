import { getSessionFromReq } from './_session.js';

export default async function handler(req, res) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    const user = getSessionFromReq(req, jwtSecret);
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.status(200).json(user);
}
