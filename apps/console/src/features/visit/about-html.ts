const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "div",
  "h2",
  "h3",
  "blockquote",
  "span",
  "mark",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

const STYLED = new Set([
  "p",
  "h2",
  "h3",
  "span",
  "mark",
  "td",
  "th",
  "li",
  "div",
  "blockquote",
]);

export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value || /[\u0000-\u001f\s]/.test(value)) return null;
  if (/^(javascript|data|vbscript):/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}([/?#]\S*)?$/i.test(value)) return `https://${value}`;
  return null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function safeStyle(raw: string): string | null {
  const kept: string[] = [];
  for (const chunk of raw.split(";")) {
    const splitAt = chunk.indexOf(":");
    if (splitAt < 0) continue;
    const name = chunk.slice(0, splitAt).trim().toLowerCase();
    const value = chunk.slice(splitAt + 1).trim();
    if (!isSafeStyle(name, value)) continue;
    kept.push(`${name}: ${value}`);
  }
  return kept.length ? kept.join("; ") : null;
}

function isSafeStyle(name: string, value: string): boolean {
  if (!value || value.length > 80 || /[<>{}]|url\s*\(|expression/i.test(value)) {
    return false;
  }
  if (name === "color" || name === "background-color") {
    return (
      /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ||
      /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(
        value,
      )
    );
  }
  if (name === "font-size") return /^\d{1,3}(?:\.\d+)?px$/.test(value);
  if (name === "text-align") return /^(left|center|right|justify)$/.test(value);
  if (name === "font-family") return /^[a-z0-9 ,.'"_-]+$/i.test(value);
  return false;
}

function styleAttr(name: string, attrs: string): string {
  if (!STYLED.has(name)) return "";
  const match = /style\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
  const style = safeStyle(match?.[1] ?? match?.[2] ?? "");
  return style ? ` style="${escapeAttr(style)}"` : "";
}

export function sanitizeAboutHtml(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|object|embed|form|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(
      /<(script|style|iframe|object|embed|form|svg|math)\b[^>]*\/?>/gi,
      "",
    );

  return stripped.replace(
    /<\/?([a-z0-9]+)([^>]*)>/gi,
    (match, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED.has(name)) return "";
      if (match.startsWith("</")) return `</${name}>`;
      if (name === "br") return "<br>";
      if (name === "a") {
        const hrefMatch =
          /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
        const href = safeHref(
          hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "",
        );
        if (!href) return "";
        return `<a href="${escapeAttr(href)}" rel="noreferrer noopener" target="_blank"${styleAttr(name, attrs)}>`;
      }
      if (name === "td" || name === "th") {
        const span = (attr: string) => {
          const found = new RegExp(`${attr}\\s*=\\s*"?(\\d+)"?`, "i").exec(attrs);
          const count = Number(found?.[1] ?? 0);
          return count > 1 && count < 20 ? ` ${attr}="${count}"` : "";
        };
        return `<${name}${span("colspan")}${span("rowspan")}${styleAttr(name, attrs)}>`;
      }
      return `<${name}${styleAttr(name, attrs)}>`;
    },
  );
}

export function aboutPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}
