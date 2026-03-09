import { setSessionCookie } from './_session.js';

export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Missing code parameter' });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const jwtSecret = process.env.JWT_SECRET;

    if (!clientId || !clientSecret || !jwtSecret) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            return res.status(400).json({ error: 'Failed to get access token' });
        }

        // Fetch user profile
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'gsclone',
            },
        });

        const user = await userRes.json();

        // Fetch primary email (may be private)
        let email = user.email || '';
        if (!email) {
            const emailRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'gsclone',
                },
            });
            const emails = await emailRes.json();
            if (Array.isArray(emails)) {
                const primary = emails.find(e => e.primary) || emails[0];
                email = primary?.email || '';
            }
        }

        // Set session cookie (include token for deploy)
        setSessionCookie(res, {
            provider: 'github',
            name: user.login || user.name || '',
            email,
            picture: user.avatar_url || '',
            token: tokenData.access_token,
        }, jwtSecret);

        // Redirect to landing page
        res.writeHead(302, { Location: '/' });
        res.end();
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
