const RESEND_API = 'https://api.resend.com/emails';

/**
 * Send an email via Resend API
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 */
export async function sendEmail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'Google Sites Clone <google-sites-clone@osovsky.com>';

    if (!apiKey) throw new Error('RESEND_API_KEY not configured');

    const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error: ${err}`);
    }

    return res.json();
}
