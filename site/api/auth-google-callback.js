import { setSessionCookie } from './_session.js';

export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Missing code parameter' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const jwtSecret = process.env.JWT_SECRET;

    if (!clientId || !clientSecret || !jwtSecret) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/auth-google-callback`;

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            return res.status(400).json({ error: 'Failed to get access token' });
        }

        // Fetch user profile
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const user = await userRes.json();

        // Set session cookie
        setSessionCookie(res, {
            provider: 'google',
            name: user.name || '',
            email: user.email || '',
            picture: user.picture || '',
        }, jwtSecret);

        // Redirect to landing page
        res.writeHead(302, { Location: '/' });
        res.end();
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
