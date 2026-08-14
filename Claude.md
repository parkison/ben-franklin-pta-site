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
- **Home** (`content/home.md`) — hero banner image, welcome text, an Announcements section, and Get Involved quick links.
- **About ▾** — Mission (`mission.md`), The Board (`board.md`), Standing Rules (`standing-rules.md`).
- **Get Involved ▾** — Membership (`membership.md`, has a `.btn`-styled Join Now CTA), Volunteering (`volunteering.md`).
- **Calendar** (`calendar.md`) — top-level nav item, not in a dropdown.
- **Programs ▾** — Math Enrichment, Math Challenge, Math Contest.
- **Resource ▾** — Forms (`forms.md`), Photos (`photos.md`, still a stub), Links (`links.md` + `links.csv` — see "Data-driven pages" below).

Nav structure (dropdowns and their order) is defined in the `NAV` array at the top of `build.js` — that array is the source of truth, not this list. When adding a page, add both a `content/<slug>.md` file and an entry in `NAV`, or it won't appear in the header.

## Data-driven pages (CSV-backed content)
Some pages need structured, repeating data (title + link + image) rather than prose — the current example is the **Links** page (QR codes for photo-sharing links, etc.). Pattern:
- `content/links.md` holds only the intro copy (plain markdown, rendered normally).
- `content/links.csv` holds the rows: `category,title,link,qrcode` — `qrcode` is a filename looked up in `assets/images/qrcodes/`.
- `build.js` has a `renderLinksSection()` function that reads the CSV directly and generates the card-grid HTML, appended to the links page's body when `slug === "links"`. This bypasses the markdown inliner entirely.
- **Why not just write the HTML in the markdown file:** the hand-rolled markdown inliner in `lib/md.js` has an `_..._` → `<em>` regex with no escaping, and it runs on raw text indiscriminately — it will mangle underscores inside filenames and SharePoint URLs (both of which are underscore-heavy) if raw HTML is embedded directly in a `.md` file. Learned this the hard way; keep structured/link-heavy data in a CSV read directly by `build.js`, not inline HTML in markdown.
- Section ordering on the page is controlled by `LINK_CATEGORY_ORDER` in `build.js` (not CSV row order) — add new categories there to control where they appear. Section headings come from `LINK_CATEGORY_LABELS`.
- **To add a new link:** append a row to `content/links.csv` and drop the matching image in `assets/images/qrcodes/`, then `node build.js`. No code changes needed unless it's a new category.
- Ben's `staged/` folder (gitignored) is where he drops raw files — CSVs, QR PNGs, PDFs — for Claude to pull in; it's a scratch inbox, not part of the deployed site.

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
- Prominent call-to-action links (e.g. "Join Now" on the membership page) use `<a href="..." class="btn">Text</a>` written directly as an HTML line in the markdown body — this one construct is safe because it has no underscores/asterisks to trip the inliner. Style is in `css/style.css` under `.content a.btn`. Reuse this class for future CTA buttons rather than adding new one-off styles.