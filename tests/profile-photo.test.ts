import { describe, it, expect } from "vitest";
import { sanitizeProfilePhoto, MAX_PHOTO_BYTES } from "@/lib/profile-photo";
import { PHOTO_FIXTURES } from "./fixtures-profile-photo";

const fixture = (k: keyof typeof PHOTO_FIXTURES) => Buffer.from(PHOTO_FIXTURES[k], "base64");

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
  sof.set([1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1], 6);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    seg(0xe0, Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0")),
    ...extra,
    seg(0xdb, Buffer.concat([Buffer.from([0]), Buffer.alloc(64, 1)])),
    seg(0xc0, sof),
    seg(0xc4, Buffer.concat([Buffer.from([0x00]), Buffer.from([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), Buffer.from([7])])),
    seg(0xda, Buffer.from([3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0])),
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
    // no end-of-image marker: refused, so trailing text can never ride along
    expect(sanitizeProfilePhoto(jpeg().subarray(0, -2)).ok).toBe(false);
  });

  it("enforces dimension and size limits", () => {
    expect(sanitizeProfilePhoto(jpeg({ w: 4000, h: 3000 })).ok).toBe(false);
    expect(sanitizeProfilePhoto(jpeg({ w: 16, h: 16 })).ok).toBe(false);
    expect(sanitizeProfilePhoto(jpeg({ scan: Buffer.alloc(MAX_PHOTO_BYTES + 10, 7) })).ok).toBe(false);
  });

  it("writes its own JFIF header: a thumbnail or text in the original APP0 is gone", () => {
    const jfxx = seg(0xe0, Buffer.concat([Buffer.from("JFXX\0\x10"), Buffer.from("THUMBSECRET")]));
    const r = sanitizeProfilePhoto(jpeg({ extra: [jfxx] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.buffer.toString("latin1")).not.toContain("THUMBSECRET");
  });

  it("drops everything after the end of image", () => {
    const r = sanitizeProfilePhoto(Buffer.concat([jpeg(), Buffer.from("TRAILERSECRET motion-photo video")]));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.buffer.toString("latin1")).not.toContain("TRAILERSECRET");
  });

  it("refuses odd structure: two frames, scan before frame, many scans, unknown markers, bad lengths", () => {
    const base = jpeg();
    const sofSeg = (w: number, h: number) => {
      const sof = Buffer.alloc(15);
      sof[0] = 8; sof.writeUInt16BE(h, 1); sof.writeUInt16BE(w, 3); sof[5] = 3;
      sof.set([1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1], 6);
      return seg(0xc0, sof);
    };
    // second frame header after a huge first one
    expect(sanitizeProfilePhoto(jpeg({ extra: [sofSeg(60000, 60000)] })).ok).toBe(false);
    // two frame headers
    expect(sanitizeProfilePhoto(jpeg({ extra: [sofSeg(512, 512)] })).ok).toBe(false);
    // DNL and an arithmetic-coded frame type
    expect(sanitizeProfilePhoto(jpeg({ extra: [seg(0xdc, Buffer.from([0, 9]))] })).ok).toBe(false);
    expect(sanitizeProfilePhoto(jpeg({ extra: [seg(0xc9, Buffer.alloc(15))] })).ok).toBe(false);
    // quantisation table with extra bytes appended
    expect(sanitizeProfilePhoto(jpeg({ extra: [seg(0xdb, Buffer.concat([Buffer.from([0]), Buffer.alloc(64, 1), Buffer.from("SECRET")]))] })).ok).toBe(false);
    // too many scans
    const scan = Buffer.concat([seg(0xda, Buffer.from([3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0])), Buffer.from([1, 2])]);
    const many = Buffer.concat([base.subarray(0, base.length - 2), ...Array.from({ length: 20 }, () => scan), Buffer.from([0xff, 0xd9])]);
    expect(sanitizeProfilePhoto(many).ok).toBe(false);
    // scan before any frame header
    expect(sanitizeProfilePhoto(Buffer.concat([Buffer.from([0xff, 0xd8]), scan, Buffer.from([0xff, 0xd9])])).ok).toBe(false);
  });

  it("keeps restart markers inside the scan data", () => {
    const withRst = jpeg({ scan: Buffer.from([1, 2, 0xff, 0xd0, 3, 4, 0xff, 0xd1, 5]) });
    const r = sanitizeProfilePhoto(withRst);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.buffer.includes(Buffer.from([1, 2, 0xff, 0xd0, 3, 4, 0xff, 0xd1, 5]))).toBe(true);
  });
});

describe("sanitizeProfilePhoto with real JPEGs", () => {
  it("passes plain and progressive photos unchanged in size class", () => {
    for (const k of ["baseline", "progressive"] as const) {
      const r = sanitizeProfilePhoto(fixture(k));
      expect(r.ok).toBe(true);
      if (r.ok) expect([r.width, r.height]).toEqual([128, 96]);
    }
  });

  it("removes camera, GPS and comment data from a real EXIF photo", () => {
    const original = fixture("exif");
    expect(original.toString("latin1")).toContain("CameraSECRET");
    const r = sanitizeProfilePhoto(original);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const text = r.buffer.toString("latin1");
      expect(text).not.toContain("CameraSECRET");
      expect(text).not.toContain("COMMENTSECRET");
      expect(text).not.toContain("Exif");
    }
  });
});
