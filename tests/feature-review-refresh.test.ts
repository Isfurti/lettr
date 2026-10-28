import { describe, it, expect, vi } from "vitest";

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/admin-auth", () => ({ requireAdminApi: async () => ({ id: "admin", email: "a@example.com" }) }));
vi.mock("@/lib/db", () => ({ setReviewFeatured: async () => ({ ok: true }), logAdminAction: async () => undefined }));

import { POST } from "@/app/api/admin/reviews/[id]/feature/route";

describe("featuring a review", () => {
  it("refreshes the homepage and the reviews page straight away", async () => {
    const res = await POST(
      new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ featured: true }) }),
      { params: Promise.resolve({ id: "r1" }) }
    );
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/reviews");
  });
});
