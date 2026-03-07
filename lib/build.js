// Step 5: Build — merge SingleFile CSS + Puppeteer content into final HTML
const fs = require('fs');
const path = require('path');

async function build({ pagesDir, contentDir, siteDir, pageMap, nav, youtube }) {
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    let built = 0;
    for (const p of pageMap.pages) {
        const contentPath = path.join(contentDir, p.file);
        const sfPath = path.join(pagesDir, p.file);

        // Content from Puppeteer
        const content = fs.existsSync(contentPath) ? fs.readFileSync(contentPath, 'utf8') : '';

        // Styles from SingleFile
        let styles = '';
        if (fs.existsSync(sfPath)) {
            const sfHtml = fs.readFileSync(sfPath, 'utf8');
            sfHtml.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
                styles += css + '\n';
            });
        }

        // YouTube iframe placeholders → thumbnails
        let processedContent = content;
        if (youtube) {
            processedContent = processedContent.replace(
                /<div[^>]*data-iframe-src="([^"]*)"[^>]*data-iframe-label="([^"]*)"[^>]*class="iframe-placeholder"[^>]*><\/div>/gi,
                (match, src, label) => {
                    const ytMatch = src.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/);
                    if (ytMatch) {
                        const vid = ytMatch[1];
                        return `<a href="https://www.youtube.com/watch?v=${vid}" target="_blank" class="yt-thumb">` +
                            `<img src="https://img.youtube.com/vi/${vid}/maxresdefault.jpg" alt="${label || 'YouTube'}">` +
                            `<span class="play-btn"></span></a>`;
                    }
                    if (src) return `<a href="${src}" target="_blank">▶ ${label || 'Video'}</a>`;
                    return '';
                }
            );
        }

        // Build page HTML
        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title}</title>
<style>${styles}</style>
</head>
<body>
${processedContent}
<footer style="text-align:center;padding:20px;opacity:0.5;font-size:12px">
  Built with <a href="https://gsclone.osovsky.com">google-sites-clone</a>
</footer>
</body>
</html>`;

        const outPath = path.join(siteDir, p.file);
        fs.writeFileSync(outPath, html, 'utf8');
        built++;

        const kb = Math.round(html.length / 1024);
        const hasContent = content.length > 100;
        console.log(`  ${p.file}: ${kb} KB ${hasContent ? '✅' : '⚠️ NO CONTENT'}`);
    }

    // Generate sitemap.xml
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageMap.pages.map(p => `  <url><loc>${p.file}</loc></url>`).join('\n')}
</urlset>`;
    fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), sitemap);

    // Generate robots.txt
    fs.writeFileSync(path.join(siteDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: sitemap.xml\n');

    console.log(`\nBuilt ${built} pages + sitemap.xml + robots.txt`);
}

module.exports = { build };
