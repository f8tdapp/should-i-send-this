# BetweenLines AI Project Build Record

Generated: 2026-06-18  
Repository: `https://github.com/f8tdapp/should-i-send-this.git`  
Branch inspected: `main`  
HEAD inspected: `c235258` (`Add prompt test fixtures`)  
Working tree state at inspection time: local modifications in `app/api/analyze/route.ts` and `app/page.tsx`.

This record is an evidence-based handover for the BetweenLines AI app. It separates what is confirmed in code, what is documented only, and what is currently uncommitted/local.

## 1. What The App Is

BetweenLines AI is a single-page, privacy-first pre-send communication intelligence app. It lets a user paste a draft message and receive a structured read on how the message may come across before they send it.

Confirmed in code:

- Main interactive app: `app/page.tsx`.
- Analysis API route: `app/api/analyze/route.ts`.
- Brand metadata and generated social assets: `app/layout.tsx`, `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`.

The visible product name is `BetweenLines AI`. The package name remains `should-i-send-this` in `package.json`.

## 2. What Problem It Solves

The product helps users understand the gap between intent and possible reception before sending a message. The app frames this as the `Perception Gap(TM)`: what the user likely means versus what the recipient may hear.

Confirmed in code:

- The homepage headline says: "See the gap between what you mean and what others may hear." in `app/page.tsx`.
- The result deck includes cards for communication interpretation, `Perception Gap(TM)`, and likely landing in `app/page.tsx`.
- The backend prompt defines the Communication Intelligence Framework in `app/api/analyze/route.ts`.

## 3. Current Product Positioning And Branding

Confirmed in code:

- Product name: `BetweenLines AI`.
- Positioning line in metadata and UI: "Communication intelligence designed to create clarity, not chaos."
- Brand promise: private clarity before sending, not therapy, not mind-reading.
- Signature framework: `Perception Gap(TM)`.
- Visual identity: calm dark slate/navy app chrome, warm off-white content surfaces, layered-line mark with a small dot.

Brand behavior confirmed in prompt:

- Use uncertainty language such as "may", "could", and "might".
- Do not claim to know what someone definitely thinks.
- Avoid harsh labels such as "manipulative", "toxic", "desperate", "needy", "pathetic", "red flag", or "clingy".
- Reassure users when the message is already clear instead of manufacturing a problem.

Brand evolution confirmed in Git history:

- `21f39f8` rebranded the app to `TextPanic`.
- Later commits moved from `TextPanic` to `BetweenLines AI`, especially `9401734`, `ac02f20`, and `5f213d7`.

## 4. Current Tech Stack

Confirmed in `package.json`:

- Next.js `16.2.7`
- React `19.2.4`
- React DOM `19.2.4`
- TypeScript `^5`
- Tailwind CSS `^4` via `@tailwindcss/postcss`
- ESLint `^9` with `eslint-config-next`
- OpenAI SDK `^5.0.0`
- Upstash Redis and rate limit packages:
  - `@upstash/redis`
  - `@upstash/ratelimit`
- Vercel Analytics and Speed Insights:
  - `@vercel/analytics`
  - `@vercel/speed-insights`
- PostHog browser analytics:
  - `posthog-js`
- `html-to-image` is installed but no current import was found in app code.

Scripts:

- `npm.cmd run dev` -> `next dev`
- `npm.cmd run build` -> `next build`
- `npm.cmd run start` -> `next start`
- `npm.cmd run lint` -> `eslint`

Config files:

- `next.config.ts`: empty/default Next config.
- `tsconfig.json`: strict TypeScript, bundler module resolution, Next plugin, path alias `@/*`.
- `eslint.config.mjs`: Next core web vitals and TypeScript config.
- `postcss.config.mjs`: Tailwind PostCSS plugin.
- `.gitignore`: ignores `.env*`, `.next`, `node_modules`, build output, tsbuild info, and Vercel metadata.

Environment variable names present locally, without values:

- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

## 5. Main User Flow

Confirmed in `app/page.tsx`:

