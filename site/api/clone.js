import crypto from 'crypto';
import { getSessionFromReq } from './_session.js';
import { sendEmail } from './_email.js';
import { uploadToR2 } from './_r2.js';
import { checkRateLimit } from './_ratelimit.js';
import { incrementCloneCount } from './_redis.js';

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
    let authenticated = false;
    let sessions = { google: null, github: null };
    if (jwtSecret) {
        sessions = getSessionFromReq(req, jwtSecret);
        if (sessions.google) {
            authenticated = true;
            if (!email) email = sessions.google.email || '';
        }
        if (sessions.github) {
            authenticated = true;
            if (!email) email = sessions.github.email || '';
            ghToken = sessions.github.token || '';
            ghUser = sessions.github.name || '';
        }
    }

    if (!authenticated) {
        return res.status(401).json({ error: 'Sign in with Google or GitHub to clone' });
    }

    // Fetch site preview (title + og:image + page count estimate)
    let siteTitle = url;
    let ogImage = '';
    let ogImageR2 = '';
    let estimatedPages = 0;
    let estimatedZipMB = 0;
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

        // Count nav links to estimate pages (~3 MB/page in ZIP)
        const navLinks = html.match(/sites\.google\.com\/[^"'\s]+/gi) || [];
        const uniquePages = new Set(navLinks.map(l => l.replace(/[#?].*/, '')));
        estimatedPages = Math.max(uniquePages.size, 1);
        estimatedZipMB = Math.round(estimatedPages * 3);

        // Download og:image and upload to R2 for email compatibility
        if (ogImage) {
            try {
                const imgRes = await fetch(ogImage, { redirect: 'follow' });
                if (imgRes.ok) {
                    const imgBuf = Buffer.from(await imgRes.arrayBuffer());
                    const ct = imgRes.headers.get('content-type') || 'image/png';
                    const ext = ct.includes('jpeg') || ct.includes('jpg') ? 'jpg' : 'png';
                    const imgKey = `previews/${crypto.randomBytes(8).toString('hex')}.${ext}`;
                    await uploadToR2(imgKey, imgBuf, ct, { ttl: '7d' });
                    const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
                    ogImageR2 = `${baseUrl}/api/download?key=${imgKey}`;
                }
            } catch { /* preview image upload is optional */ }
        }
    } catch { /* ignore preview errors */ }

    // Rate limit check
    const rateLimit = await checkRateLimit(sessions, estimatedZipMB);
    if (!rateLimit.allowed) {
        // Send Unlimited offer email when Starred user exhausts limits
        if (rateLimit.limitReached && email) {
            try {
                await sendEmail({
                    to: email,
                    subject: `\u{1F680} Unlock unlimited cloning`,
                    html: `
                        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
                            <h2 style="color:#1a1a2e">You've reached your clone limit \u{1F4CA}</h2>
                            <p>You've used <strong>${rateLimit.monthlyCount}</strong> clones this month (limit: 20/month).</p>
                            <p>Need more? <strong>Unlimited cloning</strong> is available for <strong>$99/month</strong> \u2014 no limits on clones or file size.</p>
                            <p>Reply to this email to get started.</p>
                            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                            <p style="font-size:12px;color:#999">
                                <a href="https://gsclone.osovsky.com" style="color:#999">gsclone.osovsky.com</a>
                            </p>
                        </div>
                    `,
                });
            } catch { /* email is best-effort */ }
        }
        return res.status(403).json({
            error: rateLimit.reason,
            needsGithub: rateLimit.needsGithub,
            needsStar: rateLimit.needsStar,
            limitReached: rateLimit.limitReached,
        });
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
            const previewImg = ogImageR2 || ogImage;

            // Increment clone counter
            await incrementCloneCount(email);

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
                                    ${estimatedPages ? `<p style="font-size:13px;color:#555;margin:8px 0 0">📊 ~${estimatedPages} pages · estimated ZIP ~${estimatedZipMB} MB</p>` : ''}
                                    ${previewImg ? `<img src="${previewImg}" style="width:100%;border-radius:8px;margin-top:12px" alt="preview"/>` : ''}
                                </div>
                                <p style="font-size:14px;color:#666">⏱ Usually takes 3–10 minutes. We'll email you when the ZIP and report are ready.</p>
                                <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                                <p style="font-size:12px;color:#999">
                                    <a href="https://gsclone.osovsky.com" style="color:#999">gsclone.osovsky.com</a>
                                </p>
                            </div>
                        `,
                    });
                } catch (emailErr) {
                    var emailError = emailErr.message;
                }
            }

            return res.status(200).json({
                ok: true,
                siteTitle,
                ogImage: previewImg,
                estimatedPages,
                estimatedZipMB,
                emailError: emailError || null,
                message: `✅ Clone started!\n\n${siteTitle}`,
            });
        }

        const data = await response.text();
        return res.status(response.status).json({ error: data });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
