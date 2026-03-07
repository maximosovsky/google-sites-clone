// Main entry point — orchestrates the full pipeline
const path = require('path');
const { crawl } = require('./crawl');
const { extractWithSingleFile } = require('./singlefile');
const { extractWithPuppeteer } = require('./puppeteer');
const { localizeImages } = require('./images');
const { build } = require('./build');

async function clone(url, options = {}) {
    const outDir = path.resolve(options.output || './clone');
    const pagesDir = path.join(outDir, '_pages');    // SingleFile output
    const contentDir = path.join(outDir, '_content'); // Puppeteer output
    const siteDir = path.join(outDir, 'site');        // Final build

    console.log(`📋 Target: ${url}`);
    console.log(`📁 Output: ${outDir}\n`);

    // Step 1: Crawl navigation → page-map.json
    console.log('=== Step 1: Crawl navigation ===');
    const pageMap = await crawl(url, outDir);
    console.log(`Found ${pageMap.pages.length} pages.\n`);

    // Step 2: SingleFile pass → CSS + base64 images
    console.log('=== Step 2: SingleFile pass ===');
    await extractWithSingleFile(pageMap, pagesDir);

    // Step 3: Puppeteer pass → clean content
    console.log('\n=== Step 3: Puppeteer pass ===');
    await extractWithPuppeteer(pageMap, contentDir);

    // Step 4: Localize images (base64 → files)
    if (options.images !== false && !options.inline) {
        console.log('\n=== Step 4: Localize images ===');
        await localizeImages(pagesDir, contentDir, siteDir);
    }

    // Step 5: Build final site
    console.log('\n=== Step 5: Build ===');
    await build({
        pagesDir,
        contentDir,
        siteDir,
        pageMap,
        nav: options.nav,
        youtube: options.youtube !== false,
    });

    console.log(`\n✅ Clone complete: ${siteDir}`);

    if (options.serve) {
        console.log('\n🌐 Starting server...');
        require('child_process').execSync(`npx -y serve ${siteDir} -l 3456`, { stdio: 'inherit' });
    }

    return siteDir;
}

module.exports = { clone };
