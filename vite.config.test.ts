import assert from "node:assert/strict";
import { test } from "node:test";
import viteConfig from "./vite.config";

test("API proxy follows the backend PORT setting", () => {
  const previousPort = process.env.PORT;
  try {
    for (const port of ["3002", "3017"]) {
      process.env.PORT = port;
      const config = viteConfig({ command: "serve", mode: "development" });
      assert.equal(config.server?.proxy?.["/api"], `http://localhost:${port}`);
      assert.ok(config.server?.proxy?.["/auth"]);
    }

    process.env.PORT = "";
    const config = viteConfig({ command: "serve", mode: "development" });
    assert.equal(config.server?.proxy?.["/api"], "http://localhost:3002");
  } finally {
    if (previousPort === undefined) delete process.env.PORT;
    else process.env.PORT = previousPort;
  }
});
