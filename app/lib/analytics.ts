"use client";

import posthog from "posthog-js";

type BetweenLinesEvent =
  | "example_selected"
  | "text_analyzed"
  | "rewrite_revealed"
  | "rewrite_copied"
  | "result_copied"
  | "share_card_downloaded"
  | "share_card_download_failed"
  | "share_card_preview_opened";

type BetweenLinesEventProperties = {
  character_count?: number;
  example_type?: string;
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

export function captureBetweenLinesEvent(
  event: BetweenLinesEvent,
  properties: BetweenLinesEventProperties = {},
) {
  getPostHog()?.capture(event, properties);
}