1. User lands on a single-page app.
2. User pastes a message into the textarea.
3. User can choose a communication style from:
   - Not sure
   - Clear and direct
   - Warm and diplomatic
   - Professional / formal
   - Casual
   - Gentle but firm
   - Low-pressure
   - Globally neutral
4. User clicks `Interpret my message`.
5. Client posts to `/api/analyze` with `message` and, when selected, a `desiredTone` context value.
6. API validates and rate-limits the request, then calls OpenAI or demo fallback.
7. UI normalizes the response shape and computes a main label.
8. UI displays:
   - main label chip
   - tone signal
   - confidence score
   - clarity score
   - guided insight card deck
   - deeper read
   - copied-insight privacy line
   - optional rewrite reveal
   - feedback buttons
9. User may copy the insight or copy the rewrite.
10. User may submit safe feedback tags.

## 6. Key Files And What Each One Does

Confirmed in repository:

- `app/page.tsx`: full client-side UI and interaction logic. Contains textarea, communication style selector, loading states, result deck, clear-message handling, rewrite reveal, clipboard copying, safe feedback submission, and PostHog event capture calls.
- `app/api/analyze/route.ts`: backend route for analysis and feedback. Contains request validation, optional context validation, rate limiting, OpenAI prompt construction, OpenAI response parsing, deterministic demo fallback, result normalization, safe feedback logging, and debug metadata handling.
- `app/lib/analytics.ts`: PostHog initialization and event capture helper. Captures only a small typed property set.
- `app/layout.tsx`: global metadata, fonts, Vercel Analytics, and Speed Insights.
- `app/globals.css`: Tailwind import, theme variables, app animations, and reduced-motion handling.
- `app/opengraph-image.tsx`: generated Open Graph image for BetweenLines AI.
- `app/icon.tsx`: generated app icon.
- `app/apple-icon.tsx`: generated Apple touch icon.
- `docs/prompt-calibration.md`: product-specific prompt calibration notes, but currently stale in at least the prompt version.
- `docs/prompt-test-fixtures.md`: manual regression fixture suite for prompt and result behavior.
- `README.md`: stock create-next-app README; not product-specific.
- `AGENTS.md`: local instruction to read Next docs because this Next version has breaking changes.
- `CLAUDE.md`: points to `AGENTS.md`.

## 7. Major Features Already Built

Confirmed in code:

- Single-page pre-send message analysis UI.
- Communication style selector that sends optional `desiredTone` context.
- Character limit at 750 characters on both client and server.
- Loading message rotation.
- Result deck with active/inactive cards.
- `Perception Gap(TM)` result card.
- Intent vs impact breakdown.
- `Most Revealing Line` deeper read.
- Confidence and clarity scores.
- Communication Intelligence score.
- Main label/severity chip.
- Clear-message outcome: `This Looks Clear`, with optional polish language.
- Optional rewrite reveal flow.
- Clipboard copy for insight and rewrite.
- Privacy line near input: original message not included in copied insights.
- Subtle guardrail that the app does not read minds.
- Feedback buttons for usefulness and rewrite quality.
- Safe feedback-only API path.
- Demo fallback when `OPENAI_API_KEY` is missing.
- Generated metadata images/icons.
- Vercel Analytics and Speed Insights.
- PostHog browser analytics when configured.
- Upstash-backed daily and burst rate limits when configured.

## 8. Backend/API Logic Already Built

Confirmed in `app/api/analyze/route.ts`:

- POST-only route using Web `Request` / `Response`.
- Request body validation.
- Message trimming and length limit.
- Optional context fields:
  - `relationshipContext` max 180 chars
  - `desiredTone` max 80 chars
  - `messageGoal` max 160 chars
- Safe feedback parsing and allowlisted tags.
- Safe feedback metadata parsing with bounded numeric fields.
- Rate limit:
  - daily: 5 requests per 1 day
  - burst: 3 requests per 30 seconds
  - disabled in local development
