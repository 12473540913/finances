import { apiUrl } from "./api";
import { MAX_PROFILE_PHOTO_BYTES, validateProfilePhoto } from "../../shared/profilePhoto";
import { validateProfile, type AppProfile } from "../../shared/profile";

async function requestProfile(init?: RequestInit) {
  const response = await fetch(apiUrl("/api/profile"), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Profile request failed.");
  }
  if (payload.ok !== true) throw new Error("Invalid profile response.");
  return payload;
}

export async function loadAppProfile(): Promise<AppProfile> {
  const payload = await requestProfile();
  validateProfile(payload.profile);
  return payload.profile;
}

export async function saveAppProfile(profile: AppProfile): Promise<void> {
  validateProfile(profile);
  await requestProfile({
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function readOriginalProfilePhoto(file: File): Promise<string> {
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error("Profile images must be 15 MB or smaller. The original will not be compressed.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read image file."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image file."));
    reader.onabort = () => reject(new Error("Reading the image file was cancelled."));
    reader.readAsDataURL(file);
  });
  validateProfilePhoto(dataUrl);
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not decode image file."));
    image.src = dataUrl;
  });
  return dataUrl;
}
