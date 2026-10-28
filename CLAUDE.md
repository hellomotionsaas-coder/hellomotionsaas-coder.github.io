# CLAUDE.md — Context & Instructions for Claude Code

This file provides key instructions, rules, and architecture for Claude Code when working in this repository.
For the complete detailed documentation, see [README.md](./README.md).

---

## Project Overview

- **Project:** MotionSaas (official website for the MotionSaas Adobe After Effects CEP extension).
- **Brand Name:** **MotionSaas** / **Motion Saas** (Strictly NO legacy names like "VenmoFX" or "SaaS-FX").
- **Product Model:** **Free during early access** — direct download of `MotionSaaS.zip`. No payments, Payhip, or carts for now; it becomes paid later, so never write "free forever".
- **Content must describe the real extension** (tool names and counts from the main repo's HANDOFF.md), not venmofx's SaaS-FX tools.
- **Live Deployment:** [https://hellomotionsaas-coder.github.io/](https://hellomotionsaas-coder.github.io/) (GitHub repository: `hellomotionsaas-coder/hellomotionsaas-coder.github.io`, branch: `main`). The old address `/MotionSaas/` (repo `hellomotionsaas-coder/MotionSaas`) only holds redirects to it now; that repo's Releases still feed the extension's updater, so never delete it.
- **Backup Reference:** `../venmo website backup/` (DO NOT EDIT — reference only).

---

## Critical Rules to Follow

1. **Branding & Copy:**
   - Always brand as **MotionSaas**. Never mention "VenmoFX" or "SaaS-FX" in any UI, text, footer, titles, or FAQs.
   - Use `images/logo.png` for all brand logos, headers, and favicons.

2. **Free Downloads & No Cart:**
   - All CTA buttons (`.btn--primary`) must download `MotionSaaS.zip`.
   - Never re-enable Payhip, checkout modals, or the cart drawer (`buildDrawer()`, `renderCart()` in `js/site.js`).

3. **Top Navigation Pill ("Bluish Thing"):**
   - The top navbar contains **Shop** (`index.html#top`) and **Contact** (`contact.html`).
   - The active tab must have the translucent blue glass pill (`linear-gradient(180deg, rgba(10, 132, 255, 0.17), rgba(10, 132, 255, 0.11))` with inset highlight and subtle blue shadow).
   - "Shop" is active on the homepage; "Contact" is active on `contact.html`. It must NEVER disappear.
   - Fallback styling is set on `.nav__links a.is-on` in `css/site.css` so it works even before JS runs or when opened via `file:///`.

4. **Hero 3D Stage & Floating Apply Button:**
   - `.stage3d` with `.p3d[data-tilt]` containing `.panel.panel--live`.
   - Floating button `.apply3d` ("Apply" -> "Applied") with `.apply-cursor`.
   - Keep the `.panel` class inside `[data-tilt]` so `saasfx.js` doesn't crash.

5. **Modes Section (`#modes`):**
   - Shows the panel in dark and light (`.mp.mp--dark` / `.mp.mp--light`) with real tools: Studio, OS Kit and Tool panels groups.

6. **Interactive Carousel (`#try`):**
   - Uses all 8 cards `images/c1.webp` through `images/c8.webp`.
   - Radial and Curved Line 3D modes with interactive rotation and drag pins.

7. **Button Classes in `css/site.css`:**
   - Ensure `.btn`, `.btn--primary`, `.btn--lg`, and `.btn--ghost` are preserved in `css/site.css`. Without them, buttons render as plain unstyled text links.

---

## Directory Quick Reference

- `index.html`: Main landing page.
- `contact.html`: Contact page.
- `privacy.html`: Privacy policy.
- `css/site.css`: Core typography, `.nav`, `.btn`, and footer styles.
- `css/saasfx.css`: 3D stage, interactive demos, Dark & Light screenshots, install steps.
- `js/site.js`: Nav indicator, smooth scrolling, reveal animations.
- `js/saasfx.js`: 3D tilt math, hover demo, and carousel physics.
- `js/contact.js`: the contact form. GitHub Pages can't receive form posts, so it opens the visitor's email app (`mailto:` hello.motionsaas@gmail.com) with topic + message filled in. Don't add forms that POST, or email popups, unless a real backend (e.g. Formspree) is set up and named in the privacy page.
- `404.html`: shown by GitHub Pages for any missing path, so it uses absolute `/…` URLs.
- `robots.txt`, `sitemap.xml`: list new public pages in the sitemap.
- Support email on the site is **hello.motionsaas@gmail.com** (the user's choice). The `@motionsaas.com` addresses don't exist.
- Removed (Oct 2026), don't bring back: the 15% `offer.js` popup (its emails went nowhere), `products.js`/`payhip.js`/`shop.js` (Payhip catalogue), the `motionsaas.css/js` mirror copies. `shop.html`, `thanks.html`, `contact/`, `privacy/` are redirects.
- `MotionSaaS.zip`: The 8.53 MB extension package for direct download.
- `extension/`: The unpacked Adobe CEP extension files.

---

## Subpage Sync & Deployment

Whenever updating `index.html` or `contact.html`:
1. Keep `contact/index.html` in sync with `contact.html`. (`products/*/index.html` are just redirects to the homepage — nothing to sync.)
2. Deploy to GitHub Pages: the live site is the `main` branch of the public repo `hellomotionsaas-coder/hellomotionsaas-coder.github.io`, cloned at `../site-pages`. This folder is NOT a git repo (it sits untracked inside the private extension repo).
   - Copy without the extension source or the venmofx copy (both must never be public):
     `robocopy 'Dont Delete This\venmo website' 'Dont Delete This\site-pages' /MIR /XD extension saveweb2zip-com-venmofx-com .git`
     (`/MIR` also removes files you deleted here; the `/XD` folders are never copied or removed.)
   - Review `git -C 'Dont Delete This\site-pages' status --short` (only the files you meant to change), commit, `push origin main`.
   - Don't copy the site into `../site-deploy` (the old `hellomotionsaas-coder/MotionSaas` repo): its pages are redirects made by `.claude/site-redirects.js`. A new page on the site gets a redirect there only if old links to it exist.
   - This PC's TEMP folder is access-denied, which breaks Git's credential manager (it falls back to a username prompt). Before pushing, in the same shell: `$env:TEMP = 'D:\Development\projects\MotionSaas\Dont Delete This\tmp'; $env:TMP = 'D:\Development\projects\MotionSaas\Dont Delete This\tmp'`.
   - The repo's Releases (MotionSaaS.zip for the in-panel updater, `depth-model-v1`) are separate from the branch files; a site push doesn't touch them.
