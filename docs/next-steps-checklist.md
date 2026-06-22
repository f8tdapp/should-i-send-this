# BetweenLines AI Next Steps Checklist

Generated: 2026-06-18  
Source compared against: current working tree and `docs/project-build-record.md`  
Current HEAD at comparison time: `c235258` (`Add prompt test fixtures`)

This checklist is a launch and follow-up companion to `docs/project-build-record.md`. It is based on the current codebase, docs, package files, and local working tree.

## 1. Must Confirm Before Launch

- [ ] Confirm whether the uncommitted confidence-labeling fix should ship.
  - Evidence: `app/api/analyze/route.ts` and `app/page.tsx` are modified locally.
  - Current local prompt version: `betweenlines-ci-v2.1.1`.
- [ ] Confirm production environment variables are set:
  - `OPENAI_API_KEY`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `ANALYSIS_DAILY_LIMIT` (optional, server-only; default `5`)
  - `ANALYSIS_BURST_LIMIT` (optional, server-only; default `3`)
  - `ANALYSIS_BURST_WINDOW_SECONDS` (optional, server-only; default `30`)
  - `FEEDBACK_HOURLY_LIMIT` (optional, server-only; default `10`)
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`, if not using PostHog default host.
- [ ] Confirm production hosting/logging behavior.
  - The app avoids intentional raw-message logging, but platform logs and request retention are outside the repo.
- [ ] Confirm whether PostHog is actually enabled in production.
  - Code only initializes PostHog if `NEXT_PUBLIC_POSTHOG_KEY` exists.
- [ ] Confirm whether Vercel Analytics and Speed Insights are intended for launch.
  - Evidence: both are mounted in `app/layout.tsx`.
- [ ] Confirm the configured launch limits; safe defaults are 5 reads/day, 3 reads/30 seconds, and 10 feedback submissions/hour.
  - Evidence: server-only rate-limit variables and their fallbacks in `app/api/analyze/route.ts`.
- [ ] Confirm whether stale `textpanic:analyze:*` Upstash prefixes should remain to preserve existing counters or be renamed before launch.
- [ ] Confirm if share-card remnants are intentional.
  - Evidence: `html-to-image` remains in `package.json`; share-card event names remain in `app/lib/analytics.ts`; no current share-card UI was found.
- [ ] Confirm launch URL/domain.
  - Needed because `metadataBase` is not set in `app/layout.tsx`.
- [ ] Confirm the desired public privacy claim.
  - Current UI says: "Private by design. Your original message is not included in copied insights."
  - Stronger claims such as "we do not store your message" need production logging and vendor settings confirmation.

## 2. Must Fix Before Launch

- [ ] Commit or intentionally revert the current local confidence-labeling fix.
  - Leaving source files modified makes launch state ambiguous.
- [ ] Update `docs/prompt-calibration.md`.
  - It documents prompt version `betweenlines-ci-v2.0.0`.
  - Current committed code is newer, and local code is `betweenlines-ci-v2.1.1`.
- [ ] Replace the stock `README.md` with a product-specific developer README.
  - Current README still describes a generic create-next-app project.
- [ ] Decide and act on share-card residue.
  - Either restore the feature intentionally or remove unused dependency/event names.
- [ ] Set `metadataBase` in `app/layout.tsx` once the launch URL is confirmed.
  - Prior builds warned that Open Graph/Twitter image resolution falls back to `http://localhost:3000`.
- [ ] Confirm and document production privacy/logging posture.
  - This should cover Vercel/platform logs, OpenAI request retention settings, PostHog, and Upstash.
- [ ] Run the launch command set on the final committed tree:
  - `npm.cmd run lint`
  - `npx.cmd tsc --noEmit`
  - `npm.cmd run build`

## 3. Nice To Improve Before Launch

- [ ] Rename Upstash prefixes from `textpanic:analyze:*` to `betweenlines:analyze:*` if counter continuity is not needed.
- [ ] Add a product-specific README with:
  - app purpose
  - local setup
  - environment variables
  - privacy expectations
  - manual QA routine
  - deployment notes
- [ ] Move prompt text into a separate versioned module or prompt file.
  - Current prompt is inline in `app/api/analyze/route.ts`.
- [ ] Add lightweight automated tests for deterministic UI helpers:
  - clear-message detection
  - over-apologetic/tentative label override
  - copied insight omission of original message
  - safe feedback metadata filtering
- [ ] Add API tests for:
  - empty message validation
  - length-limit validation
  - malformed JSON
  - feedback-only requests
  - malformed model JSON fallback
