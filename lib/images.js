// Step 4: Extract base64 images from SingleFile → local files
// Maps CDN URLs in Puppeteer content to local image paths
const fs = require('fs');
const path = require('path');

async function localizeImages(pagesDir, contentDir, siteDir) {
    const imgDir = path.join(siteDir, 'images');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    const contentFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));
    let imgCount = 0, totalReplaced = 0;

    for (const file of contentFiles) {
        const contentPath = path.join(contentDir, file);
        const sfPath = path.join(pagesDir, file);
        if (!fs.existsSync(sfPath)) continue;

        let contentHtml = fs.readFileSync(contentPath, 'utf8');
        const sfHtml = fs.readFileSync(sfPath, 'utf8');

        // CDN URLs in Puppeteer content
        const cdnUrls = [];
        const cdnRegex = /src="(https:\/\/lh[0-9]*\.googleusercontent\.com\/[^"]+)"/g;
        let m;
        while ((m = cdnRegex.exec(contentHtml)) !== null) cdnUrls.push(m[1]);

        // Base64 images in SingleFile
        const b64Regex = /src="(data:image\/([a-z+]+);base64,([^"]+))"/g;
        const b64Images = [];
        while ((m = b64Regex.exec(sfHtml)) !== null) {
            b64Images.push({ type: m[2], data: m[3] });
        }

        if (cdnUrls.length === 0 || b64Images.length === 0) continue;

        // Match by position and replace
        let changed = false;
        const matchCount = Math.min(cdnUrls.length, b64Images.length);
        for (let i = 0; i < matchCount; i++) {
            const b64 = b64Images[i];
            const buffer = Buffer.from(b64.data, 'base64');
            if (buffer.length < 200) continue;

            imgCount++;
            const ext = b64.type === 'png' ? '.png' : b64.type === 'webp' ? '.webp' : '.jpg';
            const filename = `img${String(imgCount).padStart(4, '0')}${ext}`;
            fs.writeFileSync(path.join(imgDir, filename), buffer);

            contentHtml = contentHtml.split(cdnUrls[i]).join(`images/${filename}`);
            changed = true;
            totalReplaced++;
        }

        if (changed) fs.writeFileSync(contentPath, contentHtml, 'utf8');
        if (matchCount > 0) {
            console.log(`  ${file}: ${matchCount} images (${cdnUrls.length} CDN, ${b64Images.length} b64)`);
        }
    }

    console.log(`\nTotal: ${imgCount} images saved, ${totalReplaced} URLs replaced.`);
}

module.exports = { localizeImages };
