# BetweenLines AI — Build Record Summary

**Private working document — repository status reviewed 21 June 2026**

## Origin and product evolution

The project began as `should-i-send-this`, evolved through **TextPanic**, and was repositioned as **BetweenLines AI**. The early premise—helping someone pause before sending—remains, but the current product is less panic-driven and more durable: calm communication intelligence designed to create clarity, not chaos.

## Brand and product positioning

BetweenLines AI is positioned as privacy-first, pre-send communication intelligence. Its signature framework is **Perception Gap™**: what the user likely means versus what another person may hear. Visible branding, page metadata, generated icons, Open Graph artwork, prompt identity, and main user-facing copy use BetweenLines AI. Internal residue includes the package/repository name and `textpanic:analyze:*` Upstash key prefixes.

## Major build phases

### Result deck simplification

The interface moved toward one focused input and a guided three-card result deck: Between the Lines/This Looks Clear, Perception Gap™, and How This Might Land. The deeper read is expandable, and the rewrite is secondary and optional. Old share/export behavior is not visible; `html-to-image` and share analytics event names remain for review.

Relevant files: `app/page.tsx`, `app/globals.css`.

### Backend and OpenAI hardening

The analysis route now includes input/context validation, structured JSON expectations, response extraction/parsing, normalization, deterministic fallback analysis, safe errors, a 20-second timeout, prompt/model debug metadata in development, and production rate-limit logic. Current constants are prompt `betweenlines-ci-v2.1.1`, model `gpt-4.1-mini`, temperature `0.2`, and maximum output `780` tokens. The OpenAI request uses `store: false`.

Relevant file: `app/api/analyze/route.ts`.

### Privacy improvements

Application code avoids intentional raw-message persistence and raw-message logging. Copied insights omit the draft. Browser analytics use coarse derived properties. Production responses omit debug metadata. Optional context is bounded and not intended for analytics or logs. External platform/provider retention and production settings still need confirmation.

Relevant files: `app/api/analyze/route.ts`, `app/page.tsx`, `app/lib/analytics.ts`.

### Feedback loop

The UI offers six feedback labels. Feedback-only requests contain allowlisted labels and bounded derived metadata, not raw draft, rewrite, quote, optional-context, or full-analysis text. The server validates and logs safe metadata. Production log destination/retention and feedback-only abuse controls need confirmation.

### Consistency refinement

The prompt separates clarity from confidence, reassures on healthy messages, caps confidence for repeated tentative softeners, and avoids overinterpreting short or neutral drafts. The frontend also prevents apologetic/tentative messages from receiving an overly confident primary label. Manual fixtures exist for common work, friendship, family, dating, apology, and conflict cases.

Relevant files: `app/api/analyze/route.ts`, `app/page.tsx`, `docs/prompt-test-fixtures.md`.

### Direct “you” language

The experience uses immediate, practical headings such as “What you likely mean” and “What they may hear.” It avoids accusatory certainty: “may add pressure” is preferred to “you are pressuring them.”

### Global communication guardrails

Prompt rules avoid treating one communication culture as universal, over-correcting dialect/code-switching, or forcing every message into corporate English. A Globally neutral style is available. Quality across languages and cultures has not yet been comprehensively evaluated.

### Pre-launch legal pages

Static App Router pages now exist at `/privacy`, `/terms`, and `/disclaimer`, with footer links and a calm homepage responsibility statement. Copy is explicitly a practical placeholder pending qualified legal review.

Relevant files: `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/disclaimer/page.tsx`, `app/components/legal-page.tsx`, `app/page.tsx`.

## Current known status

- Repository branch reviewed: `main`.
- HEAD reviewed: `6beec38` — `Add feedback loop and pre-launch legal protections`.
- Legal pages and feedback loop are present in the reviewed repository.
- Latest production deployment, deployed SHA, URL, environment variables, OpenAI path, rate-limit enforcement, PostHog activation, and vendor retention: **needs confirmation**.
- Current usage, retention, conversion, and cost metrics: **TBD; do not infer traction**.
- Additional untracked project documentation exists locally at the time of review.

## Checks

Earlier local validation has passed lint, TypeScript, and production build, including static generation of `/privacy`, `/terms`, and `/disclaimer`. The validation results for the investor-pack creation are recorded in the task handoff. Any release must rerun checks on the exact release revision.

## Remaining confirmation list

- Confirm current changes are pushed and the exact production SHA is live.
- Confirm canonical URL and `metadataBase`.
- Confirm OpenAI, Vercel, Upstash, PostHog, and log-retention settings.
- Verify feedback payloads and copied insight privacy in a production-like session.
- Reconcile stale README/prompt-calibration documentation.
- Decide the fate of TextPanic keys and share-card residue.
- Automate prompt regression and CI.
- Complete solicitor/attorney and IP review.
