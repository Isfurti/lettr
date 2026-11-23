import { describe, it, expect } from "vitest";
import { sanitizeProfilePhoto, MAX_PHOTO_BYTES } from "@/lib/profile-photo";

const seg = (marker: number, payload: Buffer) => {
  const len = Buffer.alloc(2);
  len.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, marker]), len, payload]);
};

function jpeg(opts: { w?: number; h?: number; extra?: Buffer[]; scan?: Buffer } = {}) {
  const { w = 512, h = 512, extra = [], scan = Buffer.from([1, 2, 3, 4, 0xff, 0x00, 5, 6]) } = opts;
  const sof = Buffer.alloc(15);
  sof[0] = 8;
  sof.writeUInt16BE(h, 1);
  sof.writeUInt16BE(w, 3);
  sof[5] = 3;
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    seg(0xe0, Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0")),
    ...extra,
    seg(0xdb, Buffer.alloc(65, 1)),
    seg(0xc0, sof),
    seg(0xc4, Buffer.alloc(20, 2)),
    seg(0xda, Buffer.alloc(10, 3)),
    scan,
    Buffer.from([0xff, 0xd9]),
  ]);
}

describe("sanitizeProfilePhoto", () => {
  it("accepts a normal JPEG and reports its size", () => {
    const r = sanitizeProfilePhoto(jpeg());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.width).toBe(512);
      expect(r.mime).toBe("image/jpeg");
      expect(r.etag).toMatch(/^[0-9a-f]{24}$/);
    }
  });

  it("strips EXIF/GPS, XMP, comments and ICC but keeps the picture data", () => {
    const secret = Buffer.from("Exif\0\0GPSSECRET-LAT-12.97");
    const r = sanitizeProfilePhoto(jpeg({ extra: [seg(0xe1, secret), seg(0xfe, Buffer.from("COMMENTSECRET")), seg(0xe2, Buffer.from("ICCSECRET"))] }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      const text = r.buffer.toString("latin1");
      expect(text).not.toContain("GPSSECRET");
      expect(text).not.toContain("COMMENTSECRET");
      expect(text).not.toContain("ICCSECRET");
      expect(r.buffer.includes(Buffer.from([1, 2, 3, 4, 0xff, 0x00, 5, 6]))).toBe(true);
      expect(r.buffer.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
      expect(r.buffer.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]));
    }
  });

  it("rejects things that are not JPEGs", () => {
    expect(sanitizeProfilePhoto(Buffer.from("<svg onload=alert(1)/>")).ok).toBe(false);
    expect(sanitizeProfilePhoto(Buffer.from("GIF89a....")).ok).toBe(false);
    expect(sanitizeProfilePhoto(Buffer.from([0x89, 0x50, 0x4e, 0x47])).ok).toBe(false);
    expect(sanitizeProfilePhoto(Buffer.alloc(0)).ok).toBe(false);
  });

  it("rejects truncated or scan-less files", () => {
    expect(sanitizeProfilePhoto(jpeg().subarray(0, 30)).ok).toBe(false);
    expect(sanitizeProfilePhoto(Buffer.from([0xff, 0xd8, 0xff, 0xd9])).ok).toBe(false);
  });

  it("enforces dimension and size limits", () => {
    expect(sanitizeProfilePhoto(jpeg({ w: 4000, h: 3000 })).ok).toBe(false);
    expect(sanitizeProfilePhoto(jpeg({ w: 16, h: 16 })).ok).toBe(false);
    expect(sanitizeProfilePhoto(jpeg({ scan: Buffer.alloc(MAX_PHOTO_BYTES + 10, 7) })).ok).toBe(false);
  });
});
