# Ben Franklin PTA Website — Project Context

## What this is
A static website for the Ben Franklin Elementary PTA (Kirkland, WA / LWSD), replacing an existing WordPress site (mybenfranklinpta.org). Ben is the PTA's VP of Tech and the only technical person involved — no one else on the PTA is tech-literate. Workflow: PTA members send Ben text/photos any way they want, Ben forwards it to Claude, Claude edits the site and deploys it. Ben should essentially never need to touch code.

Signups and newsletters are handled by separate external tools (SignUp Genius, MailerLite) — this site is static, public content only.

## Architecture
- Zero npm dependencies, on purpose — a sandboxed build environment couldn't reach the npm registry, so the whole thing is hand-rolled in plain Node. Keep it dependency-free; that's what makes builds/deploys reliable everywhere.
- `build.js` — pure Node script. Reads `content/*.md`, converts to HTML with a minimal hand-rolled markdown parser (`lib/md.js`), wraps each page in a shared layout (nav header + footer), writes output to `public/`.
- `content/*.md` — one file per page. Frontmatter fields: `title`, `nav` (nav label), `slug` (output filename), and optionally `hero` + `hero_alt` (path to a full-width banner image for that page — currently only `home.md` uses this).
- `assets/images/` — image files, copied as-is to `public/assets/images/` on build.
- `css/style.css` — site styling (PTA blue/gold theme), copied to `public/css/style.css` on build.
- `public/` — the build output and the actual deployed site. It's committed straight to the repo (no CI build step). Azure Static Web Apps should be configured with **no build command**: app location `/public`, api location blank, output location blank.
- All internal links and asset paths are relative (no leading `/`), so the site also works by double-clicking `public/index.html` locally — no server needed.

## Current pages
- **Home** (`content/home.md`) — hero banner image, welcome text, an Announcements section with two placeholder entries marked `[Sample]` that need replacing with real content, and quick links (join PTA, newsletter, volunteer).
- **Programs, Volunteering, The Board, Standing Rules, Calendar** — stub pages, "coming soon" placeholders, exist so the nav isn't broken. Not yet built out.

Nav order is fixed in `build.js`: Home, Programs, Volunteering, The Board, Standing Rules, Calendar.

## Content mined from the old site (for filling in future pages)
Old site: mybenfranklinpta.org (WordPress, mascot: Eagles). Contact: communications@mybenfranklinpta.org. Facebook: facebook.com/mybenfranklinpta. Newsletter signup via MailerLite. Join/donate via a Givebacks store. Programs listed on old site: Fall Fundraiser, Math Enrichment, Math Challenge, Math Contests, Reflections (art competition). Volunteering is coordinated externally via SignUp Genius — the Volunteering page should just link out to it once Ben has the link.

## Deployment status
- [x] Homepage + stub pages built and verified locally
- [x] Committed and pushed to `github.com/parkison/ben-franklin-pta-site` (`main`)
- [x] Azure Static Web App created (Free plan), linked to the repo via GitHub Actions (`.github/workflows/azure-static-web-apps-victorious-plant-0b639df10.yml`). Workflow uploads the pre-built `/public` directly — no build command, api/output locations blank. Every push to `main` auto-deploys.
- [x] Verified live on the temporary `*.azurestaticapps.net` URL
- [x] Custom domain live — `mybenfranklinpta.org` and `www.mybenfranklinpta.org` both point to the Static Web App with free managed TLS certs (auto-renewed, expire 2027-02-08). DNS is on Cloudflare; the site's `www`/root records are set to **DNS only** (not proxied) since Azure's cert issuance/validation doesn't play well behind Cloudflare's proxy.
- [x] Domain cutover complete — DNS no longer points at the old WordPress site

## DNS notes (Cloudflare)
- Only two DNS records route to the website: root `A`/`CNAME` and `www` `CNAME`, both now pointing to `victorious-plant-0b639df10.7.azurestaticapps.net`, proxy status **DNS only**.
- Everything else in the zone (MX, autodiscover, DKIM `selector1`/`selector2`/`litesrv`, `ml.*`) is Office 365 email and MailerLite — unrelated to the site, don't touch.
- Old WordPress hosting still exists at `mybenfranklinpta.azurewebsites.net` (Azure App Service) but no longer receives traffic from the domain. Being kept temporarily to mine old content before decommissioning.

## Deploy workflow (for future changes)
Every push to `main` auto-deploys via GitHub Actions — no manual Azure steps needed for routine content updates. After editing `content/*.md` or other source files, run `node build.js` to regenerate `public/`, then commit both source and `public/` and push.

## Notes / gotchas
- Images: drop files in `assets/images/`, reference via `![alt text](assets/images/file.jpg)` in markdown. For a full-width banner instead of an inline image, use the `hero` + `hero_alt` frontmatter fields on that page instead of an inline `![]()`.
- `.content img` CSS constrains normal inline images to the content column (max 100% width). `.hero` CSS handles full-bleed banners (380px tall, `object-fit: cover`).
- No node_modules or npm dependencies anywhere in this repo — please keep it that way.