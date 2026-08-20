import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

process.env.NODE_ENV = "production";
process.env.PILOT_TOKEN_HMAC_SECRET = "test-only-hmac-secret-at-least-32-characters";
process.env.PILOT_EXTENSION_ALLOWED_ORIGINS = "chrome-extension://pinned-extension-id";
process.env.PILOT_EXTENSION_IDS_PINNED = "true";

const pilot = await import("../app/lib/pilot-auth.ts");
const now = Date.parse("2026-08-20T12:00:00.000Z");
const activationCode = "test-activation-code-for-one-installation";
const installationToken = `blp_${"A".repeat(43)}`;
const codeHmac = pilot.hmacIdentifier(
  activationCode,
  process.env.PILOT_TOKEN_HMAC_SECRET,
);
const config = {
  id: "pilot-user-01",
  codeHmac,
  expiresAt: "2026-08-21T12:00:00.000Z",
};

function createMemoryStore() {
  const consumed = new Set();
  const installations = new Map();

  return {
    consumed,
    installations,
    store: {
      async consumeActivation(id) {
        if (consumed.has(id)) return false;
        consumed.add(id);
        return true;
      },
      async saveInstallation(id, record) {
        installations.set(id, record);
      },
      async getInstallation(id) {
        return installations.get(id) || null;
      },
    },
  };
}

const memory = createMemoryStore();
const dependencies = {
  configs: [config],
  hmacSecret: process.env.PILOT_TOKEN_HMAC_SECRET,
  store: memory.store,
  now,
  tokenTtlSeconds: 60,
  generateToken: () => installationToken,
};
const firstExchange = await pilot.exchangeActivationCode(
  activationCode,
  dependencies,
);
assert.equal(firstExchange.ok, true);
assert.notEqual(firstExchange.installationToken, activationCode);
assert.equal(firstExchange.installationToken, installationToken);
assert.equal(
  (await pilot.exchangeActivationCode(activationCode, dependencies)).code,
  "activation_used",
);

const expiredActivation = await pilot.exchangeActivationCode(activationCode, {
  ...dependencies,
  store: createMemoryStore().store,
  configs: [{ ...config, expiresAt: "2026-08-19T12:00:00.000Z" }],
});
assert.equal(expiredActivation.code, "activation_expired");

const authorization = `Bearer ${installationToken}`;
assert.equal(
  (
    await pilot.authenticateInstallationToken(authorization, {
      hmacSecret: dependencies.hmacSecret,
      store: memory.store,
      now: now + 30_000,
    })
  ).ok,
  true,
);
assert.equal(
  (
    await pilot.authenticateInstallationToken(authorization, {
      hmacSecret: dependencies.hmacSecret,
      store: memory.store,
      now: now + 61_000,
    })
  ).code,
  "invalid_token",
);
assert.equal(
  (
    await pilot.authenticateInstallationToken(authorization, {
      hmacSecret: dependencies.hmacSecret,
      store: memory.store,
      now: now + 30_000,
      revokedTokenIds: new Set([firstExchange.tokenId]),
    })
  ).code,
  "invalid_token",
);
assert.equal(
  (
    await pilot.authenticateInstallationToken(authorization, {
      hmacSecret: dependencies.hmacSecret,
      store: memory.store,
      now: now + 30_000,
      revokedActivationIds: new Set([config.id]),
    })
  ).code,
  "invalid_token",
);

for (const malformed of [
  null,
  "",
  installationToken,
  `Basic ${installationToken}`,
  "Bearer short",
  `bearer ${installationToken}`,
  `Bearer ${installationToken} extra`,
]) {
  assert.equal(pilot.parseBearerToken(malformed), null);
}

assert.equal(
  pilot.validatePilotOrigin("chrome-extension://wrong-extension-id").code,
  "origin_not_allowed",
);
assert.deepEqual(pilot.PILOT_RATE_LIMIT_DEFAULTS, { minute: 10, daily: 100 });
assert.equal(
  pilot.evaluatePilotRateLimitResults(
    { success: false, reset: now + 60_000 },
    { success: true, reset: now + 86_400_000 },
  ).code,
  "rate_limit_exceeded",
);
assert.equal(
  pilot.evaluatePilotRateLimitResults(
    { success: true, reset: now + 60_000 },
    { success: false, reset: now + 86_400_000 },
  ).code,
  "rate_limit_exceeded",
);
assert.equal(
  pilot.evaluatePilotRateLimitResults(
    { success: true, reset: now + 60_000 },
    { success: true, reset: now + 86_400_000 },
  ).success,
  true,
);
assert.equal(
  pilot.selectExceededLimit(
    { success: false, reset: now + 60_000 },
    { success: true, reset: now + 86_400_000 },
  ).success,
  false,
);

let stored = { betweenlinesPilotInstallationToken: installationToken };
const extensionContext = {
  chrome: {
    runtime: { onMessage: { addListener() {} } },
    storage: { local: { get: async () => stored } },
  },
};
vm.createContext(extensionContext);
vm.runInContext(
  `${fs.readFileSync("extension/service-worker.js", "utf8")};globalThis.getConnection=getApiConnection;`,
  extensionContext,
);
assert.equal((await extensionContext.getConnection()).apiBase, "https://pilot.betweenlinesai.com");
stored = {
  ...stored,
  betweenlinesApiBase: "http://credentials.example",
};
await assert.rejects(
  () => extensionContext.getConnection(),
  /requires HTTPS/,
);

const sensitiveSources = [
  "app/lib/pilot-auth.ts",
  "app/api/extension/activate/route.ts",
  "app/api/extension/analyze/route.ts",
].map((file) => fs.readFileSync(file, "utf8"));
for (const source of sensitiveSources) {
  assert.doesNotMatch(source, /console\.(?:log|info|warn|error)/);
}
const popupSource = fs.readFileSync("extension/popup.js", "utf8");
assert.doesNotMatch(popupSource, /betweenlinesPilotCredential\s*:/);
assert.doesNotMatch(popupSource, /betweenlinesPilotActivationCode/);
assert.match(
  popupSource,
  /betweenlinesPilotInstallationToken:\s*data\.installationToken/,
);

assert.equal(
  fs.readFileSync("app/api/analyze/route.ts", "utf8").replace(/\r\n/g, "\n"),
  `import type { NextRequest } from "next/server";

import { handleAnalyzeRequest } from "./handler";

export async function POST(request: NextRequest) {
  return handleAnalyzeRequest(request);
}
`,
);

console.log(
  "hosted-pilot negative security and public-route checks passed",
);
