// Generate report.html — site map + SF vs PP + video/embedded comparison
const fs = require('fs');
const path = require('path');

/** Recursively calculate total directory size in bytes */
function dirSize(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    total += stat.isDirectory() ? dirSize(full) : stat.size;
  }
  return total;
}

function generateReport(dir) {
  const pageMap = JSON.parse(fs.readFileSync(path.join(dir, 'page-map.json'), 'utf8'));
  const pagesDir = path.join(dir, '_pages');
  const contentDir = path.join(dir, '_content');
  const siteDir = path.join(dir, 'site');
  const thumbDir = path.join(siteDir, 'thumbnails');

  const rows = pageMap.pages.map((p, i) => {
    const sfPath = path.join(pagesDir, p.file);
    const ppPath = path.join(contentDir, p.file);
    const outPath = path.join(siteDir, p.file);

    const sfExists = fs.existsSync(sfPath);
    const ppExists = fs.existsSync(ppPath);
    const outExists = fs.existsSync(outPath);

    const sfSize = sfExists ? Math.round(fs.statSync(sfPath).size / 1024) : 0;
    const ppSize = ppExists ? Math.round(fs.statSync(ppPath).size / 1024) : 0;
    const outSize = outExists ? Math.round(fs.statSync(outPath).size / 1024) : 0;

    // Count images in SingleFile (base64)
    const sfContent = sfExists ? fs.readFileSync(sfPath, 'utf8') : '';
    const b64Count = (sfContent.match(/data:image\//g) || []).length;

    // Scan Puppeteer content for embedded iframes
    const ppContent = ppExists ? fs.readFileSync(ppPath, 'utf8') : '';

    // YouTube
    const ytMatches = ppContent.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/gi) || [];
    const ytIDs = ytMatches.map(m => {
      const match = m.match(/embed\/([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Vimeo
    const vimeoMatches = ppContent.match(/player\.vimeo\.com\/video\/(\d+)/gi) || [];
    const vimeoIDs = vimeoMatches.map(m => {
      const match = m.match(/video\/(\d+)/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Google Drive
    const gdriveMatches = ppContent.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/gi) || [];
    const gdriveIDs = gdriveMatches.map(m => {
      const match = m.match(/\/d\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);

    // Check downloaded thumbnails
    const thumbsDownloaded = ytIDs.filter(id => {
      return fs.existsSync(path.join(thumbDir, `yt-${id}.jpg`));
    }).length;

    const totalEmbeds = ytIDs.length + vimeoIDs.length + gdriveIDs.length;

    const sfIcon = sfExists ? (sfSize > 1 ? '✅' : '⚠️') : '❌';
    const ppIcon = ppExists ? (ppSize > 0 ? '✅' : '⚠️') : '❌';
    const indent = p.depth ? `padding-left:${20 + p.depth * 20}px` : '';

    // Video details for expandable row — green if thumb exists, red if not
    let videoDetail = '';
    if (ytIDs.length) videoDetail += ytIDs.map(id => {
      const has = fs.existsSync(path.join(thumbDir, `yt-${id}.jpg`));
      return `<a href="https://www.youtube.com/watch?v=${id}" target="_blank" class="chip ${has ? 'ok' : 'no'}">▶ YT: ${id}</a>`;
    }).join(' ');
    if (vimeoIDs.length) videoDetail += vimeoIDs.map(id => {
      const has = fs.existsSync(path.join(thumbDir, `vm-${id}.jpg`));
      return `<a href="https://vimeo.com/${id}" target="_blank" class="chip ${has ? 'ok' : 'no'}">▶ Vimeo: ${id}</a>`;
    }).join(' ');
    if (gdriveIDs.length) videoDetail += gdriveIDs.map(id => `<a href="https://drive.google.com/file/d/${id}" target="_blank" class="chip gd">📁 GDrive: ${id.substring(0, 12)}…</a>`).join(' ');

    return `<tr>
  <td>${i + 1}</td>
  <td style="${indent}">${p.title}</td>
  <td>${p.depth || 0}</td>
  <td>${sfIcon} ${sfSize} KB</td>
  <td>${b64Count}</td>
  <td>${ppIcon} ${ppSize} KB</td>
  <td>${totalEmbeds > 0 ? `<b>${totalEmbeds}</b>` : '0'}</td>
  <td>${ytIDs.length > 0 ? `🎬 ${ytIDs.length}` : '—'}</td>
  <td>${vimeoIDs.length > 0 ? `🎬 ${vimeoIDs.length}` : '—'}</td>
  <td>${gdriveIDs.length > 0 ? `📁 ${gdriveIDs.length}` : '—'}</td>
  <td>${thumbsDownloaded > 0 ? `✅ ${thumbsDownloaded}` : (ytIDs.length > 0 ? '❌ 0' : '—')}</td>
  <td>${outSize} KB</td>
  <td>
    ${sfExists ? `<a href="../_pages/${p.file}" target="_blank">SF</a>` : '—'}
    ${ppExists ? ` · <a href="../_content/${p.file}" target="_blank">PP</a>` : ''}
    ${outExists ? ` · <a href="${p.file}" target="_blank">Final</a>` : ''}
  </td>
</tr>${videoDetail ? `<tr class="detail-row"><td></td><td colspan="12">${videoDetail}</td></tr>` : ''}`;
  });

  // Totals
  const totalPages = pageMap.pages.length;
  const totalSF = pageMap.pages.filter(p => fs.existsSync(path.join(pagesDir, p.file))).length;
  const totalPP = pageMap.pages.filter(p => fs.existsSync(path.join(contentDir, p.file))).length;
  const totalOut = pageMap.pages.filter(p => fs.existsSync(path.join(siteDir, p.file))).length;

  // Count all embeds across all pages
  let totalYT = 0, totalVimeo = 0, totalGDrive = 0, totalThumbs = 0;
  pageMap.pages.forEach(p => {
    const ppPath2 = path.join(contentDir, p.file);
    if (!fs.existsSync(ppPath2)) return;
    const c = fs.readFileSync(ppPath2, 'utf8');
    const yt = (c.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/gi) || []);
    const vm = (c.match(/player\.vimeo\.com\/video\/\d+/gi) || []);
    const gd = (c.match(/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/gi) || []);
    totalYT += yt.length;
    totalVimeo += vm.length;
    totalGDrive += gd.length;
    yt.forEach(m => {
      const match = m.match(/embed\/([a-zA-Z0-9_-]{11})/);
      if (match && fs.existsSync(path.join(thumbDir, `yt-${match[1]}.jpg`))) totalThumbs++;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clone Report — ${pageMap.pages[0]?.title || 'Unknown'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 24px; }
  h1 { font-size: 22px; margin-bottom: 8px; }
  .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
  .summary { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .card { background: #fff; border-radius: 12px; padding: 14px 18px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); min-width: 120px; }
  .card .num { font-size: 24px; font-weight: 700; color: #1a73e8; }
  .card .label { font-size: 11px; color: #666; margin-top: 4px; }
  .card.warn .num { color: #ea8600; }
  .card.err .num { color: #c5221f; }
  table { width: 100%; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); border-collapse: collapse; }
  th { background: #1a73e8; color: #fff; padding: 8px 10px; font-size: 11px; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #eee; }
  tr:hover td { background: #f8f9fe; }
  .detail-row td { padding: 4px 10px 8px; background: #fafafa; border-bottom: 2px solid #e0e0e0; }
  a { color: #1a73e8; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .chip { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin: 2px; text-decoration: none; }
  .chip.ok { background: #e6f4ea; color: #137333; }
  .chip.no { background: #fce8e6; color: #c5221f; }
  .chip.gd { background: #e6f4ea; color: #137333; }
  .legend { margin-top: 16px; font-size: 12px; color: #888; }
</style>
</head>
<body>
<h1>📊 Clone Report</h1>
<div class="meta">
  Source: <a href="${pageMap.pages[0]?.url || '#'}" target="_blank">${pageMap.pages[0]?.url || 'Unknown'}</a><br>
  Generated: ${new Date().toISOString().split('T')[0]}
</div>

<div class="summary">
  <div class="card"><div class="num">${totalPages}</div><div class="label">Pages discovered</div></div>
  <div class="card"><div class="num">${totalSF}</div><div class="label">SingleFile ✅</div></div>
  <div class="card"><div class="num">${totalPP}</div><div class="label">Puppeteer ✅</div></div>
  <div class="card"><div class="num">${totalOut}</div><div class="label">Final built</div></div>
  <div class="card ${totalYT > totalThumbs ? 'warn' : ''}"><div class="num">${totalYT}</div><div class="label">YouTube embeds</div></div>
  <div class="card"><div class="num">${totalVimeo}</div><div class="label">Vimeo embeds</div></div>
  <div class="card"><div class="num">${totalGDrive}</div><div class="label">GDrive embeds</div></div>
  <div class="card ${totalThumbs < totalYT ? 'err' : ''}"><div class="num">${totalThumbs}/${totalYT}</div><div class="label">Thumbnails ✅</div></div>
  <div class="card"><div class="num">${(dirSize(siteDir) / 1024 / 1024).toFixed(1)}</div><div class="label">Total site MB</div></div>
</div>

<table>
<thead>
<tr>
  <th>#</th>
  <th>Page</th>
  <th>Depth</th>
  <th>SingleFile</th>
  <th>Img (b64)</th>
  <th>Puppeteer</th>
  <th>Embeds</th>
  <th>YouTube</th>
  <th>Vimeo</th>
  <th>GDrive</th>
  <th>Thumbs</th>
  <th>Final</th>
  <th>View</th>
</tr>
</thead>
<tbody>
${rows.join('\n')}
</tbody>
</table>

<div class="legend">
  SF = SingleFile HTML · PP = Puppeteer content · Embeds = total embedded videos/files<br>
  YouTube/Vimeo/GDrive = iframe sources found in PP · Thumbs = downloaded thumbnails
</div>
</body>
</html>`;

  const reportPath = path.join(dir, 'report.html');
  fs.writeFileSync(reportPath, html);
  // Also write to site/ for iframe navigation
  if (fs.existsSync(siteDir)) {
    fs.writeFileSync(path.join(siteDir, 'report.html'), html);
  }
  console.log(`📊 Report: ${reportPath}`);
  return reportPath;
}

if (require.main === module) {
  const dir = process.argv[2] || './test-clone';
  generateReport(dir);
}

module.exports = { generateReport };
