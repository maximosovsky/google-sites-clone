<div align="center">

# Google Sites Clone

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Google Sites](https://img.shields.io/badge/Google_Sites-Clone-4285F4?style=for-the-badge&logo=google)

**Clone any Google Sites page to static HTML with hosting on GitHub Pages**

[Quick Start](#-quick-start) · [Features](#-features) · [How It Works](#-how-it-works) · [Roadmap](ROADMAP.md)

</div>

---

> *No more vendor lock-in. Your Google Sites content belongs to you.*

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 Auto-crawl | Discovers all pages from sidebar navigation automatically |
| 🎨 Two-pass pipeline | SingleFile for CSS/images + Puppeteer for clean content |
| 🖼️ Image localization | Downloads all images as local files (no CDN dependency) |
| 📺 YouTube thumbnails | Converts embedded iframes to clickable thumbnails |
| 🗺️ SEO ready | Generates `sitemap.xml` + `robots.txt` |
| ⚡ Batch processing | 5 pages per batch with anti-rate-limit pauses |
| 🔄 SPA fallback | Internal navigation for pages that fail direct URL loading |

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
<summary>⚙️ Options</summary>

```bash
gsclone <url> [options]

Options:
  -o, --output <dir>   Output directory (default: ./clone)
  --no-images          Skip image localization
  --no-youtube         Skip YouTube thumbnail download
  --serve              Start local server after build
  --custom-nav         Use custom sidebar navigation
  --inline             Keep images inline (base64)
```

</details>

---

## 💡 How It Works

```
URL → [1. Crawl]     → page-map.json (all pages + structure)
    → [2. SingleFile] → CSS + base64 images (visual fidelity)
    → [3. Puppeteer]  → Clean content + iframe sources
    → [4. Images]     → base64 → local files (permanence)
    → [5. Build]      → Merge all → static HTML clone
```

| Pass | Tool | Captures |
|------|------|----------|
| 1 | Puppeteer | Navigation structure |
| 2 | SingleFile CLI | CSS, base64 images, layout |
| 3 | Puppeteer (batch ×5) | Clean text, links, iframe srcs |
| 4 | Base64 decoder | Images from SingleFile → files |
| 5 | Build script | Merge + YouTube + SEO |

---

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Puppeteer | Content extraction + crawling |
| SingleFile CLI | CSS + image preservation |
| Commander.js | CLI interface |

```
google-sites-clone/
├── bin/
│   └── gsclone.js         # CLI entry point
├── lib/
│   ├── index.js            # Pipeline orchestrator
│   ├── crawl.js            # Auto-crawl navigation
│   ├── singlefile.js       # SingleFile pass
│   ├── puppeteer.js        # Puppeteer batch extraction
│   ├── images.js           # Base64 → local images
│   └── build.js            # Merge + sitemap
├── site/
│   ├── index.html          # Landing page (gsclone.osovsky.com)
│   └── style.css           # Design system
├── architecture.html       # Mermaid diagrams (rendered)
├── ARCHITECTURE.md
├── ROADMAP.md
├── llms.txt
└── package.json
```

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for full details.

- [x] Core pipeline (SingleFile + Puppeteer)
- [x] CLI interface
- [x] Auto-crawl navigation
- [x] Image localization
- [x] Landing page (gsclone.osovsky.com)
- [ ] GitHub Pages deploy
- [ ] npm publish

---

## 🤝 Contributing

Fork → `feature/name` → PR

---

## 📄 License

[Maxim Osovsky](https://www.linkedin.com/in/osovsky/). Licensed under MIT.
