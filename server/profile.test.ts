import assert from "node:assert/strict";
import { once } from "node:events";
import { test, mock } from "node:test";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { validateProfile, type AppProfile } from "../shared/profile";

test("profile API preserves originals, persists app details, and isolates users", async (t) => {
  process.env.DATABASE_URL = "postgres://test:test@localhost/test";
  process.env.JWT_SECRET = "profile-api-test-secret";
  process.env.AUTH_COOKIE_NAME = "profile_test_session";
  process.env.PORT = "0";

  const profiles = new Map<string, AppProfile>();
  mock.method(Pool.prototype, "query", async (sql: string, values: unknown[] = []) => {
    if (/alter table/.test(sql)) return { rows: [] };
    const userId = String(values[0]);
    if (/select id, email, auth_version/.test(sql)) {
      return { rows: [{ id: userId, email: "test@example.com", auth_version: 0 }] };
    }
    if (/insert into public.app_profiles/.test(sql)) {
      const [, username, displayName, birthDate, profilePhotoUrl] = values;
      const profile = { username, displayName, birthDate, profilePhotoUrl };
      validateProfile(profile);
      profiles.set(userId, profile);
      return { rows: [] };
    }
    if (/from public.app_profiles/.test(sql)) {
      const profile = profiles.get(userId);
      if (/as birth_date/.test(sql)) return { rows: profile ? [{ birth_date: profile.birthDate }] : [] };
      return { rows: profile ? [profile] : [] };
    }
    if (/from public.entry_(groups|accounts|account_values|settings)/.test(sql)) return { rows: [] };
    throw new Error(`Unexpected SQL in profile test: ${sql}`);
  });

  const { server } = await import("./index");
  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
    mock.restoreAll();
  });
  if (!server.listening) await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const cookie = (userId: string) => `profile_test_session=${jwt.sign(
    { email: "test@example.com", tokenVersion: 0 },
    "profile-api-test-secret",
    { subject: userId, issuer: "auth-service", audience: "finances", expiresIn: "5m" }
  )}`;
  const owner = cookie("11111111-1111-4111-8111-111111111111");
  const secondUser = cookie("22222222-2222-4222-8222-222222222222");
  const original = Buffer.alloc(3 * 1024 * 1024, 123);
  const profile: AppProfile = {
    username: "local_user", displayName: "App Display Name", birthDate: "1999-01-02",
    profilePhotoUrl: `data:image/png;base64,${original.toString("base64")}`,
  };
  const save = (value: unknown, session = owner) => fetch(`${base}/api/profile`, {
    method: "PUT",
    headers: { Cookie: session, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  const load = (session: string) => fetch(`${base}/api/profile`, { headers: { Cookie: session } });

  assert.equal((await load("")).status, 401);
  assert.equal((await save(profile, "")).status, 401);
  assert.equal((await save(profile)).status, 200);
  const response = await load(owner);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const loaded = await response.json();
  assert.deepEqual(loaded.profile, profile);
  assert.deepEqual(Buffer.from(loaded.profile.profilePhotoUrl.split(",")[1], "base64"), original);
  assert.equal((await (await load(secondUser)).json()).profile.profilePhotoUrl, null);

  assert.equal((await save({ ...profile, birthDate: "2026-02-30" })).status, 400);
  assert.deepEqual((await (await load(owner)).json()).profile, profile);
  assert.equal((await save({ ...profile, profilePhotoUrl: null })).status, 200);
  assert.equal((await (await load(owner)).json()).profile.profilePhotoUrl, null);
  const overview = await fetch(`${base}/api/overview`, { headers: { Cookie: owner } });
  assert.equal((await overview.json()).data.birthDate, profile.birthDate);
  assert.equal(profiles.size, 1);
});
