// Minimal, dependency-free markdown -> HTML converter.
// Supports: frontmatter, #/## headings, paragraphs, **bold**, _italic_,
// [text](url) links, ![alt](src) images, "- " bullet lists,
// "| a | b |" pipe tables (with a "| --- | --- |" separator row), and
// <details>/<summary>/</details> passthrough lines for collapsible sections.

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

function isTableRow(trimmed) {
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function isTableSeparator(trimmed) {
  return isTableRow(trimmed) && /^\|(\s*:?-+:?\s*\|)+$/.test(trimmed);
}

function splitTableRow(trimmed) {
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

const RAW_HTML_LINE = /^<\/?(details|summary)(\s[^<>]*)?>([^<>]*<\/(details|summary)>)?$/i;

function isRawHtmlLine(trimmed) {
  return RAW_HTML_LINE.test(trimmed);
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

  function closeList() {
    if (inList) {
      html += "</ul>\n";
      inList = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      flushPara();
      closeList();
      continue;
    }
    if (isRawHtmlLine(trimmed)) {
      flushPara();
      closeList();
      html += `${trimmed}\n`;
      continue;
    }
    if (isTableRow(trimmed) && isTableSeparator((lines[i + 1] || "").trim())) {
      flushPara();
      closeList();
      const headerCells = splitTableRow(trimmed);
      html += `<table>\n<thead>\n<tr>${headerCells.map((c) => `<th>${inline(c)}</th>`).join("")}</tr>\n</thead>\n<tbody>\n`;
      i += 2;
      while (i < lines.length && isTableRow(lines[i].trim())) {
        const cells = splitTableRow(lines[i].trim());
        html += `<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>\n`;
        i++;
      }
      html += `</tbody>\n</table>\n`;
      i--;
      continue;
    }
    const h = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara();
      closeList();
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
  closeList();
  return html;
}

module.exports = { parseFrontmatter, mdToHtml };
