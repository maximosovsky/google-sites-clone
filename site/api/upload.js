import crypto from 'crypto';
import { uploadToR2 } from './_r2.js';
import { sendEmail } from './_email.js';

export const config = {
    api: { bodyParser: { sizeLimit: '50mb' } },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify webhook secret
    const secret = process.env.WEBHOOK_SECRET;
    const authHeader = req.headers.authorization;
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, siteUrl } = req.body;
    const zipBase64 = req.body.zip; // base64-encoded ZIP
    const reportHtml = req.body.report; // HTML string

    if (!zipBase64 || !reportHtml) {
        return res.status(400).json({ error: 'Missing zip or report' });
    }

    try {
        const id = crypto.randomBytes(8).toString('hex');
        const zipBuffer = Buffer.from(zipBase64, 'base64');

        // Upload ZIP to R2 (7 day TTL via lifecycle rule)
        const zipKey = `zips/${id}.zip`;
        await uploadToR2(zipKey, zipBuffer, 'application/zip', {
            ttl: '7d',
            email: email || '',
            site: siteUrl || '',
        });

        // Upload report to R2 (360 day TTL via lifecycle rule)
        const reportKey = `reports/${id}.html`;
        await uploadToR2(reportKey, Buffer.from(reportHtml, 'utf-8'), 'text/html', {
            ttl: '360d',
            email: email || '',
            site: siteUrl || '',
        });

        const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
        const zipUrl = `${baseUrl}/api/download?id=${id}&type=zip`;
        const reportUrl = `${baseUrl}/api/download?id=${id}&type=report`;

        // Send email if address provided
        if (email) {
            await sendEmail({
                to: email,
                subject: `Your Google Sites clone is ready`,
                html: `
                    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
                        <h2 style="color:#1a1a2e">Your clone is ready! 🎉</h2>
                        <p>Site: <a href="${siteUrl}">${siteUrl}</a></p>
                        <p>
                            <a href="${zipUrl}" style="display:inline-block;padding:12px 24px;background:#2a9d5c;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
                                📦 Download ZIP
                            </a>
                        </p>
                        <p style="font-size:13px;color:#666">ZIP link expires in 7 days.</p>
                        <p>
                            <a href="${reportUrl}">📊 View clone report</a>
                            <span style="font-size:13px;color:#666">(available for 360 days)</span>
                        </p>
                        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                        <p style="font-size:12px;color:#999">
                            <a href="https://gsclone.osovsky.com" style="color:#999">gsclone.osovsky.com</a>
                        </p>
                    </div>
                `,
            });
        }

        return res.status(200).json({
            ok: true,
            id,
            zip: zipUrl,
            report: reportUrl,
            emailSent: !!email,
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
