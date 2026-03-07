// Generate report.html — site map + comparison of SingleFile vs Puppeteer
const fs = require('fs');
const path = require('path');

function generateReport(dir) {
    const pageMap = JSON.parse(fs.readFileSync(path.join(dir, 'page-map.json'), 'utf8'));
    const pagesDir = path.join(dir, '_pages');
    const contentDir = path.join(dir, '_content');
    const siteDir = path.join(dir, 'site');

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

        // Count YouTube iframes in Puppeteer
        const ppContent = ppExists ? fs.readFileSync(ppPath, 'utf8') : '';
        const ytCount = (ppContent.match(/youtube/gi) || []).length;
        const iframeCount = (ppContent.match(/data-iframe-src/gi) || []).length;

        const sfIcon = sfExists ? (sfSize > 1 ? '✅' : '⚠️') : '❌';
        const ppIcon = ppExists ? (ppSize > 0 ? '✅' : '⚠️') : '❌';
        const indent = p.depth ? `padding-left:${20 + p.depth * 20}px` : '';

        return `<tr>
  <td>${i + 1}</td>
  <td style="${indent}">${p.title}</td>
  <td>${p.depth || 0}</td>
  <td>${sfIcon} ${sfSize} KB</td>
  <td>${b64Count}</td>
  <td>${ppIcon} ${ppSize} KB</td>
  <td>${iframeCount}</td>
  <td>${outSize} KB</td>
  <td>
    ${sfExists ? `<a href="_pages/${p.file}" target="_blank">SF</a>` : '—'}
    ${ppExists ? ` · <a href="_content/${p.file}" target="_blank">PP</a>` : ''}
    ${outExists ? ` · <a href="site/${p.file}" target="_blank">Final</a>` : ''}
  </td>
</tr>`;
    });

    const totalSF = pageMap.pages.filter(p => fs.existsSync(path.join(pagesDir, p.file))).length;
    const totalPP = pageMap.pages.filter(p => fs.existsSync(path.join(contentDir, p.file))).length;
    const totalOut = pageMap.pages.filter(p => fs.existsSync(path.join(siteDir, p.file))).length;

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
  .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .card { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); min-width: 140px; }
  .card .num { font-size: 28px; font-weight: 700; color: #1a73e8; }
  .card .label { font-size: 12px; color: #666; margin-top: 4px; }
  table { width: 100%; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1); border-collapse: collapse; }
  th { background: #1a73e8; color: #fff; padding: 10px 12px; font-size: 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
  tr:hover td { background: #f8f9fe; }
  a { color: #1a73e8; text-decoration: none; }
  a:hover { text-decoration: underline; }
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
  <div class="card"><div class="num">${pageMap.pages.length}</div><div class="label">Pages discovered</div></div>
  <div class="card"><div class="num">${totalSF}</div><div class="label">SingleFile ✅</div></div>
  <div class="card"><div class="num">${totalPP}</div><div class="label">Puppeteer ✅</div></div>
  <div class="card"><div class="num">${totalOut}</div><div class="label">Final built</div></div>
</div>

<table>
<thead>
<tr>
  <th>#</th>
  <th>Page</th>
  <th>Depth</th>
  <th>SingleFile</th>
  <th>Images (b64)</th>
  <th>Puppeteer</th>
  <th>Iframes</th>
  <th>Final</th>
  <th>View</th>
</tr>
</thead>
<tbody>
${rows.join('\n')}
</tbody>
</table>

<div class="legend">
  SF = SingleFile HTML (CSS + base64 images) · PP = Puppeteer content (clean text + iframe data) · Final = Merged output
</div>
</body>
</html>`;

    const reportPath = path.join(dir, 'report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`📊 Report: ${reportPath}`);
    return reportPath;
}

// Run directly
if (require.main === module) {
    const dir = process.argv[2] || './test-clone';
    generateReport(dir);
}

module.exports = { generateReport };
