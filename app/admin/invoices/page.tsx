import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listInvoices } from "@/lib/db";
import { SELLER, getGstConfig } from "@/lib/company";
import { formatMoney } from "@/lib/gst";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminStatCard } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "Invoices | Lettr Admin" };

const monthNow = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);

export default async function AdminInvoicesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const { month: m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : monthNow();
  const rows = await listInvoices(month);
  const config = getGstConfig();
  const inr = rows.filter((r) => r.currency === "INR");
  const sum = (k: "total" | "taxable" | "cgst" | "sgst" | "igst") => inr.reduce((a, r) => a + r[k], 0);
  const shift = (delta: number) => {
    const [y, mo] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
    return d.toISOString().slice(0, 7);
  };
  const label = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  const pill = "inline-flex items-center min-h-10 px-4 rounded-full text-sm font-bold";

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Invoices</h1>
        <p className="text-slate mb-6">
          {SELLER && config
            ? `GST invoices issued by ${SELLER.legalName} · GSTIN ${config.gstin} · SAC ${config.sac} · numbers like ${config.invoicePrefix}/2026-27/0001`
            : "Invoicing is off until Lettr's own company and GSTIN are set up. The sample shows the layout with placeholder details."}
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link href={`/admin/invoices?month=${shift(-1)}`} className={`${pill} bg-white border-2 border-rule hover:border-ink`}>← Previous</Link>
          <span className={`${pill} bg-ink text-white`}>{label}</span>
          <Link href={`/admin/invoices?month=${shift(1)}`} className={`${pill} bg-white border-2 border-rule hover:border-ink`}>Next →</Link>
          <a href={`/api/admin/invoices/export?month=${month}`} className={`${pill} bg-brand-blue text-white ml-auto`}>
            Download {label} for GST filing (CSV)
          </a>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <AdminStatCard label="Invoices" value={String(rows.length)} sub={`${inr.length} in rupees`} />
          <AdminStatCard label="Taxable value (₹)" value={formatMoney(sum("taxable"), "INR")} />
          <AdminStatCard label="CGST + SGST" value={formatMoney(sum("cgst") + sum("sgst"), "INR")} />
          <AdminStatCard label="IGST" value={formatMoney(sum("igst"), "INR")} />
        </div>

        <div className="bg-white border border-rule rounded-[24px] overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate bg-sand">
                {["Number", "Date", "Customer", "Type", "Taxable", "Tax", "Total", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate">
                    No invoices in {label}. They&apos;re created automatically when a payment succeeds.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-rule">
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{r.number}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(r.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{r.buyer_name || r.buyer_email}</p>
                      <p className="text-xs text-slate">{r.buyer_gstin ? `GSTIN ${r.buyer_gstin}` : r.buyer_email}</p>
                    </td>
                    <td className="px-4 py-3">{r.tax_type === "intra" ? "CGST+SGST" : r.tax_type === "inter" ? "IGST" : "Export"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatMoney(r.taxable, r.currency)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatMoney(r.cgst + r.sgst + r.igst, r.currency)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold">{formatMoney(r.total, r.currency)}</td>
                    <td className="px-4 py-3">
                      <a href={`/api/invoices/${r.id}/pdf`} className="inline-flex items-center min-h-10 font-bold text-brand-blue hover:underline">PDF</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-white border border-rule rounded-[24px] p-5">
          <p className="font-extrabold">Preview the invoice layout</p>
          <p className="text-sm text-slate mt-1">Sample invoices with made-up numbers. Nothing is saved.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[["intra", "Uttar Pradesh customer (CGST+SGST)"], ["inter", "Other state (IGST)"], ["export", "Outside India (export)"]].map(([k, l]) => (
              <a key={k} href={`/api/admin/invoices/sample?kind=${k}`} target="_blank" rel="noreferrer" className={`${pill} bg-white border-2 border-rule hover:border-ink`}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
