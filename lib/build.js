// Step 5: Build — iframe-based navigation
// index.html = sidebar (from page-map) + iframe (loads SingleFile pages)
// Pages = clean SingleFile HTML copies (no injection)
const fs = require('fs');
const path = require('path');

// CSS for video thumbnail play button overlay
const videoThumbCSS = `
.video-thumb { position: relative; display: inline-block; max-width: 100%; cursor: pointer; }
.video-thumb img { display: block; max-width: 100%; height: auto; border-radius: 8px; }
.video-thumb .play-btn {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 64px; height: 64px; background: rgba(0,0,0,0.7); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: #fff; transition: background 0.2s;
}
.video-thumb:hover .play-btn { background: rgba(204,0,0,0.9); }
.video-link { display: inline-block; padding: 8px 16px; background: #f0f0f0; border-radius: 8px; color: #c00; text-decoration: none; font-size: 14px; margin: 4px 0; }
.video-link:hover { background: #e0e0e0; }
`;

/**
 * Replace data-iframe-src placeholder divs with clickable thumbnails
 */
function replaceVideoPlaceholders(html, siteDir) {
  let replaced = 0;
  const thumbDir = path.join(siteDir, 'thumbnails');

  // YouTube: <div data-iframe-src="https://...youtube.com/embed/{ID}?..." ... class="iframe-placeholder"></div>
  html = html.replace(
    /<div\s+data-iframe-src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})[^"]*"[^>]*class="iframe-placeholder"[^>]*><\/div>/gi,
    (match, id) => {
      const thumbFile = `yt-${id}.jpg`;
      const thumbPath = path.join(thumbDir, thumbFile);
      replaced++;
      if (fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 1000) {
        return `<a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" class="video-thumb"><img src="thumbnails/${thumbFile}" alt="YouTube Video" loading="lazy"><span class="play-btn">&#9654;</span></a>`;
      }
      return `<a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" class="video-link">&#9654; Watch on YouTube</a>`;
    }
  );

  // Vimeo via data-url (URL-encoded): data-url="...player.vimeo.com%2Fvideo%2F{ID}..."
  // The parent div wraps an inner div with data-iframe-src pointing to gstatic, but the Vimeo ID is in data-url
  // We match the outer container that has data-url with vimeo ID and replace its iframe-placeholder child
  html = html.replace(
    /<div[^>]+data-url="[^"]*player\.vimeo\.com%2Fvideo%2F(\d+)[^"]*"[^>]*>[\s\S]*?<div[^>]+class="iframe-placeholder"[^>]*><\/div>/gi,
    (match, id) => {
      const thumbFile = `vm-${id}.jpg`;
      const thumbPath = path.join(thumbDir, thumbFile);
      replaced++;
      if (fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 1000) {
        return `<a href="https://vimeo.com/${id}" target="_blank" rel="noopener" class="video-thumb"><img src="thumbnails/${thumbFile}" alt="Vimeo Video" loading="lazy"><span class="play-btn">&#9654;</span></a>`;
      }
      return `<a href="https://vimeo.com/${id}" target="_blank" rel="noopener" class="video-link">&#9654; Watch on Vimeo</a>`;
    }
  );

  // Inject CSS if any replacements were made
  if (replaced > 0) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>${videoThumbCSS}</style>\n</head>`);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `<style>${videoThumbCSS}</style>\n</body>`);
    }
  }

  return { html, replaced };
}

/**
 * Extract video IDs from _content/ HTML, build inline-styled CSS Grid
 * @param {string} contentPath - path to _content/{file}.html
 * @param {string} siteDir - path to site/ (thumbnails dir)
 * @returns {string|null} HTML grid or null if no videos
 */
function buildVideoGrid(contentPath, siteDir) {
  if (!fs.existsSync(contentPath)) return null;

  const contentHtml = fs.readFileSync(contentPath, 'utf8');
  const videos = [];
  const seen = new Set();
  let m;

  // YouTube: data-iframe-src="https://...youtube.com/embed/ID?..."
  const ytRegex = /data-iframe-src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})[^"]*"/g;
  while ((m = ytRegex.exec(contentHtml)) !== null) {
    if (!seen.has('yt-' + m[1])) { seen.add('yt-' + m[1]); videos.push({ type: 'yt', id: m[1] }); }
  }

  // Vimeo: data-iframe-src="https://player.vimeo.com/video/DIGITS..."
  const vm1 = /data-iframe-src="https?:\/\/player\.vimeo\.com\/video\/(\d+)[^"]*"/g;
  while ((m = vm1.exec(contentHtml)) !== null) {
    if (!seen.has('vm-' + m[1])) { seen.add('vm-' + m[1]); videos.push({ type: 'vm', id: m[1] }); }
  }

  // Vimeo URL-encoded: player.vimeo.com%2Fvideo%2FDIGITS
  const vm2 = /player\.vimeo\.com%2Fvideo%2F(\d+)/g;
  while ((m = vm2.exec(contentHtml)) !== null) {
    if (!seen.has('vm-' + m[1])) { seen.add('vm-' + m[1]); videos.push({ type: 'vm', id: m[1] }); }
  }

  // Google Drive: data-iframe-src="https://drive.google.com/file/d/FILE_ID/..."
  const gdRegex = /data-iframe-src="https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)[^"]*"/g;
  while ((m = gdRegex.exec(contentHtml)) !== null) {
    if (!seen.has('gd-' + m[1])) { seen.add('gd-' + m[1]); videos.push({ type: 'gd', id: m[1] }); }
  }

  if (videos.length === 0) return null;

  const thumbDir = path.join(siteDir, 'thumbnails');
  const cards = videos.map(v => {
    if (v.type === 'gd') {
      return `<a href="https://drive.google.com/file/d/${v.id}/view" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;padding:12px;background:#e8f0fe;border-radius:6px;color:#1a73e8;text-decoration:none;font-size:14px;">📁 Google Drive</a>`;
    }

    const prefix = v.type === 'yt' ? 'yt' : 'vm';
    const thumbFile = `${prefix}-${v.id}.jpg`;
    const thumbPath = path.join(thumbDir, thumbFile);
    const href = v.type === 'yt'
      ? `https://www.youtube.com/watch?v=${v.id}`
      : `https://vimeo.com/${v.id}`;

    if (fs.existsSync(thumbPath) && fs.statSync(thumbPath).size > 1000) {
      return `<a href="${href}" target="_blank" rel="noopener" style="position:relative;display:block;"><img src="thumbnails/${thumbFile}" alt="Video" style="width:100%;border-radius:6px;" loading="lazy"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;background:rgba(0,0,0,.7);border-radius:50%;color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;">&#9654;</span></a>`;
    }
    const label = v.type === 'yt' ? 'YouTube' : 'Vimeo';
    return `<a href="${href}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;padding:12px;background:#e8e8e8;border-radius:6px;color:#c00;text-decoration:none;font-size:14px;">&#9654; Watch on ${label}</a>`;
  }).join('\n    ');

  const vidCount = videos.filter(v => v.type !== 'gd').length;
  const gdCount = videos.filter(v => v.type === 'gd').length;
  const headerParts = [];
  if (vidCount > 0) headerParts.push(`\u{1F4FA} Videos (${vidCount})`);
  if (gdCount > 0) headerParts.push(`\u{1F4C1} Files (${gdCount})`);

  return `<div style="all:initial;display:block;padding:16px;background:#f5f5f5;border-bottom:2px solid #ddd;font-family:sans-serif;">
  <div style="font-size:14px;font-weight:700;margin-bottom:8px;">${headerParts.join(' · ')}</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
    ${cards}
  </div>
</div>`;
}