- [ ] Add CI for lint, TypeScript, and build.
  - No `.github` workflow was found.
- [ ] Review whether `relationshipContext` and `messageGoal` should remain API-only fields.
  - Current UI sends only `desiredTone`.
- [ ] Review the terminal/file encoding display for smart quotes.
  - Windows shell output has shown mojibake in some reads; confirm files render correctly in editors and deployed UI.
- [ ] Document the fixture-driven prompt release process in README or docs.

## 4. Later Scaling Ideas

- [ ] Add a synthetic, privacy-safe evaluation runner based on `docs/prompt-test-fixtures.md`.
- [ ] Track aggregate prompt quality by safe metadata only:
  - prompt version
  - model
  - communication risk
  - emotional pressure level
  - safe feedback tags
- [ ] Add more fixture categories:
  - workplace urgency
  - family conflict
  - apology repair
  - friendship boundaries
  - dating ambiguity
  - multilingual or code-switching examples
- [ ] Add optional mode presets only if they preserve the current brand:
  - work
  - dating
  - family
  - friendship
  - apology
- [ ] Consider a browser extension or compose integration later.
  - Not implemented now; privacy model would need a separate review.
- [ ] Consider a team/workplace version focused on professional communication clarity.
- [ ] Consider prompt/version A/B testing using only synthetic fixtures and safe aggregate feedback.
- [ ] Build an internal prompt calibration dashboard from non-sensitive metadata.
- [ ] Consider moving rate-limit and model settings into typed config.

## 5. Monetization Experiments

- [ ] Free daily private reads with paid higher limits.
  - Current code already has daily and burst limits.
- [ ] Paid plan for higher rate limits, not saved history.
  - This fits the current privacy-first posture better than storing messages.
- [ ] Team/workplace subscription for professional communication review.
- [ ] Premium communication style controls.
  - Current UI already has a simple communication style selector.
- [ ] Pay-per-pack for extra private reads.
- [ ] Pro prompt calibration features for teams using only aggregate metadata.
- [ ] Browser extension as a paid add-on only after a privacy/security redesign.
- [ ] Avoid saved-history monetization unless privacy posture is intentionally redesigned.

## 6. Privacy/Security Audit Checklist

- [ ] Confirm no raw message text is logged by application code.
  - Current code uses safe error details and safe feedback logs.
- [ ] Confirm no raw message text is sent to PostHog.
  - Current analytics properties are limited to safe metadata.
- [ ] Confirm copied insights omit original message text.
  - Current clipboard formatter excludes the raw message.
- [ ] Confirm OpenAI request uses `store: false`.
  - Current code does.
- [ ] Confirm OpenAI account/project retention settings externally.
  - Needs confirmation outside the repo.
- [ ] Confirm Vercel/platform request logs do not retain request bodies.
  - Needs confirmation outside the repo.
- [ ] Confirm Upstash stores only rate-limit keys, not raw message content.
  - Current code sends IP-derived identifiers to rate limit methods.
- [ ] Confirm production debug metadata is not exposed.
  - Current code removes debug metadata outside development.
- [ ] Confirm `.env*` files remain untracked.
  - Current `.gitignore` ignores `.env*`.
- [ ] Confirm feedback logs contain only:
  - prompt version
  - model
  - success/failure
  - rating
  - tag count
  - allowlisted tags
  - classification labels
  - bounded scores
  - rewrite visibility
  - character count bucket
- [ ] Review local development behavior before demos.
  - Development responses include debug metadata.
- [ ] Verify privacy copy remains accurate after deployment.

## 7. Cost/Rate-Limit Audit Checklist

- [ ] Confirm model choice: `gpt-4.1-mini`.
- [ ] Confirm `max_output_tokens: 780` is sufficient but not wasteful.
- [ ] Confirm `temperature: 0.2` is desired for stable analysis.
- [ ] Confirm 750-character input limit is the launch limit.
- [ ] Confirm 20-second OpenAI timeout is acceptable.
- [ ] Confirm daily limit of 5 reads per IP/day.
- [ ] Confirm burst limit of 3 reads per 30 seconds.
- [ ] Confirm rate limits are intentionally disabled in development.
- [ ] Confirm fallback behavior when Upstash is not configured.
  - Current code allows requests if Redis/rate-limit clients are missing.
- [ ] Confirm cost behavior when OpenAI is unavailable.
  - Current code returns a generic error for OpenAI request failures, with demo fallback only for missing key, empty response, or parse failure.
