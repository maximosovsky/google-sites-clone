export default async function handler(req, res) {
    const url = req.query.url;
    if (!url || !url.includes('sites.google.com')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    let title = '';
    let ogImage = '';

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gsclone/1.0)' },
            redirect: 'follow',
        });
        const html = await response.text();

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].replace(/ - Google Sites$/, '').trim();

        const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
        if (ogMatch) ogImage = ogMatch[1];
    } catch { /* ignore fetch errors */ }

    // Fallback: real screenshot via thum.io (free, no API key)
    if (!ogImage) {
        ogImage = `https://image.thum.io/get/width/600/${url}`;
    }

    return res.status(200).json({ title, ogImage });
}