async function build({ pagesDir, contentDir, siteDir, pageMap, nav, youtube }) {
  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

  // Clean stale HTML files from previous builds
  const oldFiles = fs.readdirSync(siteDir).filter(f => f.endsWith('.html'));
  for (const f of oldFiles) fs.unlinkSync(path.join(siteDir, f));

  let built = 0;

  for (const p of pageMap.pages) {
    if (p.file === 'index.html') continue;       // nav shell — build generates it
    const sfPath = path.join(pagesDir, p.file);
    const contentPath = path.join(contentDir, p.file);

    let html = '';

    if (fs.existsSync(sfPath) && fs.statSync(sfPath).size > 1024) {
      // Copy SingleFile HTML as-is (full visual fidelity)
      html = fs.readFileSync(sfPath, 'utf8');

      // Inject video grid from _content/ (SF pages have no data-iframe-src)
      const videoGrid = buildVideoGrid(path.join(contentDir, p.file), siteDir);
      if (videoGrid) {
        html = html.replace(/(<body[^>]*>)/i, `$1\n${videoGrid}`);
      }
    } else if (fs.existsSync(contentPath)) {
      // Fallback: Puppeteer content only
      const content = fs.readFileSync(contentPath, 'utf8');
      html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title}</title></head>
<body>${content}</body></html>`;
    } else {
      console.log(`  ${p.file}: ⚠️ SKIP (no source)`);
      continue;
    }

    // Replace video iframe placeholders with thumbnails
    const videoResult = replaceVideoPlaceholders(html, siteDir);
    html = videoResult.html;

    // Write page (no sidebar injection — pages load inside iframe)
    const outPath = path.join(siteDir, p.file);
    fs.writeFileSync(outPath, html, 'utf8');
    built++;

    const kb = Math.round(html.length / 1024);
    const videoTag = videoResult.replaced > 0 ? ` 📺${videoResult.replaced}` : '';
    console.log(`  ${p.file}: ${kb} KB${videoTag} ✅`);
  }

  // === Generate index.html — sidebar + iframe ===
  const navPages = pageMap.pages.filter(pg => pg.file !== 'index.html');

  const firstPage = navPages.find(p => {
    const sf = path.join(pagesDir, p.file);
    return fs.existsSync(sf) && fs.statSync(sf).size > 1024;
  });
  const defaultPage = firstPage ? firstPage.file : navPages[0]?.file || '';

  const navItems = navPages.map(pg => {
    const indent = pg.depth || 0;
    return `<a class="nav-item" href="${pg.file}" target="content" style="padding-left:${16 + indent * 16}px" onclick="setActive(this)">${pg.title}</a>`;
  }).join('\n');

  const indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pageMap.pages[0]?.title || 'Clone'}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { display: flex; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

/* Sidebar */
.sidebar {
  width: 260px; min-width: 260px; background: #f8f9fa; border-right: 1px solid #dadce0;
  display: flex; flex-direction: column; height: 100vh; overflow: hidden;
}
.sidebar-header {
  padding: 16px; font-size: 14px; font-weight: 700; color: #333;
  border-bottom: 1px solid #dadce0; flex-shrink: 0;
}
.sidebar-nav {
  flex: 1; overflow-y: auto; padding: 8px 0;
}
.nav-item {
  display: block; padding: 8px 16px; color: #3c4043; text-decoration: none;
  font-size: 13px; border-left: 3px solid transparent; transition: all 0.15s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nav-item:hover { background: #e8eaed; color: #1a73e8; }
.nav-item.active { background: #e8f0fe; color: #1a73e8; border-left-color: #1a73e8; font-weight: 600; }
.sidebar-footer {
  padding: 12px 16px; font-size: 11px; color: #999; border-top: 1px solid #dadce0; flex-shrink: 0;
}
.sidebar-footer a { color: #1a73e8; text-decoration: none; }

/* Content iframe */
.content { flex: 1; border: none; height: 100vh; }

/* Mobile */
.hamburger {
  display: none; position: fixed; top: 8px; left: 8px; z-index: 1000;
  background: #fff; border: 1px solid #dadce0; border-radius: 8px;
  padding: 8px 12px; cursor: pointer; font-size: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
@media (max-width: 768px) {
  .sidebar { position: fixed; left: -280px; z-index: 999; transition: left 0.25s; box-shadow: 2px 0 12px rgba(0,0,0,0.2); }
  .sidebar.open { left: 0; }
  .hamburger { display: block; }
}
</style>
</head>
<body>
<button class="hamburger" onclick="document.querySelector('.sidebar').classList.toggle('open')">☰</button>
<aside class="sidebar">
  <div class="sidebar-header">📄 Navigation</div>
  <nav class="sidebar-nav">
    ${navItems}
  </nav>
  <div class="sidebar-footer">
    Built with <a href="https://gsclone.osovsky.com" target="_blank">google-sites-clone</a> · <a href="report.html" target="content">📊 Report</a>
  </div>
</aside>
<iframe name="content" class="content" src="${defaultPage}"></iframe>
<script>
function setActive(el) {
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  // Close sidebar on mobile
  document.querySelector('.sidebar').classList.remove('open');
}
// Set first item active on load
document.querySelector('.nav-item')?.classList.add('active');
</script>
</body>
</html>`;

  fs.writeFileSync(path.join(siteDir, 'index.html'), indexHtml);
  console.log(`  index.html: ${Math.round(indexHtml.length / 1024)} KB ✅`);

  // Generate sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageMap.pages.map(p => `  <url><loc>${p.file}</loc></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(siteDir, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(siteDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: sitemap.xml\n');

  console.log(`\nBuilt ${built} pages + index.html + sitemap.xml + robots.txt`);
}

module.exports = { build };
