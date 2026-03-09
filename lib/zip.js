// Create ZIP archive of a directory
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Create a ZIP of the site directory using tar (available on Windows 10+)
 */
function createZip(srcDir, destZip) {
    srcDir = path.resolve(srcDir);
    destZip = path.resolve(destZip);

    if (!fs.existsSync(srcDir)) {
        throw new Error(`Directory not found: ${srcDir}`);
    }

    // Remove existing zip
    if (fs.existsSync(destZip)) fs.unlinkSync(destZip);

    // Use PowerShell Compress-Archive (Windows) or zip (Unix)
    const isWin = process.platform === 'win32';
    if (isWin) {
        execSync(`powershell -Command "Compress-Archive -Path '${srcDir}\\*' -DestinationPath '${destZip}'"`, { stdio: 'pipe' });
    } else {
        const parent = path.dirname(srcDir);
        const folder = path.basename(srcDir);
        execSync(`cd "${parent}" && zip -r "${destZip}" "${folder}"`, { stdio: 'pipe' });
    }

    const sizeMB = (fs.statSync(destZip).size / 1024 / 1024).toFixed(1);
    console.log(`📦 Created ${path.basename(destZip)}: ${sizeMB} MB`);
}

module.exports = { createZip };