- OpenAI model: `gpt-4.1-mini`.
- OpenAI timeout: 20 seconds.
- OpenAI response storage disabled with `store: false`.
- OpenAI temperature: `0.2`.
- OpenAI max output tokens: `780`.
- JSON-only prompt and parser.
- Fenced JSON extraction if the model returns Markdown.
- Normalization fallback for malformed/missing fields.
- Demo fallback for:
  - missing OpenAI key
  - empty OpenAI response
  - JSON parse failure
- Safe production response omits debug metadata.
- Development responses include safe debug metadata.
- Error responses use safe messages and safe error details.

## 9. Frontend/UI Logic Already Built

Confirmed in `app/page.tsx`:

- Client Component (`"use client"`).
- Local state for message, loading, result, errors, rewrite visibility, copied states, active insight card, viewed cards, feedback status, and communication style.
- `normalizeAnalysisResult` for API response shape stability.
- `getReadSeverity` for main label selection.
- `isClearMessageResult` for `Looks Clear` behavior.
- Current uncommitted `hasTentativeApologeticSignal` for preventing tentative over-apologetic messages from being labeled `Confident`.
- Signature phrase matching for subtext variety.
- Safe analytics properties:
  - character count
  - severity
  - coarse detected language label
- Clipboard copy for rewrite only and copied insight summary.
- Feedback API call with safe metadata only.
- Reduced-motion handling for thought rotation and rewrite reveal.
- UI does not expose accounts, saved history, dashboards, browser extension, sharing pages, subscriptions, or storage controls.

## 10. Privacy And Security Decisions Already Implemented

Confirmed in code:

- Raw messages are sent to the backend for analysis, but no app database write exists in this repository.
- OpenAI call uses `store: false`.
- API logs safe errors only through `getSafeErrorDetails`; raw message text is not intentionally logged.
- Safe feedback logging excludes raw message text, raw analysis text, raw rewrite, raw optional context, and raw unvalidated feedback strings.
- Production API responses remove debug metadata.
- Copied insight explicitly omits the original user message.
- Clipboard insight includes derived analysis only, not the raw draft.
- PostHog event properties are limited to safe metadata in `app/lib/analytics.ts` and `getSafeAnalyticsProperties`.
- `.env*` files are gitignored.
- Rate limiting uses IP from `x-forwarded-for` or `anonymous`.

Needs confirmation:

- There is no separate server/platform logging configuration in this repository. Hosting logs may still capture request metadata outside the app code.
- The local `.env.local` exists and contains service credentials, but values were not inspected or recorded.

## 11. Prompt And AI-Analysis Behavior Already Implemented

Confirmed in `app/api/analyze/route.ts`:

- Current local prompt version: `betweenlines-ci-v2.1.1` in the working tree.
- Current committed prompt version at HEAD appears to be `betweenlines-ci-v2.1.0` based on local diff.
- Model: `gpt-4.1-mini`.
- Framework:
  - Perception Gap
  - Emotional Pressure
  - Confidence Signal
  - Hidden Subtext
  - Communication Clarity
- Required JSON shape includes:
  - `tone`
  - `confidenceScore`
  - `clarityScore`
  - `communicationIntelligenceScore`
  - `classification`
  - `communicationFramework`
  - `emotionalInterpretation`
  - `perceptionGap`
  - `intentVsImpact`
  - `mostRevealingLine`
  - `recipientLikelyPerception`
  - `improvedRewrite`
- Prompt includes anti-overinterpretation rules.
- Prompt includes language/cultural awareness guidance.
- Prompt includes rewrite rules that preserve intent and avoid HR/therapy language.
- Prompt supports clear-message reassurance and optional polish behavior.
- Local deterministic classifier/fallback categorizes general, work, dating, apology, friendship, family, angry, passive-aggressive, tentative, and calm/healthy patterns.

Uncommitted/local prompt behavior:

- `betweenlines-ci-v2.1.1` adds explicit guidance not to confuse clarity with confidence.
- Repeated softeners such as `sorry`, `probably annoying`, `don't want to be a pain`, `was wondering`, `maybe`, and `had a chance` cap confidence in normalization/demo fallback.

