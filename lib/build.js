// Step 5: Build — iframe-based navigation
// index.html = sidebar (from page-map) + iframe (loads SingleFile pages)
// Pages = clean SingleFile HTML copies (no injection)
const fs = require('fs');
const path = require('path');

async function build({ pagesDir, contentDir, siteDir, pageMap, nav, youtube }) {
  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

  // Clean stale HTML files from previous builds
  const oldFiles = fs.readdirSync(siteDir).filter(f => f.endsWith('.html'));
  for (const f of oldFiles) fs.unlinkSync(path.join(siteDir, f));

  let built = 0;

  for (const p of pageMap.pages) {
    const sfPath = path.join(pagesDir, p.file);
    const contentPath = path.join(contentDir, p.file);

    let html = '';

    if (fs.existsSync(sfPath) && fs.statSync(sfPath).size > 1024) {
      // Copy SingleFile HTML as-is (full visual fidelity)
      html = fs.readFileSync(sfPath, 'utf8');
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

    // Write page (no sidebar injection — pages load inside iframe)
    const outPath = path.join(siteDir, p.file);
    fs.writeFileSync(outPath, html, 'utf8');
    built++;

    const kb = Math.round(html.length / 1024);
    console.log(`  ${p.file}: ${kb} KB ✅`);
  }

  // === Generate index.html — sidebar + iframe ===
  const firstPage = pageMap.pages.find(p => {
    const sf = path.join(pagesDir, p.file);
    return fs.existsSync(sf) && fs.statSync(sf).size > 1024;
  });
  const defaultPage = firstPage ? firstPage.file : pageMap.pages[0]?.file || '';

  const navItems = pageMap.pages.map(pg => {
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
    Built with <a href="https://gsclone.osovsky.com" target="_blank">google-sites-clone</a>
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
