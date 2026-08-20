import type { NextRequest } from "next/server";

import {
  checkActivationAttemptRateLimit,
  exchangePilotActivationCode,
  pilotJsonResponse,
  pilotOptionsResponse,
  validatePilotOrigin,
} from "../../../lib/pilot-auth";

export function OPTIONS(request: NextRequest) {
  return pilotOptionsResponse(request);
}

export async function POST(request: NextRequest) {
  const originResult = validatePilotOrigin(request.headers.get("origin") || "");

  if (!originResult.ok) {
    return pilotJsonResponse(
      {
        error:
          originResult.code === "pilot_unavailable"
            ? "Pilot activation is temporarily unavailable."
            : "That pilot activation could not be verified.",
        code: originResult.code,
      },
      originResult.status,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return pilotJsonResponse(
      { error: "That pilot activation could not be verified." },
      400,
      originResult.origin,
    );
  }

  const activationCode =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof (body as Record<string, unknown>).activationCode === "string"
      ? (body as Record<string, string>).activationCode.trim()
      : "";

  if (activationCode.length < 16 || activationCode.length > 256) {
    return pilotJsonResponse(
      { error: "That pilot activation could not be verified." },
      401,
      originResult.origin,
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const networkIdentifier =
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkActivationAttemptRateLimit(
    activationCode,
    networkIdentifier,
  );

  if (!rateLimit.success) {
    return pilotJsonResponse(
      {
        error:
          rateLimit.code === "pilot_unavailable"
            ? "Pilot activation is temporarily unavailable."
            : "Too many activation attempts. Please try again later.",
        code: rateLimit.code,
      },
      rateLimit.code === "pilot_unavailable" ? 503 : 429,
      originResult.origin,
      "reset" in rateLimit ? rateLimit.reset : undefined,
    );
  }

  const exchange = await exchangePilotActivationCode(activationCode);

  if (!exchange.ok) {
    return pilotJsonResponse(
      {
        error:
          exchange.code === "pilot_unavailable"
            ? "Pilot activation is temporarily unavailable."
            : "That pilot activation could not be verified.",
        code:
          exchange.code === "pilot_unavailable"
            ? exchange.code
            : "activation_invalid",
      },
      exchange.code === "pilot_unavailable" ? 503 : 401,
      originResult.origin,
    );
  }

  return pilotJsonResponse(
    {
      ok: true,
      installationToken: exchange.installationToken,
      expiresAt: new Date(exchange.expiresAt).toISOString(),
    },
    200,
    originResult.origin,
  );
}