- [ ] Confirm whether safe feedback-only requests should be rate-limited.
  - Current feedback-only path is handled before message validation and rate-limit checks.
- [ ] Monitor aggregate:
  - request volume
  - timeout rate
  - parse failure rate
  - empty response fallback rate
  - token usage
  - rate-limit hit rate

## 8. Manual QA Test Script

Use this script before launch and after any prompt, model, rate-limit, analytics, or result UI change.

### Setup

1. Confirm working tree state with `git status --short --branch`.
2. Run:
   - `npm.cmd run lint`
   - `npx.cmd tsc --noEmit`
   - `npm.cmd run build`
3. Start locally:
   - `npm.cmd run dev`
4. Open the app in a browser.

### Core Flow

1. Paste a clear work boundary:
   - `I won’t be able to take this on today, but I can look at it tomorrow morning.`
2. Run analysis.
3. Confirm:
   - main label is `Looks Clear` or equivalent low-risk result
   - communication risk is low
   - emotional pressure is low
   - rewrite is framed as optional polish
   - the boundary is not weakened

### Clear Message Flow

1. Paste:
   - `Sounds good, thanks.`
2. Run analysis.
3. Confirm:
   - no hidden drama is invented
   - result stays low-risk
   - app does not overanalyze
   - rewrite, if shown, is unnecessary or minimal

### Low-Pressure Dating Flow

1. Paste:
   - `I had a really nice time last night. No pressure, but I’d be happy to see you again if you’d like.`
2. Run analysis.
3. Confirm:
   - warm / low-pressure read
   - `Looks Clear` or equivalent
   - no claim that romantic interest is inherently risky
   - warmth is preserved

### Tentative / Over-Apologetic Flow

1. Paste:
   - `Sorry, I know this is probably annoying and you’re really busy, and I don’t want to be a pain, but I was wondering if maybe you had a chance to look at the thing I sent last week?`
2. Run analysis.
3. Confirm:
   - main label is not `Confident`
   - label is closer to `Over-apologetic`, `Tentative`, `Careful`, or `Polite but tentative`
   - confidence signal is lower than clear-message examples
   - clarity can remain moderate/high
   - issue is framed as confidence/emotional pressure, not basic comprehensibility

### Anxious Follow-Up Flow

1. Paste:
   - `Hey, I know you’re probably busy, but I just wanted to check if I did something wrong because you haven’t replied.`
2. Run analysis.
3. Confirm:
   - identifies reassurance-seeking or emotional pressure gently
   - does not shame the sender
   - does not claim the recipient definitely feels guilty
   - rewrite keeps warmth while reducing pressure

### Passive-Aggressive Flow

1. Paste:
   - `Fine, don’t worry about it. I’ll just sort it out myself like usual.`
2. Run analysis.
3. Confirm:
   - identifies likely resentment/frustration/guilt pressure
   - does not call the sender manipulative or toxic
   - rewrite makes the real need clearer
   - rewrite is not fake-cheerful

### Clipboard Privacy

1. Run any analysis.
2. Click `Copy insight`.
3. Paste into a scratch buffer.
4. Confirm:
   - original message text is not included
   - derived insight is included
   - no raw optional context is included
5. Click rewrite reveal and `Copy`.
6. Confirm only the rewrite text is copied.

### Feedback Flow

1. Run an analysis.
2. Click one feedback option.
3. Confirm:
   - UI shows saved status
   - no raw message text is sent in the feedback-only request payload
   - metadata contains only safe fields

### Rate-Limit Smoke Test

1. In production-like mode, run several analyses from the same IP.
2. Confirm burst limit message appears after rapid repeated requests.
3. Confirm daily limit behavior if intentionally testing quota.
4. Do not use real sensitive messages for rate-limit testing.

### Accessibility / Interaction Smoke Test

1. Tab through textarea, selector, buttons, result cards, rewrite button, and feedback buttons.
2. Confirm focus states are visible.
3. Confirm result cards can be opened with keyboard activation.
4. Enable reduced motion and confirm the app remains usable.
5. Test mobile width for text wrapping and button fit.

### Final Launch Pass

1. Run fixtures 1, 2, 3, 4, 8, 10, 12, and 14 from `docs/prompt-test-fixtures.md`.
2. Confirm expected `This Looks Clear` behavior.
3. Confirm anxious/pressure-heavy examples do not trigger clear-message reassurance.
4. Confirm rewrites are optional for low-risk messages.
5. Confirm medium/high-risk rewrites are calmer but still honest.
6. Confirm no copied insight includes the original message.
