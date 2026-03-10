// Error reporter — logs errors to R2 + sends Resend email
const https = require('https');

function postJSON(url, headers, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function reportError(error, context = {}) {
    const report = {
        timestamp: new Date().toISOString(),
        error: error.message || String(error),
        stack: error.stack || null,
        step: context.step || 'unknown',
        url: context.url || 'unknown',
        page: context.page || null,
        nodeVersion: process.version,
        platform: process.platform,
    };

    // 1. Log to R2 (via Vercel API if available, or direct)
    const r2Key = process.env.R2_ACCESS_KEY_ID;
    if (r2Key) {
        try {
            const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
            const s3 = new S3Client({
                region: 'auto',
                endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY_ID,
                    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
                },
            });
            const key = `errors/${report.timestamp.slice(0, 10)}/${Date.now()}.json`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET || 'gsclone',
                Key: key,
                Body: JSON.stringify(report, null, 2),
                ContentType: 'application/json',
            }));
            console.log(`Error logged to R2: ${key}`);
        } catch (e) {
            console.error('Failed to log error to R2:', e.message);
        }
    }

    // 2. Send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;
    if (resendKey && resendFrom) {
        try {
            const emailBody = [
                `Error in gsclone`,
                `Site: ${report.url}`,
                `Step: ${report.step}`,
                `Page: ${report.page || 'N/A'}`,
                `Error: ${report.error}`,
                `Time: ${report.timestamp}`,
                `Node: ${report.nodeVersion} / ${report.platform}`,
            ].join('\n');

            const req = https.request({
                hostname: 'api.resend.com',
                path: '/emails',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                },
            });
            req.write(JSON.stringify({
                from: resendFrom,
                to: 'osovsky@gmail.com',
                subject: `gsclone error: ${report.step} - ${report.error.slice(0, 50)}`,
                text: emailBody,
            }));
            req.end();
        } catch (e) {
            // Silent fail — email is secondary
        }
    }

    return report;
}

module.exports = { reportError };
