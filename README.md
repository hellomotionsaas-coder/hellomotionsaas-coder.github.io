# MotionSaas — Website Architecture, Context & Developer Guide

> **Note for Claude Code / AI Agents:**  
> This file contains the complete project context, design requirements, technical architecture, business rules, and history of bug fixes. Read this document thoroughly before modifying any code.

---

## 1. Project Overview & Background

- **Product Name:** **MotionSaas** (or **Motion Saas**)
- **Product Type:** Adobe After Effects extension (CEP Panel) built specifically for SaaS video editors, product designers, and motion graphics artists.
- **Original Codebase:** The site was originally created as *VenmoFX* / *SaaS-FX*. It has been completely rebranded to **MotionSaas**.
- **Monetization Model:** **Free during early access** (the extension is still being built; it will become paid later). Copy says "free during early access" — never "free forever". All payment gateways, checkout drawers, and Payhip modals have been removed for now; the backup has them if pricing comes back. Users download `MotionSaaS.zip` directly from the website without paying, entering credit cards, or signing up.
- **Official Live Website:** [https://hellomotionsaas-coder.github.io/MotionSaas/](https://hellomotionsaas-coder.github.io/MotionSaas/)
- **GitHub Repository:** `https://github.com/hellomotionsaas-coder/MotionSaas.git` (Branch: `main`)
- **Working Directory:** `D:\Development\projects\MotionSaas\Dont Delete This\venmo website`
- **Backup Directory (REFERENCE ONLY — DO NOT EDIT):** `D:\Development\projects\MotionSaas\Dont Delete This\venmo website backup`

---

## 2. Strict Business Rules & Non-Negotiable Guidelines

### 1. Branding: MotionSaas ONLY
- **NEVER** use the legacy names **"VenmoFX"**, **"Venmo FX"**, **"SaaS-FX"**, or **"saasfx"** anywhere in the UI, headlines, body text, footer, FAQs, page titles, or meta tags.
- The company/tool name is **MotionSaas** (logo typography: **Motion** in ink/white, **Saas** in `#007aff` electric blue).
- The official logo file is located at `images/logo.png`. Use this logo for all headers, footers, modal branding, and favicon generation.

### 2. Free Direct Download — No Payment Gateways
- **NEVER** re-introduce Payhip, PayPal, Stripe, shopping carts, or price tags (e.g. `$39` or `$56`).
- All primary CTA buttons (Hero, Final CTA, Sticky Buybar, and Footer) MUST link directly to `MotionSaaS.zip` with the `download` attribute:
  ```html
  <a href="MotionSaaS.zip" download class="btn btn--primary btn--lg">
    <svg ...></svg>
    <span>Download Extension (Free)</span>
  </a>
  ```
- The extension package `MotionSaaS.zip` (8.53 MB) is located in the website root directory and is served directly by the web server.

### 3. Top Navigation: "Shop" & "Contact" with Glass Capsule Indicator
- The top navigation bar contains exactly two links:
  1. **Shop** (linking to `index.html#top`)
  2. **Contact** (linking to `contact.html`)
  *(Note: The link is named "Shop" instead of "Download" per user requirement because "Shop" is short, clean, and balanced in the pill).*
- **The "Bluish Thing" (Active Nav Pill):**
  - The active page link MUST be highlighted with the signature translucent blue glass pill:
    ```css
    background: linear-gradient(180deg, rgba(10, 132, 255, 0.17), rgba(10, 132, 255, 0.11));
    box-shadow: inset 0 0 0 0.5px rgba(10, 132, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 4px 12px -6px rgba(10, 108, 240, 0.45);
    color: #007aff !important;
    ```
  - When on the homepage / Shop, **Shop** MUST have the blue capsule.
  - When on `contact.html`, **Contact** MUST have the blue capsule.
  - When hovering between links, the animated `.nav__ind` element smoothly slides between them.
  - **Critical Fallback:** Even before JavaScript calculates the layout (or if opened locally via `file:///`), `.nav__links a.is-on` and `a[aria-current="page"]` in `css/site.css` apply the styling directly so the blue highlight **never vanishes or flashes unstyled**.

### 4. Hero Section & Interactive 3D Stage (`.stage3d`)
- In `index.html`, the hero media consists of:
  - `.stage3d[data-tilt-stage]` with `.p3d[data-tilt]` containing `.panel.panel--live`.
  - Mouse-tracking tilt physics with dynamic glare (`--glare`) and sheen sweep (`--sheen`).
  - `.apply-float[data-apply-float]` containing:
    - `<button type="button" class="apply3d" data-apply3d="">` with `.apply3d__txt` ("Apply") and `.apply3d__done` ("Applied" with checkmark).
    - An animated mouse cursor SVG `.apply-cursor` pointing to the button.
  - **Rule:** DO NOT rename the button to "Try It" and DO NOT remove `.panel` class, as `saasfx.js` / `motionsaas.js` expects `.panel` to attach dynamic CSS properties.

### 5. Extension UI in `#modes` (Dark Mode & Light Mode)
- The `#modes` section shows the panel twice, `.mp.mp--dark` and `.mp.mp--light` (styles in `css/saasfx.css`), with the extension's real tools: **Studio** (Easing, Expressions, Shake, Styles), **OS Kit** (Typing, Cursor, Hover, Counter), **Tool panels** (Carousel, Grid Builder, Palettes, Assetbox).
- The hero panel lists Text / Motion / Layouts / Transitions / Design with real tool names. Tool names and counts on the site must match the extension (see the main repo's HANDOFF.md). Version shown is the extension's (`extension/CSXS/manifest.xml`), currently v1.0.
- The old `.ms-preview` "Anchor & Align" mock is no longer used (its CSS is still at the end of `saasfx.css`).

### 6. Interactive Live Demos (`#try`)
- Live interactive previews running directly in the browser:
  1. **Text Animation Demo:** Real-time typography effects (Rise, Drop, From Left, Fade, Scale Up, Blur In) with sliders for Amount and Delay.
  2. **Hover Demo:** Interactive card hover physics.
  3. **Carousel Demo (`.car-stage[data-carousel-demo]`):**
     - Uses **8 carousel items** loading `images/c1.webp` through `images/c8.webp`.
     - Supports **Radial** and **Curved Line** 3D rotation modes with draggable SVG curve pins and rotation sliders (`data-rx`, `data-ry`).

### 7. Discount Popup (`js/offer.js`)
- Displays an email signup popup for a 15% discount code (`MOTION15`).
- Uses `sessionStorage.getItem('ms_offer_shown_session')` so it appears **only once per browsing session**. It will NOT reappear on subsequent page visits unless the session is closed and reopened.

---

## 3. Directory & File Structure

```
venmo website/
├── index.html                   # Primary homepage (Hero 3D, Video Demo, Demos, Modes, Specs, FAQ, Download)
├── contact.html                 # Contact support page (with working form and matching nav)
├── privacy.html                 # Privacy policy (free software & direct download terms)
├── shop.html                    # Legacy product page (kept for reference; hidden from main navigation)
├── MotionSaaS.zip               # Pre-packaged After Effects CEP Extension (8.53 MB direct download)
│
├── css/
│   ├── site.css                 # Base typography, layout, navbar (.nav, .nav__pill, .nav__ind), .btn classes, footer
│   ├── saasfx.css               # Hero 3D panel (.stage3d, .p3d), demo styles, modes (.ms-preview), carousel
│   ├── motionsaas.css           # Mirror copy of saasfx.css (ensures backward and forward compatibility)
│   ├── contact.css              # Contact page specific styles
│   ├── offer.css                # 15% discount popup styles
│   └── home.css / shop.css      # Auxiliary layout styles
│
├── js/
│   ├── site.js                  # Primary site logic: initNav(), initNavIndicator(), initReveal(), lazy video loader
│   ├── saasfx.js                # 3D panel tilt (panel3d), hoverDemo, carouselDemo (c1-c8 radial/curved)
│   ├── motionsaas.js            # Mirror copy of saasfx.js
│   ├── offer.js                 # 15% discount modal logic with sessionStorage throttling
│   └── products.js              # Product metadata definitions
│
├── images/
│   ├── logo.png                 # Official MotionSaas high-resolution logo
│   ├── favicon.png              # 64x64 PNG favicon generated from logo.png
│   ├── favicon-32.png           # 32x32 PNG favicon
│   ├── apple-touch-icon.png     # 180x180 Apple touch icon
│   ├── c1.webp ... c8.webp      # 8 card assets used in the interactive 3D carousel demo
│   ├── trial-v2.jpg             # Video poster frame for After Effects demo
│   └── bounce.jpg, carousel.jpg # Showcase video thumbnail posters
│
├── media/
│   ├── trial-v2.mp4             # Demo video showing MotionSaas inside Adobe After Effects
│   ├── bounce.mp4               # Bounce tool feature video
│   ├── carousel.mp4             # Carousel tool feature video
│   └── ui-sequence.mp4          # UI Sequence tool feature video
│
├── extension/                   # Unpacked Adobe After Effects CEP extension source code
│   ├── index.html               # Extension UI panel
│   ├── CSXS/manifest.xml        # Adobe CEP manifest configuration
│   ├── css/                     # Extension stylesheets
│   ├── js/                      # Extension CEP scripts
│   └── jsx/                     # After Effects ExtendScript files (.jsx)
│
├── contact/                     # Directory-style alias for contact.html
│   └── index.html
└── products/                    # Old product URLs: tiny redirects to ../../index.html (no copy to keep in sync)
    ├── motionsaas/index.html
    └── saasfx/index.html
```

---

## 4. Technical Architecture & Critical Gotchas

### Gotcha 1: Button Classes in `site.css`
- When modifying `site.css`, **never remove the button styles**.
- All CTA buttons depend on:
  - `.btn`: Base pill layout (`display: inline-flex`, `border-radius: 999px`, `font-weight: 600`, `padding: 12px 22px`).
  - `.btn--primary`: Electric blue gradient (`linear-gradient(180deg, #2a8dff, #0a6cf0)`), white bold text, box shadow.
  - `.btn--ghost`: Clean white/frosted surface with subtle 1px border.
  - `.btn--lg`: Large format (`padding: 15px 28px`, `font-size: 17px`).
  - `.btn svg`: Sized at `20px x 20px` with `stroke-width: 2.2`.
- If these classes are omitted, buttons degrade into plain unstyled text links!

### Gotcha 2: Never Enable Cart Drawer in `js/site.js`
- In `js/site.js`, `buildDrawer()` and `renderCart()` are intentionally neutralized:
  ```javascript
  function buildDrawer() {
    return; // Cart disabled for free direct download
  }
  ```
- If this function is reinstated, it will append an unstyled Payhip cart (`<aside class="cart">`) to the document body, rendering broken pricing text at the bottom of every page. Keep it disabled.

### Gotcha 3: Null-Safety in `saasfx.js` / `motionsaas.js`
- In `panel3d()`, always guard the `.panel` lookup:
  ```javascript
  var card = document.querySelector('[data-tilt]');
  if (!stage || !card) return;
  var panel = card.querySelector('.panel');
  if (!panel) return;
  ```
- If `.panel` is missing and guarded improperly, `panel.style.setProperty(...)` throws a `TypeError`, which halts the JavaScript thread and prevents `carouselDemo()` from initializing.

### Gotcha 4: Nav Indicator Active Tab Detection
- In `js/site.js` (`initNavIndicator`), use robust path detection to support both local files (`file:///`) and GitHub Pages (`/MotionSaas/`):
  ```javascript
  var path = (window.location.pathname || '').toLowerCase();
  var href = (window.location.href || '').toLowerCase();
  var isContact = path.includes('contact') || href.includes('contact');
  var cur = isContact ? wrap.querySelector('a[href*="contact"]') : (wrap.querySelector('a[href*="index"]') || links[0]);
  ```

---

## 5. Deployment Workflow (GitHub Pages)

The website is deployed to GitHub Pages from the repository `hellomotionsaas-coder/MotionSaas` on branch `main`.

### Deployment Steps:
1. Verify that HTML tags are balanced:
   ```powershell
   python scratch/validate_tags.py
   ```
2. Sync root changes to subdirectories (`contact/index.html`, `products/motionsaas/index.html`, `products/saasfx/index.html`):
   ```powershell
   python scratch/sync_subpages.py
   ```
3. Copy updated files to deployment repository and push:
   ```powershell
   python scratch/deploy_updated_site.py
   ```
   *(Or navigate to the git clone directory, `git add -A`, `git commit -m "..."`, and `git push origin main`).*
4. Ensure `.nojekyll` exists in the repository root so GitHub Pages doesn't ignore directories starting with underscores.
5. Check deployment status:
   ```powershell
   gh api repos/hellomotionsaas-coder/MotionSaas/pages
   ```

---

## 6. Summary Checklist for Any Future Changes

- [ ] Does the page use **MotionSaas** everywhere (0 occurrences of VenmoFX or SaaS-FX)?
- [ ] Are all download buttons functional and pointing to `MotionSaaS.zip`?
- [ ] Is there **zero** mention of pricing, checkout, Payhip, or payment methods?
- [ ] Does the navbar glass pill highlight **Shop** on the homepage and **Contact** on `contact.html`?
- [ ] Does the hero 3D card tilt with mouse movement and have an interactive "Apply" button?
- [ ] Do all 8 carousel images (`c1.webp` through `c8.webp`) render in `#try`?
- [ ] Do `.btn` elements render with rounded blue pill backgrounds, not raw text?
- [ ] Has `README.md` and `CLAUDE.md` been updated if any new files or features were added?
