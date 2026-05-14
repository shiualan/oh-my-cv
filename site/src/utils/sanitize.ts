import { htmlEscape } from "@renovamen/utils";

const ALLOWED_TAGS = new Set([
  "a",
  "annotation",
  "blockquote",
  "br",
  "code",
  "dd",
  "del",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "math",
  "mfrac",
  "mi",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mrow",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munderover",
  "ol",
  "p",
  "pre",
  "semantics",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul"
]);

const GLOBAL_ATTRS = new Set([
  "aria-hidden",
  "aria-label",
  "class",
  "data-icon",
  "data-inline",
  "data-label",
  "data-part",
  "data-scope",
  "id",
  "role",
  "style",
  "title"
]);

const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "rel", "target"]),
  annotation: new Set(["encoding"]),
  img: new Set(["alt", "decoding", "height", "loading", "src", "width"]),
  math: new Set(["display", "xmlns"]),
  td: new Set(["align", "colspan", "rowspan"]),
  th: new Set(["align", "colspan", "rowspan"])
};

const ALLOWED_STYLE_PROPS = new Set([
  "background-color",
  "border",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-style",
  "border-bottom-width",
  "border-color",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-radius",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-style",
  "border-top-width",
  "border-width",
  "bottom",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "height",
  "left",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "position",
  "right",
  "text-align",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-style",
  "top",
  "vertical-align",
  "white-space",
  "width"
]);

const BLOCKED_STYLE_VALUE =
  /(?:@import|behavior\s*:|expression\s*\(|javascript:|url\s*\(|var\s*\(|-moz-binding|[<>{}])/i;
const DATA_IMAGE = /^data:image\/(?:png|gif|jpe?g|webp);base64,[a-z0-9+/]+=*$/i;

const attrAllowed = (tagName: string, attrName: string) =>
  GLOBAL_ATTRS.has(attrName) || TAG_ATTRS[tagName]?.has(attrName) || false;

const sanitizeStyle = (value: string) => {
  const style = document.createElement("span").style;
  style.cssText = value;

  const safe: string[] = [];

  for (let i = 0; i < style.length; i++) {
    const property = style.item(i).toLowerCase();
    const propertyValue = style.getPropertyValue(property).trim();
    const priority = style.getPropertyPriority(property);

    if (
      ALLOWED_STYLE_PROPS.has(property) &&
      propertyValue &&
      !BLOCKED_STYLE_VALUE.test(propertyValue)
    ) {
      safe.push(`${property}: ${propertyValue}${priority ? ` !${priority}` : ""};`);
    }
  }

  return safe.join(" ");
};

const isSafeUrl = (tagName: string, attrName: string, value: string) => {
  const trimmed = value.trim();

  if (trimmed.startsWith("#")) return true;

  if (tagName === "img" && attrName === "src" && DATA_IMAGE.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed, window.location.origin);

    if (tagName === "a" && attrName === "href") {
      return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
    }

    if (tagName === "img" && attrName === "src") {
      return url.origin === window.location.origin || url.protocol === "https:";
    }
  } catch {
    return false;
  }

  return false;
};

const sanitizeAttribute = (element: Element, attr: Attr) => {
  const tagName = element.tagName.toLowerCase();
  const attrName = attr.name.toLowerCase();

  if (attrName.startsWith("on")) return null;
  if (!attrAllowed(tagName, attrName)) return null;

  const value = attr.value.trim();

  if (["href", "src"].includes(attrName) && !isSafeUrl(tagName, attrName, value)) {
    return null;
  }

  if (attrName === "style") {
    const safeStyle = sanitizeStyle(value);
    return safeStyle ? [attrName, safeStyle] : null;
  }

  if (attrName === "target" && value !== "_blank") return null;

  return [attrName, value] as const;
};

const sanitizeNode = (node: Node, doc: Document): Node | DocumentFragment | null => {
  if (node.nodeType === Node.TEXT_NODE) return doc.createTextNode(node.textContent ?? "");

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  const cleanChildren = () => {
    const fragment = doc.createDocumentFragment();

    element.childNodes.forEach((child) => {
      const safeChild = sanitizeNode(child, doc);
      if (safeChild) fragment.appendChild(safeChild);
    });

    return fragment;
  };

  if (!ALLOWED_TAGS.has(tagName)) return cleanChildren();

  const clean =
    element.namespaceURI && element.namespaceURI !== "http://www.w3.org/1999/xhtml"
      ? doc.createElementNS(element.namespaceURI, tagName)
      : doc.createElement(tagName);

  Array.from(element.attributes).forEach((attr) => {
    const safeAttr = sanitizeAttribute(element, attr);
    if (safeAttr) clean.setAttribute(...safeAttr);
  });

  if (tagName === "a" && clean.getAttribute("target") === "_blank") {
    clean.setAttribute("rel", "noopener noreferrer");
  }

  if (tagName === "img") {
    clean.setAttribute("loading", clean.getAttribute("loading") ?? "lazy");
    clean.setAttribute("decoding", clean.getAttribute("decoding") ?? "async");
  }

  clean.appendChild(cleanChildren());
  return clean;
};

export const sanitizeResumeHtml = (html: string) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return htmlEscape(html);
  }

  const input = document.createElement("template");
  const output = document.createElement("template");

  input.innerHTML = html;

  input.content.childNodes.forEach((child) => {
    const safeChild = sanitizeNode(child, document);
    if (safeChild) output.content.appendChild(safeChild);
  });

  return output.innerHTML;
};

const UNSAFE_STYLESHEET_PATTERNS = [
  /@import[^;]+;?/gi,
  /-moz-binding\s*:[^;}]+[;}]?/gi,
  /behavior\s*:[^;}]+[;}]?/gi,
  /expression\s*\([^)]*\)/gi,
  /url\([^)]*\)/gi,
  /<\/?style[^>]*>/gi,
  /<!--[\s\S]*?-->/g
];

export const sanitizeResumeCss = (css: string) =>
  UNSAFE_STYLESHEET_PATTERNS.reduce(
    (safeCss, pattern) => safeCss.replace(pattern, ""),
    css
  );
