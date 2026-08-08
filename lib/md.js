// Minimal, dependency-free markdown -> HTML converter.
// Supports: frontmatter, #/## headings, paragraphs, **bold**, _italic_,
// [text](url) links, ![alt](src) images, and "- " bullet lists.

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    data[key] = val;
  });
  return { data, body: match[2] };
}

function inline(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function mdToHtml(body) {
  const lines = body.split("\n");
  let html = "";
  let inList = false;
  let para = [];

  function flushPara() {
    if (para.length) {
      html += `<p>${inline(para.join(" "))}</p>\n`;
      para = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      flushPara();
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      continue;
    }
    const h = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      const level = h[1].length;
      html += `<h${level}>${inline(h[2])}</h${level}>\n`;
      continue;
    }
    if (trimmed.startsWith("- ")) {
      flushPara();
      if (!inList) {
        html += "<ul>\n";
        inList = true;
      }
      html += `<li>${inline(trimmed.slice(2))}</li>\n`;
      continue;
    }
    para.push(trimmed);
  }
  flushPara();
  if (inList) html += "</ul>\n";
  return html;
}

module.exports = { parseFrontmatter, mdToHtml };
