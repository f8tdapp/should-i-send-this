"use client";

import posthog from "posthog-js";

type TextPanicEvent = "text_analyzed" | "rewrite_revealed" | "rewrite_copied";

type TextPanicEventProperties = {
  character_count?: number;
  severity?: string;
  detected_language?: string;
};

let isPostHogReady = false;

function getPostHog() {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!key) return null;

  if (!isPostHogReady) {
    posthog.init(key, {
      api_host: host || "https://app.posthog.com",
      capture_pageview: false,
      person_profiles: "identified_only",
    });
    isPostHogReady = true;
  }

  return posthog;
}

export function captureTextPanicEvent(
  event: TextPanicEvent,
  properties: TextPanicEventProperties = {},
) {
  getPostHog()?.capture(event, properties);
}