## 12. Analytics, Rate Limit, And Cost-Control Logic

Confirmed in code:

- Vercel Analytics: mounted in `app/layout.tsx`.
- Vercel Speed Insights: mounted in `app/layout.tsx`.
- PostHog:
  - initialized only in browser
  - requires `NEXT_PUBLIC_POSTHOG_KEY`
  - optional host via `NEXT_PUBLIC_POSTHOG_HOST`
  - pageview capture disabled
  - person profiles set to `identified_only`
- Client events include:
  - `text_analyzed`
  - `rewrite_revealed`
  - `rewrite_copied`
  - `result_copied`
  - feedback-related calls through API metadata
- Event type also includes share-card events, but no current share-card UI was found.
- Upstash rate limits:
  - daily 5 per day
  - burst 3 per 30 seconds
  - disabled in development
- OpenAI cost controls:
  - 750 character input limit
  - 20 second timeout
  - `max_output_tokens: 780`
  - `temperature: 0.2`
  - `store: false`

## 13. Branding Changes Already Made

Confirmed in Git history:

- Early app evolved through visual/background iterations.
- `21f39f8` rebranded to TextPanic.
- `2561afb`, `632142d`, and `210081b` refined TextPanic branding and UX.
- `9401734` and `ac02f20` moved toward BetweenLines AI homepage/tagline positioning.
- `5f213d7` updated BetweenLines branding, social metadata, icons, and Open Graph imagery.
- `21e976a` added clear-message outcome and privacy reassurance.

Current brand confirmed in code:

- BetweenLines AI
- Communication intelligence
- Clarity, not chaos
- Perception Gap(TM)
- Private by design

## 14. Removed Or Deprecated Features

Confirmed or strongly indicated:

- TextPanic branding has been superseded by BetweenLines AI. Some backend rate-limit prefixes still use `textpanic:analyze:*`; this is implementation residue, not visible UI branding.
- Share-card functionality appears removed or incomplete:
  - `html-to-image` remains in `package.json`.
  - `share_card_downloaded`, `share_card_download_failed`, and `share_card_preview_opened` remain in `app/lib/analytics.ts`.
  - No current import or visible UI for `html-to-image` or share-card actions was found.

Not implemented:

- Accounts
- Saved history
- Subscriptions
- Dashboards
- Browser extension
- Public sharing
- Country/culture modes
- Raw message storage

## 15. Current Git Status

Command evidence:

```text
## main...origin/main
 M app/api/analyze/route.ts
 M app/page.tsx
```

Before this document was added, local changes were only in:

- `app/api/analyze/route.ts`
- `app/page.tsx`

After this document is created, `docs/project-build-record.md` is also uncommitted.

HEAD:

- `c235258` (`Add prompt test fixtures`)

Remote:

- `origin https://github.com/f8tdapp/should-i-send-this.git`

## 16. Recent Commit History With Plain-English Summaries

Source: `git log --oneline --decorate -n 30` plus changed-file inspection for recent commits.

