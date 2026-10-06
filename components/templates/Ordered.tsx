import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import type { ResumeCustomization } from "@/lib/types";
import { sectionOrder, type SectionKey } from "@/lib/layout";

/**
 * Section ordering shared by every template, in the preview and the PDF.
 * (Hidden sections are emptied earlier, in applyLayout, so they draw nothing.)
 *
 * A template wraps each of its sections in <Sec k="..."> and puts them inside
 * <Ordered>. Ordered draws the sections in the user's chosen order, in the
 * place where the first one was; anything that isn't a Sec (the header, a
 * spacer) stays where it is.
 */
export function Sec({ children }: { k: SectionKey; children?: ReactNode }) {
  return <>{children}</>;
}

type SecElement = ReactElement<{ k: SectionKey; children?: ReactNode }>;

export function Ordered({ c, children }: { c: ResumeCustomization | undefined; children?: ReactNode }) {
  // Until the user picks an order, each template keeps its own (Scholar and
  // Fresher put education first on purpose).
  if (!c?.sectionOrder?.length) return <>{children}</>;
  const order = sectionOrder(c);
  const items = Children.toArray(children);
  const isSec = (x: unknown): x is SecElement => isValidElement(x) && x.type === Sec;
  const secs = items.filter(isSec).sort((a, b) => order.indexOf(a.props.k) - order.indexOf(b.props.k));
  const out: ReactNode[] = [];
  let placed = false;
  for (const item of items) {
    if (isSec(item)) {
      if (!placed) {
        out.push(...secs);
        placed = true;
      }
    } else out.push(item);
  }
  return <>{out}</>;
}
