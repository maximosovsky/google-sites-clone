// Quick rebuild from cached data — runs video scan + build + report
const { build } = require('./lib/build');
const { processVideos } = require('./lib/video');
const { generateReport } = require('./lib/report');
const path = require('path');
const dir = process.argv[2] || './test-clone';

const pageMap = require(path.resolve(dir, 'page-map.json'));
const pagesDir = path.join(dir, '_pages');
const contentDir = path.join(dir, '_content');
const siteDir = path.join(dir, 'site');

console.log('🔄 Rebuilding from cached data...');
console.log(`📁 Source: ${dir}`);
console.log(`📄 Pages: ${pageMap.pages.length}\n`);

async function run() {
    console.log('=== Step 4b: Video thumbnails ===');
    await processVideos(contentDir, siteDir);

    console.log('\n=== Step 5: Build ===');
    await build({ pagesDir, contentDir, siteDir, pageMap, nav: 'custom', youtube: true });

    console.log('\n=== Step 6: Report ===');
    generateReport(dir);

    console.log('\n✅ Rebuild complete: ' + path.resolve(siteDir));
}

run();