- `c235258` - Added `docs/prompt-test-fixtures.md`, a manual prompt regression suite.
- `21e976a` - Added clear-message outcome, privacy reassurance, and optional-polish rewrite framing.
- `8b6b93d` - Added feedback loop UI/API handling and global communication guardrails.
- `b1e96ea` - Refined safe feedback and analysis tone in API route.
- `076be3f` - Stabilized analysis output and safe feedback flow.
- `992b840` - Refined result deck and simplified insight actions.
- `dcd7b01` - Refined rewrite card copy.
- `5f213d7` - Updated BetweenLines branding, metadata, generated icons, Open Graph image, analytics helper, and homepage.
- `c95652b` - Major privacy and prompt-calibration hardening; added `docs/prompt-calibration.md`.
- `ac02f20` - Updated BetweenLines AI tagline and homepage polish.
- `9401734` - Refined BetweenLines AI homepage and simplified onboarding.
- `43d450f` - Added launch-readiness metadata, performance polish, generated icons/social image, and package changes.
- `1b80325` - Added API protection, rate limiting, and analytics-related logic.
- `22ed0c2` - Earlier rate limiting / analytics / API protection pass.
- `210081b` - Polished TextPanic reveal interaction and hero UX.
- `632142d` - Refined TextPanic input actions and UX polish.
- `2561afb` - Refined TextPanic branding and hero.
- `21f39f8` - Rebranded app to TextPanic.
- `b96d7d2` - Improved subtext phrase matching and variety.
- `e100823` - Refined pre-send reflection helper state.
- `1127b9e` - Refined emotional result typography.
- `9799c3d` - Added darker regret-driven social background.
- `ba9f5ce` - Strengthened social background bubbles.
- `886d5ff` - Improved app surface separation and youthful palette.
- `e0f2af0` - Shifted background palette toward youthful social app feel.
- `f51fccd` - Strengthened outer background color.
- `485a452` - Clarified and fixed visible page background layer.
- `469610b` - Fixed outer page background color.
- `c07d56a` - Rebalanced visual hierarchy and background warmth.
- `4967a01` - Earlier visual hierarchy/background warmth pass.

Older commit details beyond titles and touched files were not fully inspected. Needs confirmation if exact historical intent matters.

## 17. Uncommitted Local Changes And Apparent Purpose

Confirmed by `git diff`:

### `app/api/analyze/route.ts`

Uncommitted changes:

- Prompt version changed from `betweenlines-ci-v2.1.0` to `betweenlines-ci-v2.1.1`.
- Added `hasRepeatedTentativeSofteners`.
- Demo fallback confidence score now caps repeated-softener messages lower.
- OpenAI result normalization caps confidence at `6` for repeated-softener messages.
- Prompt now explicitly says not to confuse clarity with confidence.
- Prompt says repeated softeners should not be labeled confident unless tone is clearly assured.

Apparent purpose:

- Fix classification/display mismatch where overexplained apologetic messages were labeled `Confident`.

### `app/page.tsx`

Uncommitted changes:

- Added `hasTentativeApologeticSignal`.
- `getReadSeverity` now returns `Over-apologetic` before the broader `Confident` label when repeated softeners/tentative signals are present.
- `Looks Clear` still runs before this override.

Apparent purpose:

- Keep clear-message flow intact while preventing tentative/apologetic messages from displaying as confident.

## 18. Implemented But Not Fully Documented

Confirmed in code, missing or under-documented in docs:

- Clear-message UI state and optional-polish rewrite copy.
- Communication style selector and `desiredTone` frontend flow.
- Safe feedback-only request path and feedback metadata schema.
- Vercel Analytics and Speed Insights.
- PostHog event helper and safe event property constraints.
- Generated Open Graph image and app icons.
- Upstash burst and daily rate limits.
- Local demo fallback behavior when OpenAI key is missing.
- Current uncommitted confidence-labeling fix.

## 19. Documented But Not Found Or Stale In Code

Confirmed gaps:

- `README.md` is still the generic create-next-app README and does not describe BetweenLines AI.
- `docs/prompt-calibration.md` says prompt version `betweenlines-ci-v2.0.0`, but current code is later:
  - committed HEAD after clear-message work: `betweenlines-ci-v2.1.0`
  - local uncommitted working tree: `betweenlines-ci-v2.1.1`
- `docs/prompt-calibration.md` safe feedback example includes tags such as `clear`; `clear` is not in the current backend allowlist.
- Share-card analytics event types exist, and `html-to-image` is installed, but no current share-card UI/import was found.
- API accepts `relationshipContext` and `messageGoal`, but current UI only sends `desiredTone`.

Needs confirmation:

- Whether share-card behavior was intentionally removed, postponed, or accidentally left partially implemented.
- Whether optional context fields are reserved for future UI or leftover API surface.

## 20. Known Risks, TODOs, Bugs, Or Unfinished Areas

