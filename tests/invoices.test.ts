import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, listInvoicesForUser, deleteUserAccount } from "@/lib/db";
import pool from "@/lib/db";
import { issueGstInvoice } from "@/lib/invoices";

afterAll(async () => {
  await pool.end();
});

const base = (userId: string) => ({
  userId,
  buyerName: "Test Buyer",
  buyerEmail: `buyer-${userId}@example.com`,
  buyerCountry: "IN",
  description: "Lettr Pro - Monthly",
  currency: "INR",
  total: 69900,
});

describe("GST invoices", () => {
  it("numbers invoices in order within a financial year", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `inv-${userId}@example.com`, passwordHash: "x" });
    // A far-future year keeps this test independent of other runs.
    const when = new Date("2099-06-01T06:00:00Z");
    const a = await issueGstInvoice({ ...base(userId), paymentRef: `pay-${randomUUID()}`, issuedAt: when });
    const b = await issueGstInvoice({ ...base(userId), paymentRef: `pay-${randomUUID()}`, issuedAt: when });
    expect(a!.financial_year).toBe("2099-00");
    expect(b!.serial).toBe(a!.serial + 1);
    expect(b!.number).toMatch(/^LTR\/2099-00\/\d{4}$/);
    expect(a!.seller_gstin).toBe("09AALCN4402B1ZS");
  });

  it("never creates two invoices for the same payment", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `inv-${userId}@example.com`, passwordHash: "x" });
    const ref = `pay-${randomUUID()}`;
    const first = await issueGstInvoice({ ...base(userId), paymentRef: ref });
    const again = await issueGstInvoice({ ...base(userId), paymentRef: ref });
    expect(again!.id).toBe(first!.id);
    expect(await listInvoicesForUser(userId)).toHaveLength(1);
  });

  it("uses IGST for a business buyer in another state, from their GSTIN", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `inv-${userId}@example.com`, passwordHash: "x" });
    const inv = await issueGstInvoice({ ...base(userId), buyerGstin: "27AAPFU0939F1ZV", paymentRef: `pay-${randomUUID()}` });
    expect(inv!.tax_type).toBe("inter");
    expect(inv!.buyer_state_code).toBe("27");
    expect(inv!.igst + inv!.taxable).toBe(69900);
  });

  it("keeps the invoice when the account is deleted (tax records)", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `inv-${userId}@example.com`, passwordHash: "x" });
    const inv = await issueGstInvoice({ ...base(userId), paymentRef: `pay-${randomUUID()}` });
    await deleteUserAccount(userId);
    const res = await pool.query("SELECT user_id, buyer_email FROM invoices WHERE id = $1", [inv!.id]);
    expect(res.rows[0].user_id).toBeNull();
    expect(res.rows[0].buyer_email).toBe(`buyer-${userId}@example.com`);
  });
});
