import type { NextRequest } from "next/server";

import { handleAnalyzeRequest } from "../../analyze/handler";
import {
  authenticatePilotRequest,
  checkPilotTokenRateLimit,
  pilotCorsHeaders,
  pilotJsonResponse,
  pilotOptionsResponse,
} from "../../../lib/pilot-auth";

export function OPTIONS(request: NextRequest) {
  return pilotOptionsResponse(request);
}

export async function POST(request: NextRequest) {
  const auth = await authenticatePilotRequest(request);

  if (!auth.ok) {
    return pilotJsonResponse(
      {
        error:
          auth.code === "pilot_unavailable"
            ? "Pilot analysis is temporarily unavailable."
            : "Your pilot access is invalid or has been revoked.",
        code: auth.code,
      },
      auth.status,
      auth.origin,
    );
  }

  const rateLimit = await checkPilotTokenRateLimit(auth.tokenId);

  if (!rateLimit.success) {
    return pilotJsonResponse(
      {
        error:
          rateLimit.code === "pilot_unavailable"
            ? "Pilot analysis is temporarily unavailable."
            : "This pilot has reached its current usage limit.",
        code: rateLimit.code,
      },
      rateLimit.code === "pilot_unavailable" ? 503 : 429,
      auth.origin,
      "reset" in rateLimit ? rateLimit.reset : undefined,
    );
  }

  const response = await handleAnalyzeRequest(request, {
    skipPublicRateLimit: true,
  });
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(pilotCorsHeaders(auth.origin))) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
