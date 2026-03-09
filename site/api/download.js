import { getDownloadUrl } from './_r2.js';

export default async function handler(req, res) {
    const { id, type } = req.query;

    if (!id || !type) {
        return res.status(400).json({ error: 'Missing id or type parameter' });
    }

    const validTypes = { zip: 'zips', report: 'reports' };
    const prefix = validTypes[type];
    if (!prefix) {
        return res.status(400).json({ error: 'Type must be "zip" or "report"' });
    }

    const ext = type === 'zip' ? '.zip' : '.html';
    const key = `${prefix}/${id}${ext}`;

    try {
        const url = await getDownloadUrl(key);
        res.writeHead(302, { Location: url });
        res.end();
    } catch (e) {
        if (e.name === 'NoSuchKey' || e.Code === 'NoSuchKey') {
            return res.status(404).json({ error: 'File not found or expired' });
        }
        return res.status(500).json({ error: e.message });
    }
}
