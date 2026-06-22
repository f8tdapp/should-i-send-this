/*
Instructions:
  $env:BETWEENLINES_TEST_URL="https://your-url.vercel.app"
  node scripts/test-rate-limits.mjs

This script is a temporary local test harness for the deployed production
BetweenLines AI rate limits. It sends synthetic requests only and does not
change application code.
*/

const baseUrl = process.env.BETWEENLINES_TEST_URL;

if (!baseUrl) {
  console.error(
    "Error: BETWEENLINES_TEST_URL is not set. Example:\n  $env:BETWEENLINES_TEST_URL=\"https://your-url.vercel.app\"\n  node scripts/test-rate-limits.mjs"
  );
  process.exit(1);
}

const ENDPOINT = `${baseUrl.replace(/\/+$/, "")}/api/analyze`;
const SYNTHETIC_MESSAGE = "Can you send me the report when you get a chance?";
const rateLimitDebugToken = process.env.RATE_LIMIT_DEBUG_TOKEN;
const RATE_LIMIT_COOKIE_NAME = "betweenlines_rate_limit";
let rateLimitCookie;

async function initializeRateLimitCookie() {
  const response = await fetch(baseUrl, { redirect: "follow" });
  const setCookieHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
  const rateLimitSetCookie = setCookieHeaders.find((value) =>
    value.startsWith(`${RATE_LIMIT_COOKIE_NAME}=`),
  );

  if (!rateLimitSetCookie) {
    throw new Error(
      `No ${RATE_LIMIT_COOKIE_NAME} cookie was received. Verify RATE_LIMIT_COOKIE_SECRET is configured on the deployed environment.`,
    );
  }

  rateLimitCookie = rateLimitSetCookie.split(";", 1)[0];
  console.log("Signed anonymous rate-limit cookie captured and reused.");
}

async function postJson(body) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(rateLimitDebugToken
        ? { "x-rate-limit-debug-token": rateLimitDebugToken }
        : {}),
      ...(rateLimitCookie ? { Cookie: rateLimitCookie } : {}),
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let parsed;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = responseText;
  }

  return {
    status: response.status,
    body: parsed,
    retryAfter: response.headers.get("Retry-After") || undefined,
    debugHeaders: Object.fromEntries(
      [...response.headers.entries()].filter(([name]) =>
        name.startsWith("x-debug-"),
      ),
    ),
  };
}

async function runBurstTest() {
  console.log("\n=== Burst Limit Test ===");
  console.log("Sending 5 parallel synthetic analysis requests...");

  const results = await Promise.all(
    Array.from({ length: 5 }, async (_, index) => ({
      requestNumber: index + 1,
      result: await postJson({ message: SYNTHETIC_MESSAGE }),
    }))
  );

  for (const { requestNumber, result } of results) {
    console.log(`\nRequest ${requestNumber}:`);
    console.log(`  status: ${result.status}`);
    console.log(`  response: ${
      typeof result.body === "string" ? result.body : JSON.stringify(result.body)
    }`);
    console.log(`  Retry-After: ${result.retryAfter || "not provided"}`);
    const debugHeaderEntries = Object.entries(result.debugHeaders);
    if (debugHeaderEntries.length === 0) {
      console.log("  debug headers: not provided");
    } else {
      console.log("  debug headers:");
      for (const [name, value] of debugHeaderEntries) {
        console.log(`    ${name}: ${value}`);
      }
    }
  }
}

async function runFeedbackTest() {
  console.log("\n=== Feedback-Only Limit Test ===");
  console.log(
    "Sending synthetic feedback-only requests with safe derived metadata. No raw message text is included."
  );

  let lastRateLimited = false;
  let rateLimitedCount = 0;
  const attempts = 12;

  for (let i = 1; i <= attempts; i += 1) {
    const result = await postJson({
      feedbackOnly: true,
      feedback: {
        tags: ["felt_accurate"],
      },
      metadata: {
        characterCount: 60,
        severity: "Calm",
        confidenceScore: 7,
        clarityScore: 8,
        communicationIntelligenceScore: 72,
        rewriteVisible: false,
      },
    });

    const bodyText =
      typeof result.body === "string" ? result.body : JSON.stringify(result.body);

    console.log(`\nFeedback request ${i}:`);
    console.log(`  status: ${result.status}`);
    console.log(`  response: ${bodyText}`);
    if (result.retryAfter) {
      console.log(`  Retry-After: ${result.retryAfter}`);
    }

    if (result.status === 429) {
      rateLimitedCount += 1;
      lastRateLimited = true;
      // Once we hit rate limit, we can stop if we already confirmed the limit.
      if (rateLimitedCount >= 1) {
        break;
      }
    }
  }

  if (!lastRateLimited) {
    console.log(
      "\nNo feedback rate limit was observed in this run. If the environment allows more than the default limit, set FEEDBACK_HOURLY_LIMIT or run more requests intentionally."
    );
  }
}

async function runDailyLimitTest() {
  console.log("\n=== Daily Limit Test ===");
  console.log(
    "RUN_DAILY_LIMIT_TEST=true is set. This optional test will make additional analysis requests to verify daily limit behavior."
  );

  const dailyAttempts = 3;

  for (let i = 1; i <= dailyAttempts; i += 1) {
    const result = await postJson({ message: SYNTHETIC_MESSAGE });
    console.log(`\nDaily test request ${i}:`);
    console.log(`  status: ${result.status}`);
    console.log(`  response: ${
        typeof result.body === "string" ? result.body : JSON.stringify(result.body)
      }`);
    if (result.retryAfter) {
      console.log(`  Retry-After: ${result.retryAfter}`);
    }
  }
}

async function main() {
  console.log("BetweenLines AI production rate-limit test script");
  console.log(`Endpoint: ${ENDPOINT}`);

  await initializeRateLimitCookie();
  await runBurstTest();
  await runFeedbackTest();

  if (process.env.RUN_DAILY_LIMIT_TEST === "true") {
    await runDailyLimitTest();
  } else {
    console.log(
      "\nDaily limit test skipped. Set RUN_DAILY_LIMIT_TEST=true to enable it explicitly."
    );
  }
}

main().catch((error) => {
  console.error("Test script failed:", error);
  process.exit(1);
});
