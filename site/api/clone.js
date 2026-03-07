export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;
    if (!url || !url.includes('sites.google.com')) {
        return res.status(400).json({ error: 'Invalid Google Sites URL' });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'Server not configured' });
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
                    ref: 'main',
                    inputs: { url },
                }),
            }
        );

        if (response.status === 204) {
            return res.status(200).json({ ok: true, message: 'Clone started! Check GitHub Actions for progress.' });
        }

        const data = await response.text();
        return res.status(response.status).json({ error: data });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
