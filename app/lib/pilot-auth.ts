import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export type PilotActivationCodeConfig = {
  id: string;
  codeHmac: string;
  expiresAt: string;
  revoked?: boolean;
};

export type PilotInstallationRecord = {
  version: 1;
  activationId: string;
  expiresAt: number;
};

export type PilotStateStore = {
  consumeActivation: (activationId: string, ttlSeconds: number) => Promise<boolean>;
  saveInstallation: (tokenId: string, record: PilotInstallationRecord, ttlSeconds: number) => Promise<void>;
  getInstallation: (tokenId: string) => Promise<PilotInstallationRecord | null>;
};

type PilotOriginResult =
  | { ok: true; origin: string }
  | { ok: false; status: 403 | 503; code: "origin_not_allowed" | "pilot_unavailable" };

type PilotTokenAuthResult =
  | { ok: true; tokenId: string; origin: string }
  | { ok: false; status: 401 | 403 | 503; code: "invalid_token" | "origin_not_allowed" | "pilot_unavailable"; origin?: string };

type ActivationExchangeResult =
  | { ok: true; installationToken: string; tokenId: string; expiresAt: number }
  | { ok: false; code: "activation_expired" | "activation_invalid" | "activation_revoked" | "activation_used" | "pilot_unavailable" };

export const PILOT_RATE_LIMIT_DEFAULTS = Object.freeze({ minute: 10, daily: 100 });

const TOKEN_MINUTE_LIMIT = getPositiveIntegerEnv("PILOT_TOKEN_MINUTE_LIMIT", PILOT_RATE_LIMIT_DEFAULTS.minute);
const TOKEN_DAILY_LIMIT = getPositiveIntegerEnv("PILOT_TOKEN_DAILY_LIMIT", PILOT_RATE_LIMIT_DEFAULTS.daily);
const ACTIVATION_ATTEMPT_HOURLY_LIMIT = getPositiveIntegerEnv("PILOT_ACTIVATION_ATTEMPT_HOURLY_LIMIT", 10);
const ACTIVATION_NETWORK_HOURLY_LIMIT = getPositiveIntegerEnv("PILOT_ACTIVATION_NETWORK_HOURLY_LIMIT", 30);
const TOKEN_TTL_SECONDS = getPositiveIntegerEnv("PILOT_INSTALLATION_TOKEN_TTL_SECONDS", 30 * 24 * 60 * 60);

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const tokenMinuteRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(TOKEN_MINUTE_LIMIT, "1 m"),
  prefix: "betweenlines:pilot:token:minute",
}) : null;

const tokenDailyRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(TOKEN_DAILY_LIMIT, "1 d"),
  prefix: "betweenlines:pilot:token:daily",
}) : null;

const activationAttemptRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(ACTIVATION_ATTEMPT_HOURLY_LIMIT, "1 h"),
  prefix: "betweenlines:pilot:activation:attempt",
}) : null;

const activationNetworkRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(ACTIVATION_NETWORK_HOURLY_LIMIT, "1 h"),
  prefix: "betweenlines:pilot:activation:network",
}) : null;

const redisStateStore: PilotStateStore | null = redis ? {
  async consumeActivation(activationId, ttlSeconds) {
    const result = await redis.set(`betweenlines:pilot:activation-used:${activationId}`, 1, { nx: true, ex: ttlSeconds });
    return result === "OK";
  },
  async saveInstallation(tokenId, record, ttlSeconds) {
    await redis.set(`betweenlines:pilot:installation:${tokenId}`, record, { ex: ttlSeconds });
  },
  async getInstallation(tokenId) {
    return redis.get<PilotInstallationRecord>(`betweenlines:pilot:installation:${tokenId}`);
  },
} : null;

function getPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function splitEnvSet(name: string) {
  return new Set(String(process.env[name] || "").split(",").map((value) => value.trim()).filter(Boolean));
}

function getHmacSecret() {
  const secret = process.env.PILOT_TOKEN_HMAC_SECRET || "";
  return secret.length >= 32 ? secret : null;
}

