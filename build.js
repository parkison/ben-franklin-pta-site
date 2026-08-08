const fs = require("fs");
const path = require("path");
const { parseFrontmatter, mdToHtml } = require("./lib/md");

const CONTENT_DIR = path.join(__dirname, "content");
const PUBLIC_DIR = path.join(__dirname, "public");
const ASSETS_DIR = path.join(__dirname, "assets");

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

const order = ["Home", "Programs", "Volunteering", "The Board", "Standing Rules", "Calendar"];
pages.sort((a, b) => order.indexOf(a.nav) - order.indexOf(b.nav));

function layout(page) {
  const navLinks = pages
    .map((p) => {
      const href = `${p.slug === "index" ? "index" : p.slug}.html`;
      const current = p.slug === page.slug ? ' aria-current="page"' : "";
      return `<a href="${href}"${current}>${p.nav}</a>`;
    })
    .join("\n      ");

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
      ${navLinks}
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
</body>
</html>
`;
}

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, "css"), { recursive: true });

for (const page of pages) {
  const outName = page.slug === "index" ? "index.html" : `${page.slug}.html`;
  fs.writeFileSync(path.join(PUBLIC_DIR, outName), layout(page));
  console.log("wrote", outName);
}

fs.copyFileSync(path.join(__dirname, "css", "style.css"), path.join(PUBLIC_DIR, "css", "style.css"));
console.log("copied css/style.css");

copyRecursive(ASSETS_DIR, path.join(PUBLIC_DIR, "assets"));
console.log("copied assets/");
