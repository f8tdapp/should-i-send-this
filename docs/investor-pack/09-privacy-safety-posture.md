# BetweenLines AI — Privacy and Safety Posture

**Private working summary. Validate against production configuration before external use.**

## Positioning

BetweenLines AI is designed as a privacy-first, pre-send communication-guidance product. The goal is to provide a useful read without creating a stored archive of sensitive conversations or turning private drafts into analytics content. “Privacy-first” is a design direction, not permission to make absolute claims that have not been audited across every provider.

## Raw message handling

- Users voluntarily submit a draft for analysis.
- The raw draft must be transmitted to the application server and AI provider to generate a live result.
- Application code does not intentionally write raw messages to an app database.
- The OpenAI request sets `store: false` where supported by the configured API.
- Application error/feedback logging is designed to exclude raw drafts.
- Vercel/platform logs, OpenAI account/project retention, network/security systems, and production access controls still require external confirmation.

## Feedback payload rules

Feedback-only requests are intended to contain:

- An allowlisted feedback label.
- Derived classification and bounded score metadata.
- Rewrite-visible state and a rounded character-count signal.
- Prompt/model/success metadata available to the server.

They must contain:

- **No raw message text.**
- **No rewrite text.**
- **No quote text.**
- **No optional context.**
- **No full analysis text.**

Only derived metadata should be retained or used for aggregate quality work. This behavior should be reverified in browser network requests, application logs, analytics events, and production infrastructure after material changes.

## Analytics and copied content

- Browser analytics are limited in code to coarse derived properties; raw drafts and full results must never be analytics properties.
- Copied insights omit the original message. Copying a rewrite is an explicit user action.
- Vercel Analytics/Speed Insights and PostHog activation, configuration, geography, access, and retention need production confirmation.

## Safety and legal posture

- Static Privacy, Terms, and Disclaimer pages have been added to the app.
- Homepage/footer copy states that BetweenLines AI provides communication guidance only and the user is responsible for what they send.
- The service is not professional advice, including legal, medical, mental health, therapy, relationship, employment, safety, or financial advice.
- The app is not for emergencies, crises, or dangerous situations.
- Outputs may be imperfect or wrong and do not guarantee another person's interpretation or response.
- Users are told not to paste highly sensitive, illegal, emergency, credential, medical/legal/financial, trade-secret, or confidential third-party information.
- Legal copy is a pre-launch placeholder pending qualified review.

## Model behavior guardrails

- Use uncertainty language and do not claim to read minds.
- Do not diagnose, shame, fuel paranoia, or manufacture hidden conflict.
- Avoid stigmatizing labels and exaggerated interpretations.
- Reassure when a message is already healthy and clear.
- Preserve direct boundaries and cultural/dialect variation when they are not a real clarity problem.

## Remaining privacy and safety checks

- [ ] Confirm live revision and production URL.
- [ ] Audit Vercel request/function/log retention and access.
- [ ] Confirm OpenAI project settings, region, retention, and contractual terms.
- [ ] Confirm Upstash contains only rate-limit data and review IP handling/retention.
- [ ] Confirm PostHog events, settings, retention, consent needs, and production activation.
- [ ] Inspect real production-like feedback and analytics payloads.
- [ ] Review feedback-only abuse/rate limiting.
- [ ] Establish incident response, deletion/contact handling, access review, and vendor register.
- [ ] Obtain legal review of privacy, terms, disclaimer, cookies/analytics, age/territory, and data-transfer requirements.
- [ ] Keep public privacy claims aligned with verified infrastructure—not only application code.
