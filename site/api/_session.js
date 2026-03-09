import crypto from 'crypto';

const COOKIE_GOOGLE = 'gsclone_google';
const COOKIE_GITHUB = 'gsclone_github';
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

function cookieName(provider) {
    return provider === 'github' ? COOKIE_GITHUB : COOKIE_GOOGLE;
}

export function setSessionCookie(res, data, secret) {
    const name = cookieName(data.provider);
    const token = signSession(data, secret);
    const existing = res.getHeader('Set-Cookie') || [];
    const cookies = Array.isArray(existing) ? existing : [existing];
    cookies.push(`${name}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`);
    res.setHeader('Set-Cookie', cookies);
}

export function clearSessionCookie(res, provider) {
    if (provider) {
        const name = cookieName(provider);
        res.setHeader('Set-Cookie', [
            `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
        ]);
    } else {
        // Clear both
        res.setHeader('Set-Cookie', [
            `${COOKIE_GOOGLE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
            `${COOKIE_GITHUB}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
        ]);
    }
}

function parseCookies(req) {
    const cookies = {};
    (req.headers.cookie || '').split(';').forEach(c => {
        const [k, ...v] = c.trim().split('=');
        if (k) cookies[k] = v.join('=');
    });
    return cookies;
}

export function getSessionFromReq(req, secret, provider) {
    const cookies = parseCookies(req);
    if (provider) {
        const token = cookies[cookieName(provider)];
        return token ? verifySession(token, secret) : null;
    }
    // Return both
    const google = cookies[COOKIE_GOOGLE] ? verifySession(cookies[COOKIE_GOOGLE], secret) : null;
    const github = cookies[COOKIE_GITHUB] ? verifySession(cookies[COOKIE_GITHUB], secret) : null;
    return { google, github };
}
