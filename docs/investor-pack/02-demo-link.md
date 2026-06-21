# BetweenLines AI — Demo Guide

**Private working document — do not publish**

## Links

- **Production demo:** TODO add confirmed Vercel production URL
- **Repository:** `https://github.com/f8tdapp/should-i-send-this.git`
- **Confirmed deployed revision:** TODO

Do not circulate a production link until its revision, privacy settings, rate limits, and legal pages have been checked.

## Local demo instructions

1. Install the repository's locked dependencies with `npm.cmd ci` when a clean install is required.
2. Configure the documented environment variables locally. Never expose their values in a screen share.
3. Run `npm.cmd run dev`.
4. Open `http://localhost:3000`.
5. If `OPENAI_API_KEY` is absent, explain that the app uses a deterministic demo fallback rather than presenting it as a live model result.

## What to show

- The focused single-page input and optional communication-style selector.
- A low-risk message that earns “This Looks Clear.”
- A message with a meaningful Perception Gap™.
- The intent-versus-impact comparison.
- “How This Might Land” and the expandable deeper read.
- The optional rewrite as a secondary action.
- Privacy-safe copy and feedback behavior.
- Privacy, Terms, and Disclaimer pages.
- Mobile responsiveness if time permits.

## Recommended demo script

1. **Frame the problem:** “Most writing tools tell you how to rewrite. BetweenLines first helps you understand how your draft may land.”
2. **Show a clear message:** use `I won't be able to take this on today, but I can look at it tomorrow morning.` Point out that the product does not invent a problem or weaken the boundary.
3. **Show a gap:** use a synthetic over-apologetic follow-up. Open each result card and explain the Perception Gap™.
4. **Reveal the rewrite:** emphasize that it is optional and should preserve the user's intent and voice.
5. **Show trust details:** copied insights omit the original draft; feedback uses a safe label and derived metadata.
6. **Close with direction:** explain the soft-launch, calibration, integration, and privacy-first roadmap without claiming unverified traction.

## Demo safety

Never use real sensitive messages in a demo. Use synthetic examples without real names, contact information, workplace secrets, medical/legal/financial information, or identifiable third-party details. Do not expose API keys, `.env.local`, logs, analytics dashboards, or private feedback.

## Demo readiness checklist

- [ ] Production URL and deployed SHA confirmed.
- [ ] Lint, type-check, and build pass on the demo revision.
- [ ] OpenAI path tested with synthetic messages.
- [ ] Clear and high-gap fixtures behave as expected.
- [ ] Rate limits will not interrupt the planned sequence.
- [ ] Privacy, Terms, and Disclaimer links work.
- [ ] Copy and feedback payload behavior verified.
- [ ] No secrets, real personal data, or unrelated browser tabs are visible.
- [ ] Mobile and desktop layouts checked.
- [ ] Fallback explanation prepared in case a provider is unavailable.
- [ ] Claims about users, costs, privacy, or deployment match verified facts.
