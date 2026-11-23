import { createHash } from "node:crypto";

/**
 * Checks and cleans a profile picture before it is stored or served.
 *
 * Only JPEG is accepted (the browser always sends one, see ProfilePhotoUpload).
 * The file is read segment by segment: the picture data and its quantisation
 * and Huffman tables are kept, and everything that can carry personal data or
 * script is dropped (EXIF with GPS and camera, XMP, ICC, comments). Size and
 * dimensions are capped. Nothing is decoded or re-encoded, so no image library
 * is needed and a malformed file simply fails the checks.
 */
export const MAX_PHOTO_BYTES = 200_000;
export const MAX_PHOTO_SIDE = 1024;
export const MIN_PHOTO_SIDE = 64;

export type PhotoResult =
  | { ok: true; buffer: Buffer; mime: "image/jpeg"; etag: string; width: number; height: number }
  | { ok: false; error: string };

const fail = (error: string): PhotoResult => ({ ok: false, error });

export function sanitizeProfilePhoto(input: Buffer): PhotoResult {
  if (input.length === 0) return fail("That file is empty.");
  if (input.length > MAX_PHOTO_BYTES * 2) return fail("That picture is too large.");
  if (input[0] !== 0xff || input[1] !== 0xd8 || input[2] !== 0xff) return fail("Upload a JPEG picture.");

  const kept: Buffer[] = [Buffer.from([0xff, 0xd8])];
  let pos = 2;
  let width = 0;
  let height = 0;
  let sawScan = false;

  while (pos < input.length) {
    if (input[pos] !== 0xff) return fail("That picture could not be read.");
    while (input[pos] === 0xff) pos++; // fill bytes
    const marker = input[pos++];
    if (marker === undefined) return fail("That picture could not be read.");

    if (marker === 0xd9) break; // end of image
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue; // markers without a length

    if (pos + 2 > input.length) return fail("That picture could not be read.");
    const len = input.readUInt16BE(pos);
    if (len < 2 || pos + len > input.length) return fail("That picture could not be read.");
    const segment = input.subarray(pos - 2, pos + len); // marker bytes + length + payload

    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (len < 8) return fail("That picture could not be read.");
      height = input.readUInt16BE(pos + 3);
      width = input.readUInt16BE(pos + 5);
    }

    // APP0 (JFIF) and the picture structure stay. Other APPn, comments and everything unknown are dropped.
    const keep = marker === 0xe0 || marker === 0xdb || marker === 0xc4 || marker === 0xdd || isSof || marker === 0xda;
    if (keep) kept.push(segment);
    pos += len;

    if (marker === 0xda) {
      // Entropy-coded data runs to the next real marker (an 0xFF that is not 0x00 or a restart).
      sawScan = true;
      const start = pos;
      while (pos < input.length) {
        if (input[pos] === 0xff && input[pos + 1] !== 0x00 && !(input[pos + 1] >= 0xd0 && input[pos + 1] <= 0xd7)) break;
        pos++;
      }
      kept.push(input.subarray(start, pos));
    }
  }

  if (!sawScan || !width || !height) return fail("That picture could not be read.");
  if (width > MAX_PHOTO_SIDE || height > MAX_PHOTO_SIDE) return fail(`Use a picture no larger than ${MAX_PHOTO_SIDE} pixels on a side.`);
  if (width < MIN_PHOTO_SIDE || height < MIN_PHOTO_SIDE) return fail("That picture is too small.");

  kept.push(Buffer.from([0xff, 0xd9]));
  const buffer = Buffer.concat(kept);
  if (buffer.length > MAX_PHOTO_BYTES) return fail("That picture is too large. Try a smaller one.");
  const etag = createHash("sha256").update(buffer).digest("hex").slice(0, 24);
  return { ok: true, buffer, mime: "image/jpeg", etag, width, height };
}
