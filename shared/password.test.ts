import assert from "node:assert/strict";
import { test } from "node:test";
import { getMissingPasswordRequirements } from "./password";

test("an empty password has all five unmet requirements", () => {
  assert.equal(getMissingPasswordRequirements("").length, 5);
});

test("requirements disappear as each password rule is satisfied", () => {
  assert.deepEqual(getMissingPasswordRequirements("a"), [
    "Password must be at least 8 characters.",
    "Password must include an uppercase letter.",
    "Password must include a number.",
    "Password must include a special character.",
  ]);
  assert.deepEqual(getMissingPasswordRequirements("aA"), [
    "Password must be at least 8 characters.",
    "Password must include a number.",
    "Password must include a special character.",
  ]);
  assert.deepEqual(getMissingPasswordRequirements("aA1"), [
    "Password must be at least 8 characters.",
    "Password must include a special character.",
  ]);
  assert.deepEqual(getMissingPasswordRequirements("aA1!"), [
    "Password must be at least 8 characters.",
  ]);
  assert.deepEqual(getMissingPasswordRequirements("aA1!aaaa"), []);
});

test("every rule is required even when the password is long enough", () => {
  for (const [password, missing] of [
    ["AA12345!", "lowercase letter"],
    ["aa12345!", "uppercase letter"],
    ["aaAAAAA!", "number"],
    ["aaAAAA12", "special character"],
  ]) {
    assert.deepEqual(getMissingPasswordRequirements(password), [
      `Password must include a ${missing}.`,
    ]);
  }
});
