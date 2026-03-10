// Step 1: Auto-crawl Google Sites navigation
// Opens the main page, parses sidebar links, discovers all pages
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawl(url, outDir) {
    console.log(`Crawling: ${url}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    // Extract navigation structure from sidebar
    const navData = await page.evaluate(() => {
        const pages = [];
        const seen = new Set();

        // Google Sites navigation links
        const navLinks = document.querySelectorAll('li[role="treeitem"] a, nav a, [data-nav] a');

        for (const a of navLinks) {
            const href = a.href;
            const title = a.textContent.trim();
            if (!href || !title || seen.has(href)) continue;
            if (!href.includes('sites.google.com')) continue;
            seen.add(href);

            // Determine nesting level
            const depth = (a.closest('[role="group"]') ? 1 : 0) +
                (a.closest('[role="group"] [role="group"]') ? 1 : 0);

            pages.push({ title, url: href, depth });
        }

        // Always include current page (home)
        const homeUrl = window.location.href;
        if (!seen.has(homeUrl)) {
            pages.unshift({ title: document.title, url: homeUrl, depth: 0 });
        }

        return pages;
    });

    await browser.close();

    // Generate file names from titles
    const pageMap = {
        siteUrl: url,
        crawledAt: new Date().toISOString(),
        pages: navData.map(p => ({
            ...p,
            file: slugify(p.title) + '.html',
        })),
    };

    // Ensure home page is index.html
    if (pageMap.pages.length > 0) {
        pageMap.pages[0].file = 'index.html';
    }

    // Save page-map.json
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const mapPath = path.join(outDir, 'page-map.json');
    fs.writeFileSync(mapPath, JSON.stringify(pageMap, null, 2));
    console.log(`Saved: ${mapPath}`);

    return pageMap;
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[а-яё]/gi, c => {
            const map = 'аaбbвvгgдdеeёeжzhзzиiйyкkлlмmнnоoпpрrсsтtуuфfхhцtsчchшshщshъыyьэeюyuяya';
            const i = map.indexOf(c.toLowerCase());
            return i >= 0 ? map[i + 1] || c : c;
        })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
}

module.exports = { crawl };
