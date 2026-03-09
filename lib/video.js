// Step 4b: Video — scan _content/ for YouTube/Vimeo embeds, download thumbnails
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Download a file from URL, returns true if successful
 */
function downloadFile(url, dest) {
    return new Promise((resolve) => {
        const proto = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        proto.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(true); });
            } else {
                file.close();
                try { fs.unlinkSync(dest); } catch { }
                resolve(false);
            }
        }).on('error', () => {
            file.close();
            try { fs.unlinkSync(dest); } catch { }
            resolve(false);
        });
    });
}

/**
 * Scan _content/ HTML files for video embeds, download thumbnails
 * @param {string} contentDir - path to _content/
 * @param {string} siteDir - path to site/ (thumbnails saved here)
 * @returns {object} videoMap - { youtube: [{id, file, label, thumbFile}], vimeo: [...], gdrive: [...] }
 */
async function processVideos(contentDir, siteDir) {
    const thumbDir = path.join(siteDir, 'thumbnails');
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    const videoMap = { youtube: [], vimeo: [], gdrive: [] };
    const seenYT = new Set();
    const seenVimeo = new Set();

    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));

    for (const file of files) {
        const html = fs.readFileSync(path.join(contentDir, file), 'utf8');

        // YouTube: data-iframe-src="https://www.youtube.com/embed/VIDEO_ID?..."
        const ytRegex = /data-iframe-src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})\?[^"]*"(?:\s+data-iframe-label="([^"]*)")?/g;
        let m;
        while ((m = ytRegex.exec(html)) !== null) {
            const id = m[1];
            const label = m[2] || '';
            if (!seenYT.has(id)) {
                seenYT.add(id);
                videoMap.youtube.push({ id, file, label, thumbFile: null });
            }
        }

        // Vimeo pattern 1: data-iframe-src="https://player.vimeo.com/video/DIGITS..."
        const vimeoRegex1 = /data-iframe-src="https?:\/\/player\.vimeo\.com\/video\/(\d+)[^"]*"(?:\s+data-iframe-label="([^"]*)")?/g;
        while ((m = vimeoRegex1.exec(html)) !== null) {
            const id = m[1];
            const label = m[2] || '';
            if (!seenVimeo.has(id)) {
                seenVimeo.add(id);
                videoMap.vimeo.push({ id, file, label, thumbFile: null });
            }
        }

        // Vimeo pattern 2: URL-encoded in data-url via Google redirect
        // data-url="https://www.google.com/url?q=https%3A%2F%2Fplayer.vimeo.com%2Fvideo%2FDIGITS..."
        const vimeoRegex2 = /player\.vimeo\.com%2Fvideo%2F(\d+)/g;
        while ((m = vimeoRegex2.exec(html)) !== null) {
            const id = m[1];
            if (!seenVimeo.has(id)) {
                seenVimeo.add(id);
                videoMap.vimeo.push({ id, file, label: '', thumbFile: null });
            }
        }

        // Vimeo pattern 3: plain href links href="https://vimeo.com/DIGITS"
        const vimeoRegex3 = /href="https?:\/\/vimeo\.com\/(\d+)"/g;
        while ((m = vimeoRegex3.exec(html)) !== null) {
            const id = m[1];
            if (!seenVimeo.has(id)) {
                seenVimeo.add(id);
                videoMap.vimeo.push({ id, file, label: '', thumbFile: null });
            }
        }

        // Google Drive: data-iframe-src="https://drive.google.com/file/d/FILE_ID/..."
        const gdriveRegex = /data-iframe-src="https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)[^"]*"/g;
        while ((m = gdriveRegex.exec(html)) !== null) {
            videoMap.gdrive.push({ id: m[1], file, label: '', thumbFile: null });
        }
    }

    // Download YouTube thumbnails
    let ytOk = 0, ytFail = 0;
    for (const v of videoMap.youtube) {
        const dest = path.join(thumbDir, `yt-${v.id}.jpg`);

        // Skip if already downloaded
        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            v.thumbFile = `yt-${v.id}.jpg`;
            ytOk++;
            continue;
        }

        // Try maxresdefault (1280x720) first
        const maxres = `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
        let ok = await downloadFile(maxres, dest);

        if (!ok || (fs.existsSync(dest) && fs.statSync(dest).size < 1000)) {
            // Fallback to hqdefault (480x360)
            try { fs.unlinkSync(dest); } catch { }
            const hq = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
            ok = await downloadFile(hq, dest);
        }

        if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            v.thumbFile = `yt-${v.id}.jpg`;
            ytOk++;
            const kb = Math.round(fs.statSync(dest).size / 1024);
            console.log(`  yt-${v.id}.jpg: ${kb} KB ✅`);
        } else {
            ytFail++;
            try { fs.unlinkSync(dest); } catch { }
            console.log(`  yt-${v.id}: ❌ failed`);
        }
    }

    // Download Vimeo thumbnails
    let vmOk = 0, vmFail = 0;
    for (const v of videoMap.vimeo) {
        const dest = path.join(thumbDir, `vm-${v.id}.jpg`);

        if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            v.thumbFile = `vm-${v.id}.jpg`;
            vmOk++;
            continue;
        }

        const url = `https://vumbnail.com/${v.id}.jpg`;
        const ok = await downloadFile(url, dest);

        if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
            v.thumbFile = `vm-${v.id}.jpg`;
            vmOk++;
            const kb = Math.round(fs.statSync(dest).size / 1024);
            console.log(`  vm-${v.id}.jpg: ${kb} KB ✅`);
        } else {
            vmFail++;
            try { fs.unlinkSync(dest); } catch { }
            console.log(`  vm-${v.id}: ❌ failed`);
        }
    }

    console.log(`\nVideo scan: ${videoMap.youtube.length} YT (${ytOk}✅ ${ytFail}❌), ${videoMap.vimeo.length} Vimeo (${vmOk}✅ ${vmFail}❌), ${videoMap.gdrive.length} GDrive (skip)`);
    return videoMap;
}

// Standalone mode
if (require.main === module) {
    const dir = process.argv[2] || './test-clone';
    const contentDir = path.join(dir, '_content');
    const siteDir = path.join(dir, 'site');
    console.log('📺 Scanning for video embeds...');
    console.log(`📁 Content: ${contentDir}\n`);
    processVideos(contentDir, siteDir).then(map => {
        console.log(`\n📊 Total unique: ${map.youtube.length} YT, ${map.vimeo.length} Vimeo, ${map.gdrive.length} GDrive`);
    });
}

module.exports = { processVideos };
