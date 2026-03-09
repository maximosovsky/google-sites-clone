# 📖 google-sites-clone — User Manual

---

## Prerequisites

- **Node.js** 18+
- **SingleFile CLI** — [github.com/gildas-lormeau/single-file-cli](https://github.com/gildas-lormeau/single-file-cli)
- **Chromium** — installed automatically with Puppeteer

---

## Quick Start

```bash
npx google-sites-clone https://sites.google.com/view/your-site
```

Output: `./clone/site/` — open `index.html` in a browser.

---

## CLI Options

```bash
gsclone <url> [options]

Options:
  -o, --output <dir>   Output directory (default: ./clone)
  --no-images          Skip image localization (keep base64)
  --no-youtube         Skip YouTube/Vimeo thumbnail download
  --serve              Start local server (port 3456) after build
  --custom-nav         Use custom sidebar navigation
  --inline             Keep images inline (base64) instead of separate files
  --zip                Create ZIP archive of site/ after build
  -V, --version        Show version
  -h, --help           Show help
```

### Deploy to GitHub Pages

```bash
gsclone deploy ./clone/site --repo username/my-clone
```

Pushes `site/` to the `gh-pages` branch. Enable GitHub Pages in repo Settings → Pages → Branch: `gh-pages`.

---

## Output Structure

```
./clone/
├── page-map.json              ← discovered pages + hierarchy
├── _pages/                    ← SingleFile snapshots (CSS + base64 images)
├── _content/                  ← Puppeteer snapshots (clean text + iframes)
└── site/                      ← final static site
    ├── index.html             ← sidebar navigation + iframe
    ├── report.html            ← clone quality report
    ├── page-name.html         ← content pages (loaded in iframe)
    ├── images/                ← localized images
    ├── thumbnails/            ← YouTube/Vimeo thumbnails
    ├── sitemap.xml
    └── robots.txt
```

---

## Pipeline Steps

| Step | What happens |
|------|-------------|
| 1. Crawl | Opens the site, parses sidebar → `page-map.json` |
| 2. SingleFile | Full visual snapshot of each page → `_pages/` |
| 3. Puppeteer | Clean content + iframe sources → `_content/` |
| 4. Images | Base64 images → local files in `site/images/` |
| 4b. Video | YouTube/Vimeo thumbnails → `site/thumbnails/` |
| 5. Build | Sidebar nav + iframe + video grid → `site/` |
| 6. Report | Quality dashboard → `report.html` |

---

## Rebuild from Cache

After the first clone, you can rebuild without re-downloading:

```bash
node rebuild.js ./clone
```

This skips crawl/SingleFile/Puppeteer and re-runs video scan + build + report.

---

## Video Grid

Pages with embedded YouTube/Vimeo/Google Drive content get a thumbnail grid injected at the top. The grid uses inline CSS (`all:initial`) to avoid conflicts with the original page styles.

- **YouTube/Vimeo** — clickable thumbnail with play button (or text fallback)
- **Google Drive** — text link to file

---

## Report

`report.html` shows per-page comparison:

| Column | Meaning |
|--------|---------|
| SingleFile | Full visual snapshot (CSS + images) |
| Puppeteer | Clean content extraction |
| Embeds | Total embedded videos/files |
| YouTube/Vimeo/GDrive | Breakdown by type |
| Thumbs | Downloaded thumbnails count |
| Total site MB | Full site directory size |

Video chips are clickable (link to original) and color-coded:
- 🟢 Green — thumbnail downloaded
- 🔴 Red — thumbnail missing

---

## Web UI (gsclone.osovsky.com)

The landing page provides a browser-based interface for cloning:

### Authentication

Click the Google or GitHub icon in the header to sign in. Your email is pre-filled in the clone form after login.

| Provider | What you get |
|----------|--------------|
| Google | Name, email, avatar from Google account |
| GitHub | Username, email, avatar from GitHub profile |

Session is stored as an `HttpOnly` cookie (30 days). Click your avatar → **Sign Out** to log out.

### Cloning via Web UI

1. Paste a Google Sites URL
2. (Optional) Enter email for download link
3. Click **Clone**
4. Pipeline runs on GitHub Actions
5. When ready: ZIP + report uploaded to Cloudflare R2
6. Email sent with download links (if email provided)

### Download Links

- **ZIP** — download link valid for 1 hour (presigned), file stored for **7 days**
- **Report** — viewable in browser, stored for **360 days**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `SingleFile not found` | Install: `npm i -g single-file-cli` |
| Pages show empty content | Google Sites SPA needs JavaScript — Puppeteer handles this |
| Thumbnails fail to download | Network issue — re-run `node rebuild.js` (skips existing) |
| Large output (>100 MB) | SingleFile snapshots include base64 images — use `--no-images` to skip |
| OAuth redirect fails | Check callback URLs in Google/GitHub console match exactly |
| Email not received | Check spam folder; verify `RESEND_API_KEY` in Vercel env vars |
| Download link expired | ZIP links expire after 7 days — re-clone to get new link |

---

## License

[Maxim Osovsky](https://www.linkedin.com/in/osovsky/). Licensed under MIT.
