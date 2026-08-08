const fs = require("fs");
const path = require("path");
const { parseFrontmatter, mdToHtml } = require("./lib/md");

const CONTENT_DIR = path.join(__dirname, "content");
const PUBLIC_DIR = path.join(__dirname, "public");
const ASSETS_DIR = path.join(__dirname, "assets");

const NAV = [
  {
    type: "dropdown",
    label: "About",
    children: [
      { type: "page", slug: "mission" },
      { type: "page", slug: "board" },
      { type: "page", slug: "standing-rules" },
    ],
  },
  {
    type: "dropdown",
    label: "Get Involved",
    children: [
      { type: "external", label: "Join the PTA", href: "https://mybenfranklinpta.givebacks.com/shop" },
      { type: "page", slug: "volunteering" },
    ],
  },
  { type: "page", slug: "calendar" },
  {
    type: "dropdown",
    label: "Programs",
    children: [
      { type: "page", slug: "math-enrichment" },
      { type: "page", slug: "math-challenge" },
      { type: "page", slug: "math-contest" },
    ],
  },
  {
    type: "dropdown",
    label: "Resource",
    children: [
      { type: "page", slug: "forms" },
      { type: "page", slug: "photos" },
    ],
  },
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

const pages = files.map((file) => {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
  const { data, body } = parseFrontmatter(raw);
  return {
    title: data.title || file,
    nav: data.nav || data.title,
    slug: data.slug || file.replace(/\.md$/, ""),
    hero: data.hero || null,
    heroAlt: data.hero_alt || data.title || "",
    html: mdToHtml(body),
  };
});

const pageBySlug = new Map(pages.map((p) => [p.slug, p]));

function pageHref(slug) {
  return slug === "index" ? "index.html" : `${slug}.html`;
}

function renderChildLink(item, currentSlug) {
  if (item.type === "external") {
    return `<a href="${item.href}" target="_blank" rel="noopener">${item.label}</a>`;
  }
  const p = pageBySlug.get(item.slug);
  const current = p.slug === currentSlug ? ' aria-current="page"' : "";
  return `<a href="${pageHref(p.slug)}"${current}>${p.nav}</a>`;
}

function renderTopNav(currentSlug) {
  return NAV.map((item) => {
    if (item.type === "page") {
      const p = pageBySlug.get(item.slug);
      const current = p.slug === currentSlug ? ' aria-current="page"' : "";
      return `<li><a href="${pageHref(p.slug)}"${current}>${p.nav}</a></li>`;
    }
    const hasCurrent = item.children.some((c) => c.type === "page" && c.slug === currentSlug);
    const childrenHtml = item.children
      .map((c) => `<li>${renderChildLink(c, currentSlug)}</li>`)
      .join("\n          ");
    return `<li class="nav-dropdown${hasCurrent ? " has-current" : ""}">
          <button type="button" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">${item.label}</button>
          <ul class="dropdown-menu">
          ${childrenHtml}
          </ul>
        </li>`;
  }).join("\n        ");
}

function layout(page) {
  const navLinks = renderTopNav(page.slug);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} · Ben Franklin PTA</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="index.html">Ben Franklin PTA</a>
      <nav class="site-nav">
        <ul>
        ${navLinks}
        </ul>
      </nav>
    </div>
  </header>

  ${page.hero ? `<div class="hero"><img src="${page.hero}" alt="${page.heroAlt}"></div>` : ""}

  <main class="content">
    ${page.html}
  </main>

  <footer class="site-footer">
    <p>Ben Franklin PTA &middot; <a href="mailto:communications@mybenfranklinpta.org">communications@mybenfranklinpta.org</a> &middot; <a href="https://www.facebook.com/mybenfranklinpta">Facebook</a></p>
  </footer>

  <script>
    document.querySelectorAll(".nav-dropdown-toggle").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var li = btn.closest(".nav-dropdown");
        var isOpen = li.classList.contains("open");
        document.querySelectorAll(".nav-dropdown.open").forEach(function (el) {
          el.classList.remove("open");
          el.querySelector(".nav-dropdown-toggle").setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          li.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll(".nav-dropdown.open").forEach(function (el) {
        el.classList.remove("open");
        el.querySelector(".nav-dropdown-toggle").setAttribute("aria-expanded", "false");
      });
    });
  </script>
</body>
</html>
`;
}

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, "css"), { recursive: true });

for (const page of pages) {
  const outName = pageHref(page.slug);
  fs.writeFileSync(path.join(PUBLIC_DIR, outName), layout(page));
  console.log("wrote", outName);
}

fs.copyFileSync(path.join(__dirname, "css", "style.css"), path.join(PUBLIC_DIR, "css", "style.css"));
console.log("copied css/style.css");

copyRecursive(ASSETS_DIR, path.join(PUBLIC_DIR, "assets"));
console.log("copied assets/");