Confirmed or evidence-backed:

- Documentation drift:
  - prompt version in `docs/prompt-calibration.md` is stale.
  - README is not product-specific.
- Current uncommitted changes are validated manually per prior work but not committed.
- Share-card dependency/event residue may confuse future maintainers.
- Upstash rate-limit prefixes still use `textpanic`, which is stale brand naming in infrastructure keys.
- The backend has large prompt text inline in the route; prompt iteration requires code edits and deploys.
- The route logs safe feedback metadata with `console.info`; hosting-level logging retention is outside this repo.
- The API accepts optional context fields not exposed in UI, so API and UI capability are not aligned.
- No automated tests exist for prompt fixtures or frontend label mapping.
- No explicit CI config was found (`.github` absent).
- `metadataBase` warning appeared during prior builds; no `metadataBase` is set in `app/layout.tsx`.
- Local PowerShell output showed encoding/mojibake for smart quotes in terminal output. File contents may be fine, but Windows console display can be misleading.

Needs confirmation:

- Production hosting settings, logging retention, and environment variable configuration.
- Actual deployed URL and Vercel project settings.
- Whether daily limit of 5 reads is a product decision or temporary cost control.
- Whether PostHog is currently configured in production.

## 21. Recommended Next Steps In Priority Order

1. Commit or intentionally discard the current confidence-labeling fix.
2. Update `docs/prompt-calibration.md` to current prompt version and current safe feedback tags.
3. Replace stock `README.md` with a product-specific developer README.
4. Decide whether share-card code/dependency/event types should be restored or removed.
5. Rename Upstash prefixes from `textpanic:*` to `betweenlines:*` if preserving old counters is not required.
6. Add automated unit tests for:
   - `isClearMessageResult`
   - tentative/apologetic severity override
   - clipboard formatting omitting original text
   - safe feedback metadata filtering
7. Add lightweight API tests for validation, rate-limit behavior, and malformed model output normalization.
8. Consider moving prompt text into a versioned module or prompt file to reduce route size and improve reviewability.
9. Add CI for lint, TypeScript, and build.
10. Confirm production privacy/logging posture outside the repo.

## 22. Scaling And Monetization Ideas Implied By Code/Docs

Implemented foundations:

- Daily rate limiting and burst limiting.
- Safe event analytics.
- Safe feedback loop by prompt version/model/classification.
- Manual fixture suite for prompt QA.

Ideas implied but not implemented:

- Free daily private reads with paid higher limits.
- Prompt-quality dashboard using only aggregate safe metadata.
- Team/workplace tier focused on professional communication review.
- Anonymous prompt-evaluation pipeline using synthetic fixtures.
- Premium tone/context controls beyond current `desiredTone` selector.
- Browser extension or compose integrations are not implemented and should be treated as future product ideas only.
- Saved history is intentionally absent; adding it would conflict with current privacy posture unless carefully designed.

## 23. Final Handover Summary

BetweenLines AI is a compact Next.js 16 app with one main UI file and one main API route. The current product is a privacy-first communication intelligence tool centered on the `Perception Gap(TM)`. It analyzes pasted drafts, returns structured interpretation, shows a card-based result deck, and offers optional rewrite polish.

The backend is more sophisticated than the file count suggests. It validates input, limits message length, supports optional context, rate-limits through Upstash, calls OpenAI with `store: false`, normalizes model output, has deterministic fallbacks, strips debug metadata in production, and logs only safe feedback metadata.

The frontend handles most of the product experience in `app/page.tsx`: message entry, communication style, loading, result deck, clear-message reassurance, rewrite reveal, copying, and feedback. The app currently has no accounts, storage, saved history, subscriptions, dashboards, extension code, or public sharing UI.

The main maintenance risks are documentation drift, lack of automated tests, stale TextPanic/share-card residue, and large inline prompt text. The most urgent local decision is whether to commit the uncommitted confidence-labeling fix in `app/api/analyze/route.ts` and `app/page.tsx`.
