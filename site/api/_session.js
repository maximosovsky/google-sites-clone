import crypto from 'crypto';

const COOKIE_NAME = 'gsclone_session';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export function signSession(data, secret) {
    const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

export function verifySession(token, secret) {
    if (!token || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (sig !== expected) return null;
    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
        return null;
    }
}

export function setSessionCookie(res, data, secret) {
    const token = signSession(data, secret);
    res.setHeader('Set-Cookie', [
        `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
    ]);
}

export function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', [
        `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
    ]);
}

export function getSessionFromReq(req, secret) {
    const cookies = req.headers.cookie || '';
    const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    const token = match.split('=').slice(1).join('=');
    return verifySession(token, secret);
}
