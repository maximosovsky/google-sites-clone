# 🏗️ google-sites-clone — Architecture

---

## ⚙️ CLI Pipeline

```mermaid
flowchart LR
    URL["gsclone URL"] --> C["crawl.js"]
    C -->|page-map.json| SF["singlefile.js"]
    C -->|page-map.json| PP["puppeteer.js"]

    SF -->|"_pages/*.html\n(CSS + base64)"| IMG["images.js"]
    PP -->|"_content/*.html\n(clean text + iframes)"| IMG

    PP -->|"failed pages"| SPA["SPA fallback"]
    SPA --> PP

    IMG -->|"site/images/\n(local files)"| B["build.js"]
    PP -->|"video-map"| VID["video.js"]
    VID -->|"site/thumbnails/"| B
    SF --> B
    PP --> B
    C -->|page-map.json| RPT["report.js"]
    SF --> RPT
    PP --> RPT

    B -->|"site/"| OUT["index.html\n34 pages\nreport.html\nsitemap.xml\nrobots.txt"]
```

| Module | Input | Output |
|--------|-------|--------|
| `crawl.js` | URL | `page-map.json` (pages + hierarchy) |
| `singlefile.js` | page-map | `_pages/*.html` (CSS + base64 images) |
| `puppeteer.js` | page-map | `_content/*.html` (clean text + iframes) |
| `images.js` | _pages/ + _content/ | `site/images/*` (decoded files) |
| `video.js` | _content/ | `site/thumbnails/*` (YT/Vimeo thumbs) |
| `build.js` | all above | `site/` (index.html + iframe nav + pages) |
| `report.js` | page-map + _pages/ + _content/ | `report.html` (comparison dashboard) |

---

## 📂 Output Structure

```
clone-output/
├── page-map.json              ← Step 1: Crawl
├── _pages/                    ← Step 2: SingleFile
│   ├── shematizatiy.html         (full HTML, ~7 MB)
│   └── ...                       (32 files)
├── _content/                  ← Step 3: Puppeteer
│   ├── shematizatiy.html         (clean content, ~9 KB)
│   └── ...                       (34 files)
└── site/                      ← Step 5: Build
    ├── index.html                (sidebar + iframe nav)
    ├── report.html               (clone report dashboard)
    ├── shematizatiy.html         (SF copy — loaded in iframe)
    ├── ...                       (34 page files)
    ├── images/                   (base64 → local files)
    │   └── img-001.jpg ... img-046.jpg
    ├── thumbnails/            ← Step 4b: Video
    │   └── yt-VIDEO_ID.jpg       (1280×720, fallback 480×360)
    ├── sitemap.xml
    └── robots.txt
```

---

## 🔑 Navigation Architecture

The cloned site uses an **iframe-based** navigation model:

```mermaid
flowchart TB
    subgraph "index.html (frame)"
        NAV["Sidebar nav\n(from page-map.json)"]
        IF["iframe\n(loads page on click)"]
        FT["Footer → report.html"]
    end

    NAV -->|"click"| IF
    IF -->|"src=page.html"| PAGE["SingleFile page\n(no navigation, clean content)"]
    FT --> RPT["report.html"]
```

- **`index.html`** = sidebar navigation (from page-map.json) + `<iframe>`
- **Pages** = clean SingleFile HTML copies (no injected nav = no CSS conflicts)
- **Click sidebar** → changes `iframe.src` → page loads on right
- **Mobile** = hamburger ☰ toggles sidebar

---

## 📺 Video Pipeline

```mermaid
flowchart LR
    PP["_content/ HTML"] --> SCAN["Scan for iframe patterns"]
    SCAN --> YT["YouTube\nyoutube.com/embed/ID"]
    SCAN --> VM["Vimeo\nplayer.vimeo.com/video/ID"]
    SCAN --> GD["Google Drive\ndrive.google.com/file/ID"]

    YT --> DL["Download thumbnail\n1280×720 maxresdefault.jpg\nfallback: 480×360 hqdefault.jpg"]
    VM --> DL2["Download thumbnail\nvumbnail.com/ID.jpg"]
    GD --> SKIP["No thumbnail"]

    DL --> OUT["site/thumbnails/yt-ID.jpg"]
    DL2 --> OUT
```

Thumbnails replace `<iframe>` placeholders with clickable images + play button overlay.

---

## 🌐 Product Architecture

```mermaid
flowchart TB
    subgraph USER["👤 User"]
        A["Paste Google Sites URL"]
    end

    subgraph FRONTEND["🌐 Vercel — gsclone.osovsky.com"]
        B["Landing Page"]
        C{"Auth?"}
        D["Preview Only"]
        E["Google OAuth"]
        F["GitHub OAuth"]
        Q["Queue Status"]
    end

    subgraph BACKEND["⚙️ GitHub Actions"]
        G["Auto-crawl Navigation"]
        H["page-map.json"]

        subgraph PASS1["Pass 1: SingleFile"]
            I["CSS + base64 images"]
        end

        subgraph PASS2["Pass 2: Puppeteer batch ×5"]
            J["Clean content + iframe srcs"]
            J2["SPA navigation fallback"]
        end

        K["Merge"]
        L["YouTube Thumbnails"]
        M["sitemap.xml + robots.txt"]
        N["ZIP"]
    end

    subgraph STORAGE["☁️ Cloudflare R2"]
        O["ZIP (7 days)"]
        P["Report /r/id (360 days)"]
    end

    subgraph DELIVERY["📬 Delivery"]
        R["Email via Resend"]
        S["GitHub Pages"]
    end

    A --> B
    B --> C
    C -->|None| D
    C -->|Google| E --> Q --> G
    C -->|GitHub| F

    G --> H
    H --> I
    H --> J
    J -->|failed| J2
    I --> K
    J --> K
    J2 --> K
    K --> L --> N
    K --> M

    N --> O --> P
    N --> R

    F -->|checkbox| S
    R -->|"ZIP + report link"| USER
    S -->|"username.github.io/clone"| USER
```
