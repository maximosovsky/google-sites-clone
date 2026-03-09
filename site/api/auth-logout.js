import { clearSessionCookie } from './_session.js';

export default async function handler(req, res) {
    const provider = req.query.provider; // ?provider=google or ?provider=github
    clearSessionCookie(res, provider || null);
    res.writeHead(302, { Location: '/' });
    res.end();
}
