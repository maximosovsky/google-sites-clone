# Google Sites Clone — Development Log

> Chronological summary of 11 development sessions (#86–#94) + 2 Dev.to articles.

---

## 📊 Overview

| Metric | Value |
|--------|-------|
| Chat sessions | 9 (#86–#94) |
| Dev.to articles | 2 (#13, #14) |
| Total lines | **26 448** |
| Total size | **~1.04 MB** |
| Period | March 2026 |

---

## 📁 File Index

| # | File | Lines | Size | Topic |
|---|------|------:|-----:|-------|
| 86 | Schematization | 2 063 | 93 KB | Initial clone — Node.js generator, 33 HTML pages, images, YouTube previews |
| 87 | Schematization | 3 663 | 175 KB | README/ARCH, 81 YouTube on member pages, parser comparison (10 options), SingleFile CLI |
| 88 | Fixing Merge-Video Deployment | 5 664 | 258 KB | Full SingleFile clone (34 pages), Puppeteer vs SingleFile, Vercel deploy, repo creation, credential leak fix |
| 89 | Fixing Leaked Credentials | 2 205 | 79 KB | Google/GitHub OAuth stubs, SVG icons (moon/sun/github), hero centering, remote fix |
| 90 | Implementing Video Pipeline | 2 185 | 86 KB | README (readme-guidelines), Vercel deploy gsclone.osovsky.com, favicon, Alternatives section |
| 91 | Video Pipeline and Report Integration | 567 | 29 KB | lib/video.js (YT/Vimeo scan), build.js iframe→thumbnail, report.js → site/, Vimeo regex |
| 92 | Publishing CLI Tool | 2 740 | 107 KB | Video Grid (YT/Vimeo/GDrive), root page filter, clickable report chips, npm publish |
| 93 | что надо сделать | 4 341 | 135 KB | Phase 5 SaaS: Real OAuth, Resend, R2 storage, Lifecycle Rules, Usage Tiers |
| 94 | Google Analytics Integration | 2 662 | 111 KB | Rate limit (Upstash Redis), GitHub Star gate, Usage Tiers ($99 Unlimited), GA4 |
| 13 | autoposting-pipeline | 187 | 10 KB | Dev.to article: Content Distribution Pipeline — 9 types, 20+ platforms |
| 14 | Google sites devto-article | 171 | 7 KB | Dev.to article: AI Clone Failure Story — 5.4/10 performance review |

---

## 🔄 Development Timeline

### Phase 1 — Schematization Clone (#86–#87)
- Scraped Google Sites «Схематизация» via `read_url_content` (text-only)
- Built Node.js generator → 33 HTML pages + `style.css` + `nav.js`
- Downloaded 84 images from Google CDN, deduplicated to ~48
- Extracted 12+ YouTube videos, downloaded thumbnails
- Created Markdown versions with frontmatter
- Wrote README.md and ARCHITECTURE.md for `smd.bar` repo
- Added 81 YouTube thumbnails to 7 member pages
- Compared 10 parsing tools → chose **SingleFile CLI** (#8) for best fidelity

### Phase 2 — Full SingleFile Rebuild (#88)
- Installed `single-file-cli`, saved all 34 pages (7–12 MB each, base64 inline)
- Post-processing: internal link rewriting, Google redirect unwrapping, YouTube iframe→thumbnail
- Fixed hidden sidebar (`display:none` → `display:block`)
- Medium link migration (`@osowski` → `osovsky.medium.com`)
- Served locally via `npx serve`

### Phase 3 — google-sites-clone Project (#88–#89)
- Created `maximosovsky/google-sites-clone` repo on GitHub
- Fixed credential leak (remote pointed to `agent-workflows`)
- Added Google/GitHub OAuth stubs (localStorage-based)
- Replaced emoji theme toggle with SVG moon/sun from `site-design/icons`
- Centered hero layout

### Phase 4 — Pipeline & CLI (#90–#92)
- README formatted per `readme-guidelines`
- Deployed to Vercel → `gsclone.osovsky.com`
- Added favicon from Google Sites logo SVG
- Compared competitors (HTTrack, google-sites-backup) → added Alternatives section
- Implemented `lib/video.js` — scans `_content/` for YouTube (90), Vimeo (6), GDrive (3)
- Built Video Grid: CSS Grid with thumbnails injected into SF pages after `<body>`
- Root page filtering: `index.html` reserved for navigation shell
- Report improvements: clickable colored chips, Total site MB
- Published to npm: `npx google-sites-clone`

### Phase 5 — SaaS Features (#93–#94)
- Implemented Real Google OAuth + Real GitHub OAuth (Vercel API routes)
- Integrated Resend for email delivery
- Created Cloudflare R2 bucket `gsclone` + 3 Lifecycle Rules (zips 7d, previews 7d, reports 360d)
- Designed Usage Tiers:
  - **Free** (Google Auth) — 1 clone, 250 MB ZIP
  - **Starred** (GitHub + ⭐) — 5/day, 20/month, 250 MB ZIP
  - **Unlimited** ($99/mo) — offered via email when Starred exhausted
- Rate limit via Upstash Redis (`clones:daily:{email}:{date}`)
- GitHub Star gate: `GET /user/starred/maximosovsky/google-sites-clone`
- Google Analytics (GA4) integration

---

## ✍️ Dev.to Articles (unpublished)

### #13 — Autoposting Pipeline
**Title:** *How I Designed a Content Distribution Pipeline — 9 Content Types, 20+ Platforms, One Interactive Diagram*
- 187 lines, covers the routing logic for articles, videos, podcasts, events
- Open source: `github.com/maximosovsky/avtoposting`

### #14 — Google Sites Clone Failure Story
**Title:** *I Asked an AI to Clone a Website. It Wrote 15 Scripts, Made 12 Commits, and Still Failed*
- 171 lines, documents 6 AI failures, performance review 5.4/10
- Compares 10 scraping tools, highlights Google Sites vendor lock-in
- Live clone: `maximosovsky.github.io/smd.bar/schematization/`

---

## 🏗️ Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Two-Pass Pipeline (SingleFile + Puppeteer) | SF captures CSS/images, PP captures text/links/YouTube |
| Iframe-based navigation | Sidebar + iframe isolates SF CSS from nav shell |
| Video Grid with inline styles | `all:initial` resets SF styles, no external CSS conflicts |
| Root page skip in build | `index.html` reserved for generated nav, content page keeps transliterated name |
| Cookie-less rate limit (Upstash Redis) | Reliable per-email tracking, can't be bypassed by clearing cookies |
| R2 Lifecycle Rules | Zero-code auto-cleanup: ZIPs 7 days, reports 360 days |
