import assert from "node:assert/strict";
import { test } from "node:test";
import { validateProfile, type AppProfile } from "./profile";
import { MAX_PROFILE_PHOTO_BYTES, validateProfilePhoto } from "./profilePhoto";

const emptyProfile: AppProfile = {
  username: null, displayName: null, birthDate: null, profilePhotoUrl: null,
};

test("profile fields are optional and can be explicitly cleared", () => {
  validateProfile(emptyProfile);
});

test("all profile fields including display name and leap-day birthday are valid", () => {
  validateProfile({
    username: "test_user", displayName: "Test User",
    birthDate: "2000-02-29", profilePhotoUrl: "https://example.com/original.png",
  });
});

test("invalid and missing profile fields are rejected", () => {
  for (const invalid of [
    undefined, null, {}, { ...emptyProfile, username: "ab" },
    { ...emptyProfile, username: "invalid name" },
    { ...emptyProfile, displayName: " " },
    { ...emptyProfile, displayName: "a".repeat(101) },
    { ...emptyProfile, birthDate: "2001-02-29" },
    { ...emptyProfile, birthDate: "2026-13-01" },
    { ...emptyProfile, birthDate: "not-a-date" },
  ]) assert.throws(() => validateProfile(invalid));
});

test("original bytes and format are unchanged, including images above the old cap", () => {
  const bytes = Buffer.alloc(3 * 1024 * 1024, 123);
  const photo = `data:image/png;base64,${bytes.toString("base64")}`;
  validateProfilePhoto(photo);
  assert.deepEqual(Buffer.from(photo.split(",")[1], "base64"), bytes);
  assert.ok(photo.startsWith("data:image/png;"));
});

test("exactly 15 MB is accepted without conversion", () => {
  const photo = `data:image/jpeg;base64,${Buffer.alloc(MAX_PROFILE_PHOTO_BYTES).toString("base64")}`;
  validateProfilePhoto(photo);
});

test("even one byte over 15 MB is rejected, not compressed", () => {
  for (const extra of [1, 2, 3, 1024]) {
    const photo = `data:image/png;base64,${Buffer.alloc(MAX_PROFILE_PHOTO_BYTES + extra).toString("base64")}`;
    assert.throws(() => validateProfilePhoto(photo), /15 MB/);
  }
});

test("supported original raster formats are accepted", () => {
  for (const format of ["png", "jpeg", "webp", "gif", "avif", "bmp", "x-icon", "vnd.microsoft.icon"]) {
    validateProfilePhoto(`data:image/${format};base64,AQID`);
  }
});

test("bad base64, non-images, and unsupported URL protocols are rejected", () => {
  for (const photo of [
    "", undefined, 42, "data:text/html;base64,AQID", "data:image/png;base64,!",
    "data:image/png;base64,A", "data:image/png;base64,====",
    "javascript:alert(1)", "file:///image.png", "not-a-url",
  ]) assert.throws(() => validateProfilePhoto(photo));
  validateProfilePhoto(null);
  validateProfilePhoto("http://localhost/photo.png");
});
