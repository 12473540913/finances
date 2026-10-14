export const MAX_PROFILE_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_PROFILE_PHOTO_DATA_URL_LENGTH = 4 * Math.ceil(MAX_PROFILE_PHOTO_BYTES / 3) + 128;

export function validateProfilePhoto(value: unknown): asserts value is string | null {
  if (value === null) return;
  if (typeof value !== "string" || !value) {
    throw new Error("Profile photo must be an image or an HTTP(S) URL.");
  }

  if (value.startsWith("data:")) {
    if (value.length > MAX_PROFILE_PHOTO_DATA_URL_LENGTH) {
      throw new Error("Profile images must be 15 MB or smaller. The original will not be compressed.");
    }
    const match = /^data:image\/(?:png|jpeg|webp|gif|avif|bmp|x-icon|vnd\.microsoft\.icon);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[1].length % 4 !== 0) {
      throw new Error("Choose a PNG, JPEG, WebP, GIF, AVIF, BMP, or ICO image.");
    }
    const base64 = match[1];
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    if (base64.length / 4 * 3 - padding > MAX_PROFILE_PHOTO_BYTES) {
      throw new Error("Profile images must be 15 MB or smaller. The original will not be compressed.");
    }
    return;
  }

  if (value.length > 700_000) {
    throw new Error("Profile image URL is too long.");
  }
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Profile image URL must use HTTP or HTTPS.");
  }
}
