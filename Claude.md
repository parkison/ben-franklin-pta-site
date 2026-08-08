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
- [x] Committed to git locally and handed off via a git bundle (network in the previous session couldn't reach github.com directly)
- [ ] Verify the push landed: check https://github.com/parkison/ben-franklin-pta-site has the commit "Initial PTA site: homepage with nav, hero banner, stub pages" — if not, the bundle is sitting locally and needs `git push -u origin main` run from wherever it was cloned
- [ ] Azure Static Web App — not created yet. Needs: new Static Web App resource, Free plan, GitHub deployment source linked to the repo above, branch `main`, build preset "Custom", app location `/public`, api location blank, output location blank
- [ ] Custom domain — Ben already owns the domain and has full Azure access/credit. Once the Static Web App is live, add the domain via Azure Portal > Custom domains and follow the DNS instructions Azure gives
- [ ] Keep the old WordPress site (mybenfranklinpta.org) live until the new site is verified on its temporary `*.azurestaticapps.net` URL, then cut the domain over

## Notes / gotchas
- Images: drop files in `assets/images/`, reference via `![alt text](assets/images/file.jpg)` in markdown. For a full-width banner instead of an inline image, use the `hero` + `hero_alt` frontmatter fields on that page instead of an inline `![]()`.
- `.content img` CSS constrains normal inline images to the content column (max 100% width). `.hero` CSS handles full-bleed banners (380px tall, `object-fit: cover`).
- No node_modules or npm dependencies anywhere in this repo — please keep it that way.