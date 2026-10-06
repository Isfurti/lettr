import { cloneElement, createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { hasRich, parseRich } from "./rich-text";
import type { PageSize, PhotoShape } from "./layout";

/**
 * Applies the Design panel's shared settings to a template after it is
 * built, so all 16 templates get them without each one being rewritten:
 *
 * - PDF: scales every size (text, margins, padding, gaps, widths) for
 *   Spacing / "Fit to one page", sets the page size, the photo shape, and
 *   turns <b>/<i>/<u> into real bold, italic and underlined text.
 *
 * (The live preview draws formatting with components/templates/Rich.tsx.)
 *
 * It walks the element tree and calls the template's small helper
 * components directly, so those helpers must stay plain functions with no
 * hooks (they all are: templates are pure renders of the resume data).
 */

type AnyProps = Record<string, unknown> & { children?: ReactNode; style?: unknown };

const SCALED_KEYS = new Set([
  "fontSize",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingHorizontal",
  "paddingVertical",
  "gap",
  "rowGap",
  "columnGap",
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "top",
  "bottom",
  "left",
  "right",
  "borderRadius",
  "letterSpacing",
  "flexBasis",
]);

function scaleStyle(style: unknown, k: number): unknown {
  if (k === 1 || !style) return style;
  if (Array.isArray(style)) return style.map((s) => scaleStyle(s, k));
  if (typeof style !== "object") return style;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(style as Record<string, unknown>)) {
    out[key] = typeof v === "number" && SCALED_KEYS.has(key) ? Math.round(v * k * 100) / 100 : v;
  }
  return out;
}

function flatStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatStyle));
  return typeof style === "object" ? (style as Record<string, unknown>) : {};
}

function richPdf(text: string, fontSize?: number): ReactNode {
  if (!hasRich(text)) return text;
  return parseRich(text).map((s, i) =>
    s.b || s.i || s.u
      ? createElement(
          "TEXT",
          {
            key: `r${i}`,
            style: {
              // Spelled out: react-pdf measures nested runs at its default
              // size otherwise, which leaves a gap under the line.
              ...(fontSize ? { fontSize } : {}),
              ...(s.b ? { fontWeight: 700 } : {}),
              ...(s.i ? { fontStyle: "italic" } : {}),
              ...(s.u ? { textDecoration: "underline" } : {}),
            },
          },
          s.text
        )
      : s.text
  );
}

export type PdfLayout = { scale: number; pageSize: PageSize; photoShape: PhotoShape };

/** Applies spacing, page size, photo shape and B/I/U to a react-pdf document tree. */
export function transformPdf(node: ReactNode, opts: PdfLayout, inText = false, fontSize?: number): ReactNode {
  if (node === null || node === undefined || typeof node === "boolean") return node;
  if (typeof node === "string") return inText ? richPdf(node, fontSize) : node;
  if (typeof node === "number") return node;
  if (Array.isArray(node)) return node.map((n) => transformPdf(n, opts, inText, fontSize));
  if (!isValidElement(node)) return node;

  const el = node as ReactElement<AnyProps>;
  if (el.type === Fragment) {
    return createElement(Fragment, { key: el.key }, transformPdf(el.props.children, opts, inText, fontSize));
  }
  if (typeof el.type === "function") {
    const render = el.type as (p: AnyProps) => ReactNode;
    const out = transformPdf(render(el.props), opts, inText, fontSize);
    return el.key === null ? out : createElement(Fragment, { key: el.key }, out);
  }
  if (typeof el.type !== "string") return el;

  const type = el.type;
  const props: AnyProps = { ...el.props };
  if (props.style) props.style = scaleStyle(props.style, opts.scale);
  if (type === "PAGE") props.size = opts.pageSize;
  if (type === "IMAGE" && opts.photoShape !== "circle") {
    const st = flatStyle(props.style);
    const w = typeof st.width === "number" ? st.width : 56;
    const radius = opts.photoShape === "square" ? 2 : Math.round(w * 0.18);
    props.style = [props.style ?? {}, { borderRadius: radius }].flat();
  }
  // Track the font size this element passes down (react-pdf's default is 12).
  const own = flatStyle(props.style).fontSize;
  const size = typeof own === "number" ? own : type === "PAGE" ? 12 * opts.scale : fontSize;
  if (type === "PAGE" && typeof own !== "number") props.style = [props.style ?? {}, { fontSize: size }].flat();
  // react-pdf works out a Text's line height from its own font size, not
  // the inherited one, so a Text with lineHeight but no fontSize was spaced
  // like 18pt type (the double-spaced bullets in Classic and Modern). Every
  // Text gets the size it inherits spelled out.
  if (type === "TEXT" && typeof own !== "number" && size) {
    props.style = [props.style ?? {}, { fontSize: size }].flat();
  }
  const children = transformPdf(el.props.children, opts, type === "TEXT" || inText, size);
  return cloneElement(el, props, ...(Array.isArray(children) ? children : [children]));
}
