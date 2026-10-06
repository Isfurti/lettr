import fs from "node:fs";
import path from "node:path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { COMPANY } from "@/lib/company";
import { GST_STATES, formatMoney, rupeesInWords } from "@/lib/gst";
import { invoicePdfFont } from "@/lib/pdf-fonts";
import type { InvoiceRow } from "@/lib/db";

const INK = "#041632";
const MUTED = "#4B5563";
const RULE = "#D9DEEA";
const BLUE = "#2F5BEA";

function logo(): { data: Buffer; format: "png" } | null {
  try {
    return { data: fs.readFileSync(path.join(process.cwd(), "public", COMPANY.logoPath)), format: "png" };
  } catch {
    return null;
  }
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** A GST tax invoice (or export invoice for buyers outside India) for one Lettr payment. */
export function InvoicePdf({ invoice, sample = false }: { invoice: InvoiceRow; sample?: boolean }) {
  const font = invoicePdfFont();
  const s = StyleSheet.create({
    page: { padding: 36, fontFamily: font, fontSize: 9.5, color: INK, lineHeight: 1.35 },
    label: { fontSize: 7.5, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
    th: { fontSize: 8, fontWeight: 700, color: "#ffffff" },
    cell: { paddingVertical: 6, paddingHorizontal: 6 },
    right: { textAlign: "right" },
  });
  // "Rs." rather than the ₹ sign: the rupee glyph isn't reliable across PDF fonts and viewers.
  const money = (n: number) => formatMoney(n, invoice.currency).replace("₹", "Rs. ");
  const isExport = invoice.tax_type === "export";
  const placeOfSupply = isExport
    ? `Outside India (${invoice.buyer_country})`
    : `${GST_STATES[invoice.buyer_state_code || COMPANY.stateCode] ?? "India"} (${invoice.buyer_state_code || COMPANY.stateCode})`;
  const img = logo();
  const taxRows: [string, number][] = isExport
    ? []
    : invoice.tax_type === "intra"
    ? [["CGST @ 9%", invoice.cgst], ["SGST @ 9%", invoice.sgst]]
    : [["IGST @ 18%", invoice.igst]];

  return (
    <Document title={`Invoice ${invoice.number}`} author={COMPANY.legalName}>
      <Page size="A4" style={s.page}>
        {sample && (
          <Text style={{ position: "absolute", top: 300, left: 120, fontSize: 64, color: "#EEF0F5", transform: "rotate(-30deg)" }}>
            SAMPLE
          </Text>
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center", maxWidth: 300 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            {img && <Image src={img} style={{ width: 34, height: 50 }} />}
            <View>
              <Text style={{ fontSize: 13, fontWeight: 700 }}>{COMPANY.legalName}</Text>
              {COMPANY.addressLines.map((l) => (
                <Text key={l} style={{ color: MUTED }}>{l}</Text>
              ))}
              <Text style={{ color: MUTED }}>GSTIN: {invoice.seller_gstin}</Text>
              <Text style={{ color: MUTED }}>{COMPANY.contactEmail}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{isExport ? "INVOICE" : "TAX INVOICE"}</Text>
            <Text style={{ marginTop: 4 }}>No. {invoice.number}</Text>
            <Text style={{ color: MUTED }}>Date: {fmtDate(invoice.issued_at)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 24, marginTop: 22, paddingTop: 12, borderTop: `1 solid ${RULE}` }}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Billed to</Text>
            <Text style={{ fontWeight: 700 }}>{invoice.buyer_name || invoice.buyer_email}</Text>
            {invoice.buyer_name ? <Text style={{ color: MUTED }}>{invoice.buyer_email}</Text> : null}
            {invoice.buyer_gstin ? <Text style={{ color: MUTED }}>GSTIN: {invoice.buyer_gstin}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Place of supply</Text>
            <Text>{placeOfSupply}</Text>
            <Text style={[s.label, { marginTop: 8 }]}>Reverse charge</Text>
            <Text>No</Text>
          </View>
        </View>

        <View style={{ marginTop: 18, border: `1 solid ${RULE}`, borderRadius: 4 }}>
          <View style={{ flexDirection: "row", backgroundColor: INK }}>
            <Text style={[s.th, s.cell, { flex: 4 }]}>Description</Text>
            <Text style={[s.th, s.cell, { flex: 1.2 }]}>SAC</Text>
            <Text style={[s.th, s.cell, { flex: 0.7 }, s.right]}>Qty</Text>
            <Text style={[s.th, s.cell, { flex: 1.6 }, s.right]}>Taxable value</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={[s.cell, { flex: 4 }]}>{invoice.description}</Text>
            <Text style={[s.cell, { flex: 1.2 }]}>{invoice.sac}</Text>
            <Text style={[s.cell, { flex: 0.7 }, s.right]}>1</Text>
            <Text style={[s.cell, { flex: 1.6 }, s.right]}>{money(invoice.taxable)}</Text>
          </View>
        </View>

        <View style={{ alignSelf: "flex-end", width: 240, marginTop: 10 }}>
          {[["Taxable value", invoice.taxable] as [string, number], ...taxRows].map(([k, v]) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
              <Text style={{ color: MUTED }}>{k}</Text>
              <Text>{money(v)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 6, marginTop: 4, borderTop: `1 solid ${INK}` }}>
            <Text style={{ fontWeight: 700 }}>Total paid</Text>
            <Text style={{ fontWeight: 700 }}>{money(invoice.total)}</Text>
          </View>
        </View>

        {invoice.currency === "INR" && (
          <Text style={{ marginTop: 12 }}>
            Amount in words: Rupees {rupeesInWords(Math.floor(invoice.total / 100))}
            {invoice.total % 100 ? ` and ${rupeesInWords(invoice.total % 100)} Paise` : ""} Only
          </Text>
        )}
        {isExport && (
          <Text style={{ marginTop: 12, color: MUTED }}>
            Supply meant for export of services under LUT without payment of integrated tax (IGST).
          </Text>
        )}

        <View style={{ marginTop: 28, paddingTop: 10, borderTop: `1 solid ${RULE}`, color: MUTED, fontSize: 8 }}>
          <Text>Paid online. Thank you for choosing {COMPANY.productName}.</Text>
          <Text>This is a computer-generated invoice and does not need a signature.</Text>
        </View>
      </Page>
    </Document>
  );
}
