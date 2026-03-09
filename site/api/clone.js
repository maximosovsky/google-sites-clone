import { getSessionFromReq } from './_session.js';
import { sendEmail } from './_email.js';

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

    // Fetch site preview (title + og:image)
    let siteTitle = url;
    let ogImage = '';
    try {
        const pageRes = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gsclone/1.0)' },
            redirect: 'follow',
        });
        const html = await pageRes.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) siteTitle = titleMatch[1].replace(/ - Google Sites$/, '').trim();
        const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
        if (ogMatch) ogImage = ogMatch[1];
    } catch { /* ignore preview errors */ }

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
            // Send immediate "processing started" email
            if (email) {
                try {
                    await sendEmail({
                        to: email,
                        subject: `⏳ Cloning: ${siteTitle}`,
                        html: `
                            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
                                <h2 style="color:#1a1a2e">Cloning started! ⚙️</h2>
                                <p>We found your site and started processing:</p>
                                <div style="background:#f8f9ff;border-radius:12px;padding:16px;margin:16px 0">
                                    <p style="font-weight:bold;margin:0 0 4px">${siteTitle}</p>
                                    <p style="font-size:13px;color:#666;margin:0;word-break:break-all">${url}</p>
                                    ${ogImage ? `<img src="${ogImage}" style="width:100%;border-radius:8px;margin-top:12px" alt="preview"/>` : ''}
                                </div>
                                <p style="font-size:14px;color:#666">⏱ Usually takes 3–10 minutes. We'll email you when the ZIP and report are ready.</p>
                                <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                                <p style="font-size:12px;color:#999">
                                    <a href="https://gsclone.osovsky.com" style="color:#999">gsclone.osovsky.com</a>
                                </p>
                            </div>
                        `,
                    });
                } catch { /* email failure shouldn't block clone */ }
            }

            return res.status(200).json({
                ok: true,
                siteTitle,
                ogImage,
                message: `✅ Clone started!\n\n${siteTitle}`,
            });
        }

        const data = await response.text();
        return res.status(response.status).json({ error: data });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
