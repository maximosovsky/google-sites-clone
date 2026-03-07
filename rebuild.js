// Quick rebuild from cached data — runs only Step 5 (build)
const { build } = require('./lib/build');
const path = require('path');
const dir = process.argv[2] || './test-clone';

const pageMap = require(path.resolve(dir, 'page-map.json'));
const pagesDir = path.join(dir, '_pages');
const contentDir = path.join(dir, '_content');
const siteDir = path.join(dir, 'site');

console.log('🔄 Rebuilding from cached data...');
console.log(`📁 Source: ${dir}`);
console.log(`📄 Pages: ${pageMap.pages.length}\n`);

build({ pagesDir, contentDir, siteDir, pageMap, nav: 'custom', youtube: true })
    .then(() => console.log('\n✅ Rebuild complete: ' + path.resolve(siteDir)));
