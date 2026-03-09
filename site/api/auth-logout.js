import { clearSessionCookie } from './_session.js';

export default async function handler(req, res) {
    clearSessionCookie(res);
    res.writeHead(302, { Location: '/' });
    res.end();
}
