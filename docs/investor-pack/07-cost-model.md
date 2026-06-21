# BetweenLines AI — Cost Model Template

**Private working model. All unverified values are TBD.**

## Current technical inputs to verify

- Model configured in code: `gpt-4.1-mini`
- Maximum input length in app: 750 characters
- Maximum output tokens: 780
- Temperature: 0.2
- Timeout: 20 seconds
- Daily analysis limit in code: 5 per IP/day
- Burst limit in code: 3 per IP/30 seconds
- Feedback limit in code: 10 submissions per IP/hour
- Production requests fail safely when Upstash or OpenAI configuration is missing
- Production enforcement and current provider prices: **TBD**

## Cost drivers

### OpenAI API

- Model and current input/output token prices.
- Average input tokens, including system/prompt instructions and user text.
- Average output tokens and retry/fallback behavior.
- Requests that timeout, fail parsing, or are repeated.
- Future caching, batch, or model-routing discounts where applicable.

### Vercel

- Plan fee, function invocations/duration, bandwidth, build minutes, image generation, and logs.
- Preview/development traffic versus production traffic.
- Any protection, observability, or team-seat costs.

### Upstash/rate limiting

- Redis commands for analysis and feedback rate-limit checks.
- Database plan, request volume, storage, bandwidth, and region.
- Effect of burst and daily checks on command count.

### Analytics and operations

- PostHog event volume, replay settings if ever enabled, retention, and plan.
- Monitoring, error tracking, alerting, domains, email, support, tax, and legal/security costs.

## Unit-cost inputs

| Input | Value | Source/date |
|---|---:|---|
| Model used | `gpt-4.1-mini` / confirm | Code + provider pricing TBD |
| Average input tokens/request | TBD | Measure production-like samples |
| Average output tokens/request | TBD | Measure successful results |
| Input price per 1M tokens | TBD | Current official pricing |
| Output price per 1M tokens | TBD | Current official pricing |
| Model cost/request | TBD | Formula below |
| Vercel variable cost/request | TBD | Invoice/usage export |
| Upstash cost/request | TBD | Invoice/command count |
| Analytics cost/request | TBD | Plan/event volume |
| Total variable cost/request | TBD | Sum of verified inputs |

Model cost/request formula:

`(average input tokens × input price per token) + (average output tokens × output price per token)`

## Volume scenarios

| Analyses/month | Input tokens/request | Output tokens/request | Model cost/request | API subtotal | Monthly infrastructure estimate | Total estimate |
|---:|---:|---:|---:|---:|---:|---:|
| 1,000 | TBD | TBD | TBD | TBD | TBD | TBD |
| 10,000 | TBD | TBD | TBD | TBD | TBD | TBD |
| 100,000 | TBD | TBD | TBD | TBD | TBD | TBD |
| 1,000,000 | TBD | TBD | TBD | TBD | TBD | TBD |

For each scenario, record assumptions about success rate, retries, free/paid mix, feedback events, cache behavior, peak concurrency, tax, and headroom. Do not present placeholders as forecasts.

## Cost-control recommendations

- Keep rate limits and daily caps configurable, measurable, and understandable to users.
- Add OpenAI project budget alerts and an internal operating threshold below the provider limit.
- Use friendly capacity messages rather than alarming or blame-oriented errors.
- Track average and percentile input/output tokens, timeouts, retries, and fallback rate.
- Review output-token limits against actual useful response length.
- Choose models by measured quality per cost, not price alone; keep a synthetic evaluation gate for model changes.
- Separate demo/test traffic from production metrics and cost reporting.
- Monitor the feedback-only 10-per-hour limit and adjust only from real usage evidence.
- Establish a safe degraded mode and kill switch before paid acquisition.

## Decision thresholds

- Target variable gross margin: **TBD**
- Monthly API warning threshold: **TBD**
- Monthly hard operating ceiling: **TBD**
- Maximum acceptable cost per free user: **TBD**
- Maximum acceptable cost per paid user: **TBD**
- Model-switch quality threshold: **TBD**
