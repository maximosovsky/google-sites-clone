# 🗺️ google-sites-clone — Roadmap

> Paste a Google Sites URL → get a complete static HTML clone

---

## 📋 Decisions

| Question | Decision |
|----------|----------|
| Name | `google-sites-clone` |
| Platform | Google Sites only |
| Audience | Everyone (Web UI + CLI) |
| Images | Download from CDN → local files |
| Navigation | Original / Custom sidebar |
| YouTube | Thumbnails with link / iframe embed |
| Mode | One-time clone |
| License | MIT (open-source) |
| Output | ZIP / GitHub Pages |
| Landing | [gsclone.osovsky.com](https://gsclone.osovsky.com) |

---

## ✅ Phase 1: Core Pipeline (done)

- [x] Auto-crawl: Puppeteer → parse sidebar → page-map.json
- [x] SingleFile pass for all pages (CSS + base64 images)
- [x] Puppeteer batch pass (5/batch, 60s pause)
- [x] SPA navigation fallback for failed pages
- [x] Merge: SingleFile styles + Puppeteer content
- [x] Download images from Google CDN → local files
- [x] YouTube/Vimeo → thumbnails + play button
- [x] Video grid (YT/Vimeo/GDrive) injected into SF pages
- [x] Root page filtering (index.html reserved for nav shell)
- [x] Generate sitemap.xml + robots.txt
- [x] Footer badge on all pages
- [x] CLI interface (Commander.js)
- [x] Clone report dashboard (clickable chips, total size)

---

## ✅ Phase 2: Landing Page (done)

- [x] Landing page at gsclone.osovsky.com
- [x] Dark mode toggle
- [x] Google OAuth stub
- [x] GitHub OAuth stub
- [x] Clone form with options
- [x] Pipeline visual
- [x] Comparison table

---

## ✅ Phase 3: npm publish (done)

- [x] npm publish (`npx google-sites-clone URL`)
- [x] MANUAL.md user manual
- [x] `.npmignore`, dynamic version in CLI

---

## 🔜 Phase 4: Distribution

- [ ] GitHub Pages deploy (`gsclone deploy`)
- [ ] Rate limits (max pages, cooldown)

---

## 🔜 Phase 5: Polish

- [ ] Email delivery (Resend)
- [ ] Cloudflare R2 storage (ZIP 7d, report 360d)
- [ ] Real Google OAuth
- [ ] Real GitHub OAuth
