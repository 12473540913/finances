import { validateProfilePhoto } from "./profilePhoto";

export type AppProfile = {
  username: string | null;
  displayName: string | null;
  birthDate: string | null;
  profilePhotoUrl: string | null;
};

export function validateProfile(value: unknown): asserts value is AppProfile {
  if (!value || typeof value !== "object") throw new Error("Invalid profile.");
  const profile = value as Record<string, unknown>;
  if (profile.username !== null && (
    typeof profile.username !== "string" || !/^[a-zA-Z0-9_]{3,24}$/.test(profile.username)
  )) {
    throw new Error("Username must be 3-24 characters and contain only letters, numbers, and underscores.");
  }
  if (profile.displayName !== null && (
    typeof profile.displayName !== "string" || !profile.displayName.trim() || profile.displayName.length > 100
  )) {
    throw new Error("Display name must be between 1 and 100 characters.");
  }
  if (profile.birthDate !== null) {
    if (typeof profile.birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate) || profile.birthDate.startsWith("0000")) {
      throw new Error("Birthday must be a valid date.");
    }
    const date = new Date(`${profile.birthDate}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== profile.birthDate) {
      throw new Error("Birthday must be a valid date.");
    }
  }
  validateProfilePhoto(profile.profilePhotoUrl);
}
