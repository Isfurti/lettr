/**
 * The photo as the PDF renderer may use it. react-pdf fetches any URL it is
 * given (and reads local paths), so a resume sent by a client must never
 * hand it anything but a small inline image. Everything else is dropped.
 */
export const MAX_PHOTO_CHARS = 1_500_000; // ~1.1 MB of image; the editor's own output is far smaller
const INLINE_IMAGE = /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function safePhotoDataUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > MAX_PHOTO_CHARS) return undefined;
  return INLINE_IMAGE.test(value) ? value : undefined;
}
