# BetweenLines AI — Usage Metrics Template

**Private working document. Do not invent or estimate traction.**

## Reporting period

- Period start: **TBD**
- Period end: **TBD**
- Data sources: **TBD**
- Production URL/revision measured: **TBD**
- Known tracking gaps: **TBD**

## Audience and activity

| Metric | Current period | Previous period | Definition / source |
|---|---:|---:|---|
| Total users | TBD | TBD | Define anonymous/user identity method |
| Monthly active users | TBD | TBD | At least one qualifying action in 30 days |
| Weekly active users | TBD | TBD | At least one qualifying action in 7 days |
| Daily active users | TBD | TBD | At least one qualifying action in 24 hours |
| Analyses run | TBD | TBD | Successful analysis events; exclude demos/bots if possible |
| Analyses per active user | TBD | TBD | Analyses divided by active users |
| Repeat usage | TBD | TBD | Define: e.g. users active on 2+ distinct days |

## Product behavior and quality

| Metric | Value | Numerator / denominator | Notes |
|---|---:|---|---|
| Rewrite copied rate | TBD | Rewrite copies / successful analyses | Separate reveal from copy if useful |
| Feedback submitted rate | TBD | Feedback submissions / successful analyses | Check event completeness |
| Felt accurate rate | TBD | `felt_accurate` / feedback submissions | Do not treat non-response as negative |
| Overreacted rate | TBD | `overreacted` / feedback submissions | Prompt overinterpretation signal |
| Too vague rate | TBD | `too_vague` / feedback submissions | Specificity signal |
| Missed point rate | TBD | `missed_point` / feedback submissions | Intent-understanding signal |
| Rewrite natural rate | TBD | `rewrite_natural` / rewrite feedback | Define eligible denominator |
| Rewrite fake rate | TBD | `rewrite_fake` / rewrite feedback | Define eligible denominator |

## Cost and commercial metrics

| Metric | Value | Notes |
|---|---:|---|
| Cost per analysis | TBD | Include model plus attributable infrastructure |
| OpenAI monthly cost | TBD | Reconcile provider invoice with usage |
| Vercel monthly cost | TBD | Separate fixed and usage-based cost |
| Upstash monthly cost | TBD | Add when material |
| Analytics monthly cost | TBD | PostHog/other tools |
| Paid conversion rate | TBD / not launched | Paid users / eligible users, if a plan is added |

## Retention notes

- Day 1 retention: **TBD**
- Day 7 retention: **TBD**
- Day 30 retention: **TBD**
- Cohort definition: **TBD**
- Qualitative repeat-use reasons: **TBD**
- Drop-off or trust concerns: **TBD**
- Tester/sample caveats: **TBD**

## Why these metrics matter

Investors and acquirers need evidence that the problem is recurring, the analysis is trusted, and usage can be served economically. Active-user and repeat-use metrics show whether BetweenLines solves more than a one-time curiosity. Quality feedback shows where the prompt creates value or anxiety. Rewrite behavior helps distinguish understanding from action without assuming every good result requires a rewrite. Cost per analysis and infrastructure costs establish gross-margin potential. Retention and conversion data indicate whether a standalone product, paid tier, integration, licensing model, or acquisition path is most credible.

Always state collection limits, denominator definitions, bot/demo exclusions, and sample size. Never convert unverified events into traction claims.
