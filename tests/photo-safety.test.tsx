import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { safePhotoDataUrl } from "@/lib/safe-photo";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { TEMPLATE_IDS } from "@/lib/templates";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("safePhotoDataUrl", () => {
  it("keeps small inline images", () => {
    expect(safePhotoDataUrl(PNG)).toBe(PNG);
    expect(safePhotoDataUrl(PNG.replace("png", "jpeg"))).toBeDefined();
  });
  it("drops URLs, local paths, objects, svg, and oversized values", () => {
    for (const bad of ["http://127.0.0.1/x.png", "https://example.com/a.png", "/etc/passwd", "file:///etc/passwd", "data:image/svg+xml;base64,PHN2Zz4=", "data:text/html;base64,AAAA", { uri: "http://x", method: "POST" }, 42, null, undefined, `data:image/png;base64,${"A".repeat(1_600_000)}`]) {
      expect(safePhotoDataUrl(bad)).toBeUndefined();
    }
  });
});

describe("PDF rendering never fetches a client-supplied photo address", () => {
  let server: http.Server;
  let hits = 0;
  let url = "";
  beforeAll(async () => {
    server = http.createServer((_req, res) => {
      hits++;
      res.end("x");
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/photo.png`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it("every template renders without touching the address", async () => {
    for (const template of TEMPLATE_IDS) {
      const resume = { ...SAMPLE_RESUME, customization: { ...SAMPLE_RESUME.customization, showPhoto: true, photoDataUrl: url } };
      const pdf = await renderToBuffer(ResumePdfDocument({ resume, template }));
      expect(pdf.length).toBeGreaterThan(500);
    }
    expect(hits).toBe(0);
  }, 120000);
});
