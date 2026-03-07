// Step 3: Puppeteer batch extraction — clean content + iframe srcs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BATCH = 5;
const BATCH_PAUSE = 60000;

async function extractWithPuppeteer(pageMap, outDir) {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const batches = [];
    for (let i = 0; i < pageMap.pages.length; i += BATCH) {
        batches.push(pageMap.pages.slice(i, i + BATCH));
    }
    console.log(`Extracting ${pageMap.pages.length} pages in ${batches.length} batches`);

    let total = 0;
    for (let b = 0; b < batches.length; b++) {
        if (b > 0) {
            console.log(`  Pause ${BATCH_PAUSE / 1000}s...`);
            await new Promise(r => setTimeout(r, BATCH_PAUSE));
        }
        console.log(`\n--- Batch ${b + 1}/${batches.length} ---`);

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });

        for (const p of batches[b]) {
            total++;
            console.log(`  [${total}/${pageMap.pages.length}] ${p.file}`);
            const content = await extractPage(browser, p.url);
            const kb = Math.round(content.length / 1024);
            console.log(`    ${kb} KB ${kb < 2 ? '⚠️' : '✅'}`);
            fs.writeFileSync(path.join(outDir, p.file), content, 'utf8');
            await new Promise(r => setTimeout(r, 5000));
        }

        await browser.close();
    }
}

async function extractPage(browser, url) {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
        try { await page.waitForSelector('section.yaqOZd', { timeout: 15000 }); } catch (e) { }
        await new Promise(r => setTimeout(r, 8000));

        // Scroll to trigger lazy loading
        await page.evaluate(async () => {
            for (let i = 0; i < 40; i++) {
                window.scrollBy(0, 400);
                await new Promise(r => setTimeout(r, 300));
            }
            window.scrollTo(0, 0);
        });
        await new Promise(r => setTimeout(r, 3000));

        return await page.evaluate(() => {
            const sections = document.querySelectorAll('section.yaqOZd');
            let html = '';
            for (const s of sections) {
                s.querySelectorAll('iframe').forEach(iframe => {
                    const div = document.createElement('div');
                    div.setAttribute('data-iframe-src', iframe.src || '');
                    div.setAttribute('data-iframe-label', iframe.getAttribute('aria-label') || '');
                    div.className = 'iframe-placeholder';
                    iframe.replaceWith(div);
                });
                html += s.outerHTML + '\n';
            }
            return html;
        });
    } catch (e) {
        console.log(`    Error: ${e.message}`);
        return '';
    } finally {
        await page.close();
    }
}

module.exports = { extractWithPuppeteer };
