---
title: "They Said It Was Impossible to Clone a Google Site. So I Built a Tool That Does It in 20 Minutes"
published: false
description: "38,000 people on StackOverflow asked how to export a Google Site. The top answer: 'Not possible.' I built an open-source tool that does it automatically."
tags: webdev, opensource, javascript, buildinpublic
cover_image: 
---

## 38,000 People Asked. The Answer Was "Not Possible"

A developer on [StackOverflow](https://stackoverflow.com/) asks: *"Is there any way to download sites from Google Site?"*

The top answer, with 6 upvotes: **"Not possible unfortunately. That's the catch with website builders."**

On [Reddit](https://www.reddit.com/r/web_design/): *"Not possible unfortunately."*

On [Google's own support forum](https://support.google.com/sites/thread/49510989): a user discovers that Google Takeout only works for Classic Sites — **not for the new Google Sites** built after 2020.

38,000 views. Zero solutions.

I film long strategy sessions — 6 to 8 hours each — and document everything on [Google Sites](https://sites.google.com/). One day I needed to move a 33-page site to my own hosting. That's when I discovered what 38,000 other people already knew: **Google won't let you export your own content.**

---

## Why Traditional Tools Fail

New Google Sites (2020+) is a **single-page application**. All content is rendered by JavaScript. When you point a traditional crawler at it, here's what happens:

| Tool | What it sees |
|------|-------------|
| [HTTrack](https://github.com/xroche/httrack) | Empty HTML shell. No text, no images |
| `wget --mirror` | Redirect loop. Maybe an empty `index.html` |
| [google-sites-backup](https://github.com/famzah/google-sites-backup) | Nothing — uses deprecated GData API, Classic Sites only |
| [generate-static-site](https://github.com/lichtquelle/generate-static-site) | Can render one page, but doesn't know Google Sites navigation |
| Google Takeout | Only exports Classic Sites. New Sites: no support |

The content is there — your browser can see it. But every crawler downloads an empty page because no one executes the JavaScript.

---

## The First Attempt: 15 Scripts, 12 Commits, 5.4/10

I didn't start with a clean solution. My first attempt was a disaster that I documented in a [previous article](https://dev.to/osovsky/).

I pointed an AI coding agent at the problem. 3 hours later:

- **15 separate scripts** instead of one universal pipeline
- HTML structure stripped to plain text (`innerHTML` → `textContent`)
- Hallucinated data in the README (wrote "12 participants" when the page listed 67)
- Zero self-verification across 12 commits

The scraping tool ([SingleFile](https://github.com/nicknisi/single-file-cli)) worked perfectly — 33 pages, 240 MB of complete HTML snapshots. But the processing pipeline was a mess.

I gave the AI a performance review: **5.4 out of 10. Below expectations.**

That failure taught me exactly what the pipeline needed to be.

---

## The Solution: Two-Pass Pipeline

The key insight came from that failure: **no single tool captures everything.** SingleFile preserves CSS and images perfectly but produces messy markup. [Puppeteer](https://pptr.dev/) extracts clean semantic content but loses styles.

So I combined both:

```
URL → [1. Crawl]      → page-map.json (all pages)
    → [2. SingleFile]  → CSS + base64 images
    → [3. Puppeteer]   → Clean content + YouTube
    → [4. Images]      → base64 → local files
    → [5. Build]       → Merge → static HTML clone
```

**Pass 1 (SingleFile):** downloads each page as a self-contained HTML file with all CSS computed and images embedded as base64. This is your visual fidelity source.

**Pass 2 (Puppeteer):** opens each page in a headless browser, waits for the SPA to render, scrolls to trigger lazy loading, and extracts clean semantic HTML. This is your content source.

**The merge** takes CSS from Pass 1 and content from Pass 2. Best of both worlds.

---

## Feature #1: Auto-Crawl

Google Sites hides its navigation behind JavaScript. You can't just follow `<a>` tags — there aren't any in the source HTML.

The auto-crawl module opens the main page with Puppeteer, waits for the sidebar to render, parses all `li[role="treeitem"]` navigation links, and builds a complete page map with titles, URLs, and nesting depth.

It handles Cyrillic titles too — transliterating them to Latin slugs for filenames:

```
"Шахматная доска" → shakhmatnaya-doska.html
```

One command discovers every page on the site.

---

## Feature #2: Image Localization

Google Sites serves all images through `lh*.googleusercontent.com` — an authenticated CDN. If Google changes the URL schema or revokes access, your images disappear.

The image localization module matches CDN URLs from Puppeteer content with base64-encoded images from SingleFile by position, decodes them to local files, and rewrites all URLs. Your clone works offline, forever.

---

## Feature #3: YouTube Thumbnails

Google Sites embeds YouTube videos as iframes. Traditional crawlers skip them entirely.

The pipeline detects every YouTube embed, extracts the video ID, downloads the `maxresdefault.jpg` thumbnail from YouTube's CDN, and creates a clickable thumbnail with a play button overlay. Readers click through to YouTube — no broken iframes, no empty spaces.

---

## Built With AI — in 3 Days

After the first failed attempt, I rebuilt everything from scratch with [Antigravity](https://blog.google/technology/google-deepmind/), an AI coding assistant by Google DeepMind.

This time the approach was different:

1. **Clear architecture first** — Mermaid diagrams before any code
2. **One universal pipeline** — not 15 scripts
3. **Each step verifiable** — page-map.json, SingleFile HTML, Puppeteer content, all inspectable
4. **Batch processing** — 5 pages per batch, 60-second pauses between batches to avoid rate limiting

What took 3 hours of chaos the first time took **3 days of focused work** the second time — with a tool that anyone can use.

---

## Where It Stands Now

This is a build-in-public project. Here's what works and what's next:

| Component | Status |
|-----------|--------|
| Auto-crawl navigation | ✅ Working |
| SingleFile pass (CSS + images) | ✅ Working |
| Puppeteer batch extraction | ✅ Working |
| Image localization | ✅ Working |
| YouTube thumbnails | ✅ Working |
| SEO (sitemap.xml + robots.txt) | ✅ Working |
| CLI interface | ✅ Working |
| Landing page | ✅ [gsclone.osovsky.com](https://gsclone.osovsky.com) |
| GitHub Actions backend | 🔜 In progress |
| npm publish | 🔜 Planned |
| Web UI clone-on-demand | 🔜 Planned |

---

## Try It

```bash
npx google-sites-clone https://sites.google.com/view/your-site
```

Or clone the repo:

```bash
git clone https://github.com/maximosovsky/google-sites-clone
cd google-sites-clone
npm install
node bin/gsclone.js https://sites.google.com/view/your-site
```

**Live**: [gsclone.osovsky.com](https://gsclone.osovsky.com)
**Source**: [github.com/maximosovsky/google-sites-clone](https://github.com/maximosovsky/google-sites-clone)

---

## Has Anyone Else Solved This?

If you've tried to export a Google Site — or if you've found a better approach — I want to hear from you:

- Did HTTrack or wget work for you on new Google Sites?
- Have you tried Google Takeout for new Sites?
- Any success with the Google Sites API?

Leave a comment. 38,000 people are waiting for answers.

---

Building in public, one utility at a time. Follow the journey: [LinkedIn](https://www.linkedin.com/in/osovsky/) · [GitHub](https://github.com/maximosovsky)
