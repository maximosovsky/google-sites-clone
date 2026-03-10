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

## ✅ Phase 4: Distribution (done)

- [x] GitHub Pages deploy (`gsclone deploy`)
- [x] ZIP export (`--zip`)
- [x] README per guidelines
- [x] Vercel landing page fix

---

## ✅ Phase 5: SaaS (done)

- [x] Real Google OAuth
- [x] Real GitHub OAuth
- [x] Email delivery (Resend)
- [x] Cloudflare R2 storage (ZIP 7d, report 360d)

---

## 🔜 Phase 6: Polish

- [ ] Fix email input field visibility on landing page
- [ ] Verify `osovsky.com` domain in Resend (DNS propagation pending)
- [ ] Update `RESEND_FROM` to `clone@osovsky.com`
- [ ] GitHub Pages deploy from email (after clone ready)
  - [ ] Expand GitHub OAuth scope to `public_repo`
  - [ ] Create `/api/deploy?id=xxx` endpoint (download ZIP from R2 → push to gh-pages)
  - [ ] Add "Deploy to GitHub Pages" button in clone-ready email
  - [ ] Handle Vercel timeout (offload to GitHub Actions workflow)
- [ ] Custom domain `gsclone.osovsky.com` → Vercel
- [x] R2 lifecycle rules (zips 7d, previews 7d, reports 360d)
- [ ] Rate limit per user (Upstash Redis: Free 1 clone, Starred 5/day + 20/month)
- [ ] GitHub star gate (require ⭐ for Starred tier)
- [ ] 250 MB ZIP size limit
- [ ] Post-crawl email with accurate page count (webhook from Actions after crawl step)
- [ ] Unlimited tier email offer ($99/mo)