export function hmacIdentifier(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqualHex(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function parseActivationCodeConfig(rawConfig: string | undefined) {
  if (!rawConfig) return null;

  try {
    const parsed = JSON.parse(rawConfig) as unknown;
    if (!Array.isArray(parsed)) return null;

    const records = parsed.filter((value): value is PilotActivationCodeConfig => Boolean(
      value &&
      typeof value === "object" &&
      /^[A-Za-z0-9_-]{1,64}$/.test(String((value as PilotActivationCodeConfig).id || "")) &&
      /^[a-f0-9]{64}$/i.test(String((value as PilotActivationCodeConfig).codeHmac || "")) &&
      typeof (value as PilotActivationCodeConfig).expiresAt === "string" &&
      Number.isFinite(Date.parse((value as PilotActivationCodeConfig).expiresAt)) &&
      ((value as PilotActivationCodeConfig).revoked === undefined || typeof (value as PilotActivationCodeConfig).revoked === "boolean")
    ));
    const ids = new Set(records.map(({ id }) => id));

    return records.length === parsed.length && records.length > 0 && ids.size === records.length ? records : null;
  } catch {
    return null;
  }
}

function getAllowedOrigins() {
  return splitEnvSet("PILOT_EXTENSION_ALLOWED_ORIGINS");
}

export function validatePilotOrigin(origin: string): PilotOriginResult {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.PILOT_EXTENSION_IDS_PINNED !== "true"
  ) {
    return { ok: false, status: 503, code: "pilot_unavailable" };
  }

  const developmentOriginAllowed = process.env.NODE_ENV === "development" && origin.startsWith("chrome-extension://");
  if (!getAllowedOrigins().has(origin) && !developmentOriginAllowed) {
    return { ok: false, status: 403, code: "origin_not_allowed" };
  }
  if (!getHmacSecret() || (!redis && process.env.NODE_ENV !== "development")) {
    return { ok: false, status: 503, code: "pilot_unavailable" };
  }
  return { ok: true, origin };
}

export function parseBearerToken(authorization: string | null) {
  const match = String(authorization || "").match(/^Bearer (blp_[A-Za-z0-9_-]{43})$/);
  return match?.[1] || null;
}

export async function exchangeActivationCode(activationCode: string, dependencies: {
  configs: PilotActivationCodeConfig[];
  hmacSecret: string;
  store: PilotStateStore;
  now?: number;
  tokenTtlSeconds?: number;
  generateToken?: () => string;
  revokedActivationIds?: Set<string>;
}): Promise<ActivationExchangeResult> {
  const now = dependencies.now ?? Date.now();
  const candidateHmac = hmacIdentifier(activationCode, dependencies.hmacSecret);
  const config = dependencies.configs.find(({ codeHmac }) => safeEqualHex(candidateHmac, codeHmac));

  if (!config) return { ok: false, code: "activation_invalid" };
  if (config.revoked === true || dependencies.revokedActivationIds?.has(config.id)) return { ok: false, code: "activation_revoked" };

  const activationExpiresAt = Date.parse(config.expiresAt);
  if (activationExpiresAt <= now) return { ok: false, code: "activation_expired" };

  const consumed = await dependencies.store.consumeActivation(config.id, Math.max(1, Math.ceil((activationExpiresAt - now) / 1000)));
  if (!consumed) return { ok: false, code: "activation_used" };

  const installationToken = dependencies.generateToken ? dependencies.generateToken() : `blp_${randomBytes(32).toString("base64url")}`;
  const tokenId = hmacIdentifier(installationToken, dependencies.hmacSecret);
  const tokenTtlSeconds = dependencies.tokenTtlSeconds ?? TOKEN_TTL_SECONDS;
  const expiresAt = now + tokenTtlSeconds * 1000;

  try {
    await dependencies.store.saveInstallation(tokenId, { version: 1, activationId: config.id, expiresAt }, tokenTtlSeconds);
  } catch {
    return { ok: false, code: "pilot_unavailable" };
  }

  return { ok: true, installationToken, tokenId, expiresAt };
}

export async function authenticateInstallationToken(authorization: string | null, dependencies: {
  hmacSecret: string;
  store: PilotStateStore;
  now?: number;
  revokedTokenIds?: Set<string>;
  revokedActivationIds?: Set<string>;
}) {
  const installationToken = parseBearerToken(authorization);
  if (!installationToken) return { ok: false as const, code: "invalid_token" };

  const tokenId = hmacIdentifier(installationToken, dependencies.hmacSecret);
  const record = await dependencies.store.getInstallation(tokenId);
  const now = dependencies.now ?? Date.now();

  if (!record || record.version !== 1 || record.expiresAt <= now || dependencies.revokedTokenIds?.has(tokenId) || dependencies.revokedActivationIds?.has(record.activationId)) {
    return { ok: false as const, code: "invalid_token" };
  }

  return { ok: true as const, tokenId, record };
}

export async function exchangePilotActivationCode(activationCode: string) {
  const configs = parseActivationCodeConfig(process.env.PILOT_ACTIVATION_CODES_JSON);
  const hmacSecret = getHmacSecret();
  if (!configs || !hmacSecret || !redisStateStore) return { ok: false as const, code: "pilot_unavailable" };

  return exchangeActivationCode(activationCode, {
    configs,
    hmacSecret,
    store: redisStateStore,
    revokedActivationIds: splitEnvSet("PILOT_REVOKED_ACTIVATION_IDS"),
  });
}

export async function authenticatePilotRequest(request: NextRequest): Promise<PilotTokenAuthResult> {
  const originResult = validatePilotOrigin(request.headers.get("origin") || "");
  if (!originResult.ok) return originResult;

  const hmacSecret = getHmacSecret();
  if (!hmacSecret || !redisStateStore) return { ok: false, status: 503, code: "pilot_unavailable", origin: originResult.origin };

  try {
    const result = await authenticateInstallationToken(request.headers.get("authorization"), {
      hmacSecret,
      store: redisStateStore,
      revokedTokenIds: splitEnvSet("PILOT_REVOKED_TOKEN_IDS"),
      revokedActivationIds: splitEnvSet("PILOT_REVOKED_ACTIVATION_IDS"),
    });
    return result.ok
      ? { ok: true, tokenId: result.tokenId, origin: originResult.origin }
      : { ok: false, status: 401, code: "invalid_token", origin: originResult.origin };
  } catch {
    return { ok: false, status: 503, code: "pilot_unavailable", origin: originResult.origin };
  }
}

export function selectExceededLimit(minute: { success: boolean; reset: number }, daily: { success: boolean; reset: number }) {
  return !minute.success ? minute : !daily.success ? daily : null;
}

export function evaluatePilotRateLimitResults(
  minute: { success: boolean; reset: number },
  daily: { success: boolean; reset: number },
) {
  const exceeded = selectExceededLimit(minute, daily);
  return exceeded
    ? { success: false as const, code: "rate_limit_exceeded", reset: exceeded.reset }
    : { success: true as const };
}

export async function checkPilotTokenRateLimit(tokenId: string) {
  if (!tokenMinuteRateLimit || !tokenDailyRateLimit) return { success: false as const, code: "pilot_unavailable" };
  try {
    const [minute, daily] = await Promise.all([tokenMinuteRateLimit.limit(tokenId), tokenDailyRateLimit.limit(tokenId)]);
    return evaluatePilotRateLimitResults(minute, daily);
  } catch {
    return { success: false as const, code: "pilot_unavailable" };
  }
}

export async function checkActivationAttemptRateLimit(
  activationCode: string,
  networkIdentifier: string,
) {
  const hmacSecret = getHmacSecret();
  if (!hmacSecret || !activationAttemptRateLimit || !activationNetworkRateLimit) return { success: false as const, code: "pilot_unavailable" };
  try {
    const [codeResult, networkResult] = await Promise.all([
      activationAttemptRateLimit.limit(hmacIdentifier(activationCode, hmacSecret)),
      activationNetworkRateLimit.limit(hmacIdentifier(networkIdentifier, hmacSecret)),
    ]);
    const denied = !codeResult.success ? codeResult : !networkResult.success ? networkResult : null;
    return !denied
      ? { success: true as const }
      : { success: false as const, code: "rate_limit_exceeded", reset: denied.reset };
  } catch {
    return { success: false as const, code: "pilot_unavailable" };
  }
}

export function pilotCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

export function pilotJsonResponse(body: unknown, status: number, origin?: string, retryAfter?: number) {
  const headers = new Headers(origin ? pilotCorsHeaders(origin) : { "Cache-Control": "no-store" });
  headers.set("Content-Type", "application/json");
  if (retryAfter) headers.set("Retry-After", String(Math.max(1, Math.ceil((retryAfter - Date.now()) / 1000))));
  return new Response(JSON.stringify(body), { status, headers });
}

export function pilotOptionsResponse(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const result = validatePilotOrigin(origin);
  return result.ok
    ? new Response(null, { status: 204, headers: pilotCorsHeaders(origin) })
    : new Response(null, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
