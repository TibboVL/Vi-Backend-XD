function stripHtml(html) {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

function stripMarkdown(md) {
  return (
    md
      // Remove bold, italic, strikethrough, inline code
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      // Remove headings (# at start of line)
      .replace(/^#{1,6}\s+/gm, "")
      // Remove links and images
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      // Remove blockquotes (> at start of line)
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules (---, ***, ___ lines)
      .replace(/^([-*_]){3,}$/gm, "")
      // Remove remaining markdown symbols except list markers and dash
      // So remove *, _, >, # globally, but keep -, +, * if used as list markers
      .replace(/[_>#]/g, "")
  );
}

export function stripAll(text) {
  return stripMarkdown(stripHtml(text)).trim();
}
