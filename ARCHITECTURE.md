# 🏗️ google-sites-clone — Architecture

---

## ⚙️ CLI Pipeline

```mermaid
flowchart LR
    URL["gsclone URL"] --> C["crawl.js"]
    C -->|page-map.json| SF["singlefile.js"]
    C -->|page-map.json| PP["puppeteer.js"]

    SF -->|"pages/*.html\n(CSS + base64)"| IMG["images.js"]
    PP -->|"content/*.html\n(clean text)"| IMG

    PP -->|"failed pages"| SPA["SPA fallback"]
    SPA --> PP

    IMG -->|"images/*\n(local files)"| B["build.js"]
    SF --> B
    PP --> B

    B -->|"site/"| OUT["index.html\nsitemap.xml\nrobots.txt"]
```

| Module | Input | Output |
|--------|-------|--------|
| `crawl.js` | URL | `page-map.json` (pages + hierarchy) |
| `singlefile.js` | page-map | `pages/*.html` (CSS + base64 images) |
| `puppeteer.js` | page-map | `content/*.html` (clean text + iframes) |
| `images.js` | pages/ + content/ | `images/*` (decoded files) + updated URLs |
| `build.js` | all above | `site/` (final HTML + sitemap + robots.txt) |

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

---

## 🔄 Sequence Diagram

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant V as 🌐 Vercel
    participant GA as 🔑 Google Auth
    participant GH as 🔑 GitHub Auth
    participant CI as ⚙️ GitHub Actions
    participant R2 as ☁️ Cloudflare R2
    participant EM as 📬 Resend
    participant GP as 📄 GitHub Pages

    U->>V: Paste URL
    V->>U: Preview (no login)

    U->>GA: Login with Google
    GA->>V: Email + token

    opt GitHub Pages wanted
        U->>GH: Connect GitHub
        GH->>V: GitHub token
    end

    U->>V: Click "Clone"
    V->>CI: Trigger (URL, email, tokens)
    V->>U: "Check email in ~20 min"

    CI->>CI: Crawl nav → page-map.json
    CI->>CI: Pass 1 SingleFile
    CI->>CI: Pass 2 Puppeteer batch
    CI->>CI: SPA fallback for failed pages
    CI->>CI: Merge + ZIP

    CI->>R2: Upload ZIP (7d TTL)
    CI->>R2: Save report (360d TTL)
    CI->>EM: Send email

    opt GitHub Pages
        CI->>GP: Create repo + push HTML
        GP-->>U: Live at username.github.io/clone
    end

    EM->>U: "Clone ready!" + links
    U->>R2: Download ZIP
    U->>R2: View /r/abc123
```
