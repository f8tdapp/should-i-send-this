# BetweenLines AI — Product Roadmap

**Private planning document. Timing and scope remain subject to evidence.**

## Immediate: release confidence and validation

- [ ] Commit and deploy the latest intended changes; record branch, SHA, date, and rollback point.
- [ ] Verify `/privacy`, `/terms`, and `/disclaimer` are live and linked from the production homepage.
- [ ] Verify feedback payload privacy in browser network tools and server logs: no raw message, rewrite, quote, optional context, or full analysis.
- [ ] Maintain and run prompt test fixtures against the exact release prompt/model; expand automation later.
- [ ] Complete a rate-limit and cost audit covering the 5/day and 3/30-second controls, missing-Upstash behavior, and feedback-only requests.
- [ ] Complete production privacy review across Vercel, OpenAI, Upstash, PostHog, logs, retention, access, and public wording.
- [ ] Soft-launch to a small synthetic-data-first tester cohort with a feedback and incident process.

## Short-term: learn and sharpen

- [ ] Test an optional message-context selector without encouraging disclosure of sensitive details.
- [ ] Refine the existing optional communication-style selector based on evidence, not feature count.
- [ ] Build a privacy-safe analytics dashboard for volume, repeat use, safe feedback, latency, failures, and cost.
- [ ] Improve mobile polish, keyboard flow, loading states, and accessibility based on real device testing.
- [ ] Refine landing-page copy and positioning through controlled tests.
- [ ] Ask an IP/trade mark attorney to review BetweenLines AI, Perception Gap™, ownership, domains, and filing priorities.

## Medium-term: business-model tests

- [ ] Test freemium usage caps with friendly capacity messaging.
- [ ] Test a paid plan only after repeat usage and willingness-to-pay signals exist.
- [ ] Calibrate prompt versions using synthetic fixtures and aggregate, privacy-safe feedback.
- [ ] Explore a browser extension with a separate threat model, permission design, and minimal data access.
- [ ] Research Gmail, LinkedIn, and Outlook integration feasibility, platform policy, security, distribution, and strategic fit.

## Long-term: platform and strategic paths

- [ ] Explore messaging-platform integrations that preserve user control and private-by-default processing.
- [ ] Evaluate an API/licensing model with clear safety, retention, support, and usage terms.
- [ ] Evaluate a B2B/workplace version focused on communication clarity—not employee surveillance.
- [ ] Develop an acquisition/strategic-partnership path around validated usage, clean IP, integration readiness, and a credible category position.

## Roadmap gates

Do not advance solely because a feature is technically possible. Require evidence for recurring use, analysis quality, privacy feasibility, unit economics, and strategic fit. Accounts, saved raw-message history, broad inbox access, and public sharing remain deferred until their need clearly outweighs their privacy cost.
