import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getInvoiceById } from "@/lib/db";
import { InvoicePdf } from "@/components/InvoicePdf";

export const runtime = "nodejs";

/** Download one GST invoice as a PDF. Only its owner (or the admin) can get it. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  const userId = (session.user as { id: string }).id;
  if (!invoice || (invoice.user_id !== userId && !isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buffer = await renderToBuffer(InvoicePdf({ invoice }));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Lettr-invoice-${invoice.number.replace(/\//g, "-")}.pdf"`,
    },
  });
}
