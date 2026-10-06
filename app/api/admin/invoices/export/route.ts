import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { listInvoices } from "@/lib/db";

export const runtime = "nodejs";

const csvCell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rupees = (paise: number) => (paise / 100).toFixed(2);

/** Monthly invoice register as CSV, for GST filing. ?month=2026-10 */
export async function GET(req: Request) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Use ?month=YYYY-MM" }, { status: 400 });
  const rows = await listInvoices(month);
  const header = [
    "Invoice number", "Date", "Buyer name", "Buyer email", "Buyer GSTIN", "Place of supply (state code)", "Buyer country",
    "Type", "SAC", "Currency", "Taxable value", "CGST", "SGST", "IGST", "Total", "Payment reference",
  ];
  const lines = rows.map((r) =>
    [
      r.number,
      new Date(r.issued_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
      r.buyer_name, r.buyer_email, r.buyer_gstin, r.buyer_state_code, r.buyer_country,
      r.tax_type === "intra" ? "B2C/B2B intra-state" : r.tax_type === "inter" ? "Inter-state" : "Export",
      r.sac, r.currency, rupees(r.taxable), rupees(r.cgst), rupees(r.sgst), rupees(r.igst), rupees(r.total), r.payment_ref,
    ].map(csvCell).join(",")
  );
  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="lettr-invoices-${month}.csv"` },
  });
}
