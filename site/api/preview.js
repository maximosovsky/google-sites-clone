export default async function handler(req, res) {
    const url = req.query.url;
    if (!url || !url.includes('sites.google.com')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gsclone/1.0)' },
        });
        const html = await response.text();

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
            || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);

        return res.status(200).json({
            title: titleMatch ? titleMatch[1].trim() : '',
            ogImage: ogMatch ? ogMatch[1] : '',
        });
    } catch {
        return res.status(200).json({ title: '', ogImage: '' });
    }
}
