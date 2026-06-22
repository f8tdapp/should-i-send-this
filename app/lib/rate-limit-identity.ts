import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const RATE_LIMIT_COOKIE_NAME = "betweenlines_rate_limit";
export const RATE_LIMIT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const RATE_LIMIT_ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;
const RATE_LIMIT_SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function signRateLimitId(id: string, secret: string) {
  return createHmac("sha256", secret).update(id).digest("base64url");
}

export function createSignedRateLimitCookieValue(secret: string) {
  const id = randomBytes(24).toString("base64url");
  return `${id}.${signRateLimitId(id, secret)}`;
}

export function verifySignedRateLimitCookieValue(
  value: string | undefined,
  secret: string | undefined,
) {
  if (!value || !secret) {
    return null;
  }

  const [id, signature, extraPart] = value.split(".");

  if (
    extraPart !== undefined ||
    !RATE_LIMIT_ID_PATTERN.test(id ?? "") ||
    !RATE_LIMIT_SIGNATURE_PATTERN.test(signature ?? "")
  ) {
    return null;
  }

  const expectedSignature = Buffer.from(signRateLimitId(id, secret), "base64url");
  const suppliedSignature = Buffer.from(signature, "base64url");

  if (
    expectedSignature.length !== suppliedSignature.length ||
    !timingSafeEqual(expectedSignature, suppliedSignature)
  ) {
    return null;
  }

  return id;
}
