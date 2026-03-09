import { getSessionFromReq } from './_session.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, email: overrideEmail } = req.body;
    if (!url || !url.includes('sites.google.com')) {
        return res.status(400).json({ error: 'Invalid Google Sites URL' });
    }

    const token = process.env.GITHUB_TOKEN;
    const jwtSecret = process.env.JWT_SECRET;
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!token) {
        return res.status(500).json({ error: 'Server not configured' });
    }

    // Get user email and GitHub token from sessions
    let email = overrideEmail || '';
    let ghToken = '';
    let ghUser = '';
    if (jwtSecret) {
        const sessions = getSessionFromReq(req, jwtSecret);
        if (sessions.google && !email) email = sessions.google.email || '';
        if (sessions.github) {
            if (!email) email = sessions.github.email || '';
            ghToken = sessions.github.token || '';
            ghUser = sessions.github.name || '';
        }
    }

    try {
        const response = await fetch(
            'https://api.github.com/repos/maximosovsky/google-sites-clone/actions/workflows/clone.yml/dispatches',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: 'master',
                    inputs: {
                        url,
                        email,
                        webhook_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/upload`,
                        webhook_secret: webhookSecret || '',
                        gh_token: ghToken,
                        gh_user: ghUser,
                    },
                }),
            }
        );

        if (response.status === 204) {
            const parts = [];
            if (email) parts.push('📧 Email with download link when ready.');
            if (ghUser) parts.push(`🚀 Auto-deploy to ${ghUser}.github.io.`);
            if (!parts.length) parts.push('Check GitHub Actions for progress.');
            return res.status(200).json({
                ok: true,
                message: `✅ Clone started!\n\n${parts.join('\n')}`,
            });
        }

        const data = await response.text();
        return res.status(response.status).json({ error: data });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}

