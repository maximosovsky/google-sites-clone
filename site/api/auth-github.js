export default async function handler(req, res) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }

    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/auth-github-callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'user:email repo',
    });

    res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
    res.end();
}
