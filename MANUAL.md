# 📖 google-sites-clone — User Manual

[![npm](https://img.shields.io/npm/v/google-sites-clone?logo=npm)](https://www.npmjs.com/package/google-sites-clone)
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

| Step | What happens | Size |
|------|-------------|------|
| 1. Crawl | Opens the site, parses sidebar → `page-map.json` | ~2 KB |
| 2. SingleFile | Full visual snapshot of each page → `_pages/` | ~7 MB/page |
| 3. Puppeteer | Clean content + iframe sources → `_content/` | ~9 KB/page |
| 4. Images | Base64 images → local files in `site/images/` | varies |
| 4b. Video | YouTube/Vimeo thumbnails → `site/thumbnails/` | ~50 KB each |
| 5. Build | Sidebar nav + iframe + video grid → `site/` | — |
| 6. Report | Quality dashboard → `report.html` | ~50 KB |
| 7. ZIP | Archive `site/` → `clone-result.zip` | up to 250 MB |
| 8. R2 Upload | Direct upload via `aws s3 cp` | — |
| 9. Email | "Clone ready!" + download links | — |

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
4. Immediate: site preview card + "⏳ Cloning started" email (with og:image)
5. Pipeline runs on GitHub Actions (~5 min)
6. ZIP + report uploaded **directly to Cloudflare R2** (max 250 MB)
7. "🎉 Clone ready!" email with download links

### Usage Tiers

| Tier | Auth | Clones | Max ZIP |
|------|------|--------|---------|
| **Free** | Google | 1 total | 250 MB |
| **Starred** | Google + GitHub + ⭐ star the repo | 5/day, 20/month | 250 MB (~5 GB/month) |
| **Unlimited** | By request | ∞ | ∞ |

- First clone is free with Google sign-in only
- For more clones: sign in with GitHub and star [google-sites-clone](https://github.com/maximosovsky/google-sites-clone)
- Unlimited tier is available by request for heavy users

### Download Links

- **ZIP** — presigned URL (1h), file auto-deleted after **7 days**
- **Report** — presigned URL, auto-deleted after **360 days**
- **Preview image** — og:image proxied through R2 (auto-deleted after 7 days)

> R2 lifecycle rules handle cleanup automatically — no manual deletion needed.

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
