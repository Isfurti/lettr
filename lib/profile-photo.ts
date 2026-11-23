import { createHash } from "node:crypto";

/**
 * Checks and cleans a profile picture before it is stored or served.
 *
 * Only JPEG is accepted. The file is rebuilt from a whitelist, never copied
 * through: a fresh JFIF header is written (any thumbnail in the original is
 * gone), the quantisation and Huffman tables, the single frame header and the
 * scan data are kept after their lengths are checked, and everything else is
 * dropped or rejected (EXIF with GPS and camera, XMP, ICC, comments, extra
 * frames, anything after the end of image). Size, dimensions and the number of
 * scans are capped so a hostile file cannot become a decompression bomb for
 * the people who open the page. Nothing is decoded, so no image library is
 * needed; the scan data itself is passed through unchanged.
 *
 * The browser sends a picture it has already resized (see the upload
 * component); this runs again on the server because API callers skip the browser.
 */
export const MAX_PHOTO_BYTES = 200_000;
/** What may be sent in one upload, picture plus form overhead. */
export const MAX_UPLOAD_BYTES = 450_000;
export const MAX_PHOTO_SIDE = 1024;
export const MIN_PHOTO_SIDE = 64;
const MAX_SCANS = 16;
const MAX_TABLES = 24;

export type PhotoResult =
  | { ok: true; buffer: Buffer; mime: "image/jpeg"; etag: string; width: number; height: number }
  | { ok: false; error: string };

const BAD = "That picture could not be read. Try saving it again as a JPEG.";
const fail = (error: string): PhotoResult => ({ ok: false, error });

/** A fixed JFIF header: version 1.01, no density, no thumbnail. */
const JFIF = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);

/** DQT: one or more tables, each 1 byte (precision/id) + 64 or 128 bytes. */
function dqtValid(p: Buffer): boolean {
  let i = 0;
  while (i < p.length) {
    const prec = p[i] >> 4;
    const id = p[i] & 0x0f;
    if (prec > 1 || id > 3) return false;
    i += 1 + (prec ? 128 : 64);
  }
  return i === p.length && p.length > 0;
}

/** DHT: one or more tables, each 1 byte + 16 counts + that many symbols. */
function dhtValid(p: Buffer): boolean {
  let i = 0;
  while (i < p.length) {
    if (i + 17 > p.length) return false;
    const cls = p[i] >> 4;
    const id = p[i] & 0x0f;
    if (cls > 1 || id > 3) return false;
    let n = 0;
    for (let k = 1; k <= 16; k++) n += p[i + k];
    if (n > 256) return false;
    i += 17 + n;
  }
  return i === p.length && p.length > 0;
}

export function sanitizeProfilePhoto(input: Buffer): PhotoResult {
  if (input.length === 0) return fail("That file is empty.");
  if (input.length > MAX_UPLOAD_BYTES) return fail("That picture is too large. Try a smaller one.");
  if (input[0] !== 0xff || input[1] !== 0xd8) return fail("Upload a JPEG picture.");

  const kept: Buffer[] = [];
  let pos = 2;
  let width = 0;
  let height = 0;
  let sawSof = false;
  let scans = 0;
  let tables = 0;
  let sawEoi = false;

  while (pos < input.length) {
    if (input[pos] !== 0xff) return fail(BAD);
    while (input[pos] === 0xff) pos++; // fill bytes before a marker
    const marker = input[pos++];
    if (marker === undefined) return fail(BAD);

    if (marker === 0xd9) {
      sawEoi = true;
      break; // everything after the end of image is dropped
    }
    // Markers that cannot appear here: stuffed zero, TEM, restarts, SOI, and the arithmetic/lossless/hierarchical frames.
    if (marker === 0x00 || marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) return fail(BAD);

    if (pos + 2 > input.length) return fail(BAD);
    const len = input.readUInt16BE(pos);
    if (len < 2 || pos + len > input.length) return fail(BAD);
    const payload = input.subarray(pos + 2, pos + len);
    const whole = input.subarray(pos - 2, pos + len);
    pos += len;

    if (marker >= 0xe0 && marker <= 0xef) continue; // APP0..APP15: dropped (a clean JFIF is written below)
    if (marker === 0xfe) continue; // comment: dropped

    switch (marker) {
      case 0xdb: // DQT
        if (!dqtValid(payload) || ++tables > MAX_TABLES) return fail(BAD);
        kept.push(whole);
        break;
      case 0xc4: // DHT
        if (!dhtValid(payload) || ++tables > MAX_TABLES) return fail(BAD);
        kept.push(whole);
        break;
      case 0xdd: // DRI
        if (len !== 4) return fail(BAD);
        kept.push(whole);
        break;
      case 0xc0: // baseline
      case 0xc2: { // progressive
        if (sawSof || scans > 0) return fail(BAD);
        if (payload.length < 6 || payload[0] !== 8) return fail(BAD);
        const nf = payload[5];
        if ((nf !== 1 && nf !== 3) || payload.length !== 6 + 3 * nf) return fail(BAD);
        height = payload.readUInt16BE(1);
        width = payload.readUInt16BE(3);
        if (!width || !height) return fail(BAD);
        // Checked before anything else is kept, so a huge frame is refused outright.
        if (width > MAX_PHOTO_SIDE || height > MAX_PHOTO_SIDE) return fail(`Use a picture no larger than ${MAX_PHOTO_SIDE} pixels on a side.`);
        if (width < MIN_PHOTO_SIDE || height < MIN_PHOTO_SIDE) return fail("That picture is too small.");
        sawSof = true;
        kept.push(whole);
        break;
      }
      case 0xda: { // SOS
        if (!sawSof || ++scans > MAX_SCANS) return fail(BAD);
        const ns = payload[0];
        if (!(ns >= 1 && ns <= 4) || payload.length !== 4 + 2 * ns) return fail(BAD);
        kept.push(whole);
        // Entropy-coded data runs to the next real marker (an 0xFF that is not a stuffed 0x00 or a restart).
        const start = pos;
        while (pos < input.length) {
          if (input[pos] === 0xff && input[pos + 1] !== 0x00 && !(input[pos + 1] >= 0xd0 && input[pos + 1] <= 0xd7)) break;
          pos++;
        }
        kept.push(input.subarray(start, pos));
        break;
      }
      default:
        return fail(BAD); // DNL, other frame types, anything unknown
    }
  }

  if (!sawEoi || !sawSof || scans === 0) return fail(BAD);

  const buffer = Buffer.concat([Buffer.from([0xff, 0xd8]), JFIF, ...kept, Buffer.from([0xff, 0xd9])]);
  if (buffer.length > MAX_PHOTO_BYTES) return fail("That picture is too large. Try a smaller one.");
  const etag = createHash("sha256").update(buffer).digest("hex").slice(0, 24);
  return { ok: true, buffer, mime: "image/jpeg", etag, width, height };
}
