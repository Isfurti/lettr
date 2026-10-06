import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdminApi } from "@/lib/admin-auth";
import { sampleInvoice } from "@/lib/invoices";
import { InvoicePdf } from "@/components/InvoicePdf";

export const runtime = "nodejs";

/** Admin-only preview of the invoice layout with made-up numbers. Nothing is saved. */
export async function GET(req: Request) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const kind = new URL(req.url).searchParams.get("kind");
  const invoice = sampleInvoice(kind === "inter" || kind === "export" ? kind : "intra");
  const buffer = await renderToBuffer(InvoicePdf({ invoice, sample: true }));
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="sample-invoice.pdf"` },
  });
}
