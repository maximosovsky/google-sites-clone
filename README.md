<div align="center">

# 🌐 Google Sites Clone

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-22-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)
![npm](https://img.shields.io/npm/v/google-sites-clone?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

**Clone any Google Sites page to static HTML — own your content forever**

[Quick Start](#-quick-start) · [Features](#-features) · [How It Works](#-how-it-works) · [Tech Stack](#-tech-stack) · [Roadmap](ROADMAP.md)

</div>

> *No more vendor lock-in. Your Google Sites content belongs to you. Paste a URL, get a complete static clone with all images, styles, and navigation — ready for self-hosting.*

---

## 💡 Concept

Google Sites stores your content behind an SPA that search engines can't index and you can't export. **google-sites-clone** uses a two-pass pipeline (SingleFile + Puppeteer) to capture everything — CSS fidelity from SingleFile and clean semantic content from Puppeteer — then merges both into standalone HTML files with localized images and SEO metadata.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 Auto-crawl | Discovers all pages from sidebar navigation automatically |
| 🎨 Two-pass pipeline | SingleFile for CSS/images + Puppeteer for clean content |
| 🖼️ Image localization | Downloads all images as local files (no CDN dependency) |
| 📺 YouTube thumbnails | Converts embedded iframes to clickable thumbnails |
| 🎬 Video grid | Injects CSS Grid of video thumbnails into SingleFile pages |
| 🗺️ SEO ready | Generates `sitemap.xml` + `robots.txt` |
| ⚡ Batch processing | 5 pages per batch with anti-rate-limit pauses |
| 🔄 SPA fallback | Internal navigation for pages that fail direct URL loading |
| 🚀 GitHub Pages deploy | One command to push to gh-pages branch |
| 📦 ZIP export | Create downloadable archive of cloned site |

---

## 🚀 Quick Start

```bash
npx google-sites-clone https://sites.google.com/view/your-site
```

<details>
<summary>📋 Manual setup</summary>

```bash
git clone https://github.com/maximosovsky/google-sites-clone
cd google-sites-clone
npm install
node bin/gsclone.js https://sites.google.com/view/your-site
```

</details>

<details>
<summary>⚙️ CLI Options</summary>

```bash
gsclone <url> [options]

Options:
  -o, --output <dir>   Output directory (default: ./clone)
  --no-images          Skip image localization
  --no-youtube         Skip YouTube thumbnail download
  --serve              Start local server after build
  --custom-nav         Use custom sidebar navigation
  --inline             Keep images inline (base64)
  --zip                Create ZIP archive of site after build
```

</details>

<details>
<summary>🚀 Deploy to GitHub Pages</summary>

```bash
gsclone deploy ./clone/site --repo username/my-clone
```

Pushes `site/` to the `gh-pages` branch. Enable Pages in repo Settings → Pages → Branch: `gh-pages`.

</details>

---

## 💡 How It Works

```
URL → [1. Crawl]      → page-map.json (all pages + structure)
    → [2. SingleFile]  → _pages/ CSS + base64 images (visual fidelity)
    → [3. Puppeteer]   → _content/ Clean content + iframe sources
    → [4. Images]      → site/images/ base64 → local files
    → [4b. Video]      → site/thumbnails/ YouTube/Vimeo thumbs
    → [5. Build]       → site/ iframe nav + pages + video grid + report
```

| Pass | Tool | Captures |
|------|------|----------|
| 1 | Puppeteer | Navigation structure → `page-map.json` |
| 2 | SingleFile CLI | CSS, base64 images, layout → `_pages/` |
| 3 | Puppeteer (batch ×5) | Clean text, links, iframe srcs → `_content/` |
| 4 | Base64 decoder | Images from SingleFile → `site/images/` |
| 4b | Video scanner | YouTube/Vimeo thumbnails → `site/thumbnails/` |
| 5 | Build script | iframe nav + video grid + report + sitemap → `site/` |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Content extraction | Puppeteer |
| CSS preservation | SingleFile CLI |
| CLI interface | Commander.js |

```
google-sites-clone/
├── bin/
│   └── gsclone.js          # CLI entry point
├── lib/
│   ├── index.js            # Pipeline orchestrator
│   ├── crawl.js            # Auto-crawl navigation
│   ├── singlefile.js       # SingleFile pass
│   ├── puppeteer.js        # Puppeteer batch extraction
│   ├── images.js           # Base64 → local images
│   ├── video.js            # YouTube/Vimeo thumbnail download
│   ├── build.js            # iframe nav + page assembly
│   ├── report.js           # Clone report dashboard
│   ├── deploy.js           # GitHub Pages deploy
│   └── zip.js              # ZIP archive creation
├── rebuild.js              # Quick rebuild from cache
├── site/
│   └── index.html          # Landing page
├── ARCHITECTURE.md
├── MANUAL.md
├── ROADMAP.md
└── package.json
```

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for full details.

- [x] Core pipeline (SingleFile + Puppeteer)
- [x] CLI interface
- [x] Auto-crawl navigation
- [x] Image localization
- [x] iframe-based navigation (sidebar + content)
- [x] Clone report dashboard
- [x] YouTube/Vimeo thumbnail download
- [x] Video grid (YT/Vimeo/GDrive)
- [x] GitHub Pages deploy
- [x] ZIP export
- [x] npm publish
- [x] Rate limits (max pages, cooldown)
- [x] Email delivery (Resend)
- [x] Cloudflare R2 storage
- [x] Real Google OAuth
- [x] Real GitHub OAuth

---

## 🔀 Alternatives

| Tool | Approach | Google Sites (new) |
|------|----------|--------------------|
| [HTTrack](https://github.com/xroche/httrack) | Recursive wget-style crawl | ❌ Can't execute JavaScript — downloads empty SPA shell |
| [google-sites-backup](https://github.com/famzah/google-sites-backup) | Google Sites API (GData) | ❌ Classic Sites only, API deprecated |
| [generate-static-site](https://github.com/lichtquelle/generate-static-site) | Headless SSR pre-render | ⚠️ Generic tool, no auto-crawl or Google Sites awareness |
| **google-sites-clone** | Puppeteer + SingleFile | ✅ Full SPA rendering, auto-crawl, CSS fidelity, image localization |

> New Google Sites (2020+) is a single-page application — all content is rendered by JavaScript. Traditional crawlers see an empty page. That's why this project uses a headless browser.

---

## 🤝 Contributing

Fork → `feature/name` → PR

---

## 📄 License

[Maxim Osovsky](https://www.linkedin.com/in/osovsky/). Licensed under MIT.
