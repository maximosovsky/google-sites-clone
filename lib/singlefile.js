// Step 2: SingleFile pass — saves pages with CSS + base64 images
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function extractWithSingleFile(pageMap, outDir) {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // Check SingleFile CLI
    try {
        execSync('single-file --help', { stdio: 'ignore' });
    } catch (e) {
        console.log('Installing single-file-cli...');
        execSync('npm install -g single-file-cli', { stdio: 'inherit' });
    }

    let ok = 0, fail = 0;
    for (let i = 0; i < pageMap.pages.length; i++) {
        const p = pageMap.pages[i];
        const outFile = path.join(outDir, p.file);

        if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1024) {
            console.log(`  [${i + 1}/${pageMap.pages.length}] SKIP: ${p.file} (exists)`);
            ok++;
            continue;
        }

        console.log(`  [${i + 1}/${pageMap.pages.length}] ${p.file}`);
        try {
            const args = [`single-file "${p.url}" "${outFile}"`];
            if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                args[0] += ` --browser-executable-path="${process.env.PUPPETEER_EXECUTABLE_PATH}"`;
            }
            execSync(
                args[0],
                { stdio: 'pipe', timeout: 120000 }
            );
            const size = fs.existsSync(outFile) ? fs.statSync(outFile).size : 0;
            console.log(`    ${Math.round(size / 1024)} KB ✅`);
            ok++;
        } catch (e) {
            console.log(`    ❌ ${e.message.substring(0, 80)}`);
            fail++;
        }

        // Pause between pages
        await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`\nSingleFile: ${ok} OK, ${fail} failed.`);
}

module.exports = { extractWithSingleFile };
