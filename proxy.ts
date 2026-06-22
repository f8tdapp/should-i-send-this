import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createSignedRateLimitCookieValue,
  RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
  RATE_LIMIT_COOKIE_NAME,
  verifySignedRateLimitCookieValue,
} from "./app/lib/rate-limit-identity";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const secret = process.env.RATE_LIMIT_COOKIE_SECRET;

  if (!secret) {
    return response;
  }

  const currentValue = request.cookies.get(RATE_LIMIT_COOKIE_NAME)?.value;

  if (verifySignedRateLimitCookieValue(currentValue, secret)) {
    return response;
  }

  response.cookies.set({
    name: RATE_LIMIT_COOKIE_NAME,
    value: createSignedRateLimitCookieValue(secret),
    httpOnly: true,
    maxAge: RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export const config = {
  matcher: "/",
};
