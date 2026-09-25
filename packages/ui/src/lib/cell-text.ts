import type { ReactNode } from "react";

/** Plain text from table cell content for client-side search. */
export function cellText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(cellText).filter(Boolean).join(" ");
  }
  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return cellText(props?.children ?? "");
  }
  return "";
}
