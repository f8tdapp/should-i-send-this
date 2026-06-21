# BetweenLines AI — Complete Build Record, Roadmap, Scaling Notes & Protection Plan

## Document Purpose

This document is a complete working record of the BetweenLines AI app: what has been built, what has changed, what remains to be done, what risks still need checking, what product ideas have been discussed, and what scaling/acquisition ideas should be remembered.

The goal is that this document could be handed to a developer, advisor, solicitor, investor, or potential acquirer and they could understand:

* what the product is
* what has already been built
* why the product is different
* what technical work has been completed
* what privacy/safety work has been completed
* what still needs to be done before release
* what the scaling strategy could be
* what the long-term acquisition angle is

---

# 1. Product Overview

## Product Name

**BetweenLines AI**

## Earlier Working Names

* TextPanic
* Should I Send This
* should-i-send-this

## Current Product Category

**Pre-send communication intelligence**

## Core Promise

BetweenLines AI helps users understand how a message may land before they send it.

The product is not simply a rewrite tool. It helps users understand the possible gap between what they mean and what the recipient may hear.

## Core Positioning Line

**See the Perception Gap™ before you hit send.**

## Expanded Positioning

BetweenLines AI helps users see the difference between what they mean and what others may hear before sending a message.

It provides private communication guidance by analyzing tone, clarity, possible emotional pressure, hidden subtext, and intent-versus-impact.

## Signature Concept

**Perception Gap™**

Definition:

The difference between what the user likely means and what the recipient may hear.

## Short Explanation

Most AI writing tools help users rewrite a message. BetweenLines AI helps users understand how the message may land before they decide what to send.

## Strategic Category

BetweenLines AI should be positioned as:

**A privacy-first AI communication layer for messaging.**

Long-term, this could be useful inside:

* Messenger
* WhatsApp
* Instagram DMs
* LinkedIn messages
* Gmail
* Outlook
* Slack
* Microsoft Teams
* dating apps
* customer support tools
* workplace communication platforms

---

# 2. The Problem Being Solved

People often hesitate before sending a message because they are unsure how it sounds.

Common user worries:

* Does this sound rude?
* Does this sound needy?
* Does this sound too cold?
* Does this sound desperate?
* Does this sound passive-aggressive?
* Does this sound too emotional?
* Will they take this the wrong way?
* Am I overexplaining?
* Should I soften this?
* Should I be more direct?
* Am I being clear?

The product helps users reduce uncertainty before sending.

---

# 3. What Makes the App Different

## Not Just Rewriting

A generic AI tool can rewrite a message.

BetweenLines AI does more than rewrite. It explains the possible communication risk and the perception gap.

## The Unique Angle

The strongest angle is:

**Private pre-send communication intelligence built around the Perception Gap™.**

The app helps a user understand:

* what they likely mean
* what the recipient may hear
* how the message may land emotionally
* whether the message has hidden subtext
* whether it creates pressure
* whether it sounds clear, abrupt, anxious, warm, direct, or overly loaded
* how to make it clearer while preserving intent

## Main Product Moat

The moat is not one single feature.

The moat is the combination of:

* brand
* Perception Gap™ framework
* prompt architecture
* structured communication analysis
* privacy-first implementation
* feedback loop
* calm/nonjudgmental product tone
* trust positioning
* eventual user feedback data
* execution speed
* product taste

---

# 4. Brand and Voice

## Brand Name

**BetweenLines AI**

## Brand Feel

The app should feel:

* calm
* private
* thoughtful
* useful
* nonjudgmental
* emotionally intelligent
* clear
* trustworthy
* modern
* human

It should not feel:

* gimmicky
* clinical
* scary
* like therapy
* like a dating coach
* like a roast app
* like a generic rewrite tool
* like a public sharing tool

## Key Brand Phrases

Possible/used phrases:

* Private clarity before you hit send.
* Remove the uncertainty before you hit send.
* Understand how your message may land before you send it.
* See the Perception Gap™ before you hit send.
* What you mean vs. what they may hear.
* Most AI tools help you say it differently. BetweenLines helps you understand how it may land.

## Product Tone

The app should use language like:

* may
* might
* could
* can sometimes
* may land as
* could be heard as
* in a more formal context
* if the recipient expects a softer tone

The app should avoid:

* they definitely think
* this proves
* this is manipulative
* this is toxic
* this person will
* diagnosing emotions
* mind-reading
* certainty about the recipient

---

# 5. Current Technical Stack

## Framework

Next.js App Router

## Frontend

React / TypeScript

## Backend

Next.js API route

## AI Provider

OpenAI API

## Hosting

Vercel

## Repo

Known repo/project name:

`should-i-send-this`

## Local Windows Path

`C:\Users\mikes\projects\should-i-send-this`

## Known Branch

`main`

## Important Files

* `app/page.tsx`
* `app/api/analyze/route.ts`
* `app/layout.tsx`
* `app/opengraph-image.tsx`
* `app/lib/analytics.ts`
* `app/privacy/page.tsx`
* `app/terms/page.tsx`
* `app/disclaimer/page.tsx`
* `app/components/legal-page.tsx`
* `docs/prompt-calibration.md`
* recommended new file: `docs/betweenlines-ai-build-record.md`

---

# 6. Known Deployment Status

The latest previously confirmed production deployment was:

**Commit:** `992b840`
**Commit message:** `Refine result deck and simplify insight actions`

That production deployment was confirmed working.

After that confirmed deployment, additional work was implemented locally and passed lint/typecheck/build, but should be treated as needing confirmation unless already committed and deployed.

The later local work includes:

* safe feedback UI
* backend feedback-only path
* analysis consistency refinement
* `store: false` on OpenAI Responses call
* direct “you” language
* global communication/cultural guardrails
* pre-launch legal pages
* footer legal links
* homepage communication-guidance disclaimer

---

# 7. Known Recent Commit History

Known recent commits:

```text
992b840 Refine result deck and simplify insight actions
dcd7b01 Refine rewrite card copy
5f213d7 Update BetweenLines branding and social metadata
c95652b Harden analysis privacy and prompt calibration
ac02f20 Update BetweenLines AI tagline and polish homepage
9401734 Refine BetweenLines AI homepage and simplify onboarding
```

---

# 8. Major Build Phases Completed

## Phase 1 — Original Product Concept

The product began as a tool to help people decide whether to send a message.

It was originally closer to:

* Should I Send This?
* TextPanic
* message anxiety checker
* rewrite helper
* shareable/viral result tool

## Phase 2 — Brand Shift to BetweenLines AI

The product was repositioned as:

**BetweenLines AI**

The old TextPanic-style energy was reduced.

The product moved away from:

* public sharing
* gimmick behavior
* “panic” framing
* too many cards
* generic rewrite positioning

The product moved toward:

* private clarity
* pre-send communication intelligence
* Perception Gap™
* trust
* privacy
* structured insight

## Phase 3 — Backend Prompt and Privacy Hardening

The backend route was strengthened.

Work completed in `app/api/analyze/route.ts` included:

* prompt versioning
* model constant
* safe debug metadata
* token usage capture
* stronger validation
* optional context fields
* timeout/OpenAI failure metadata
* raw-text-safe error logging
* lightweight classification
* fallback normalization
* safe feedback tracking with derived metadata only
* anti-overinterpretation guardrails
* no mind-reading rules
* no false certainty rules
* no harsh labels
* preserve user intent
* natural human rewrite guidance

A documentation file was also created:

`docs/prompt-calibration.md`

## Phase 4 — Privacy Cleanup

Privacy improvements included:

* removed raw `feedback.tags` logging
* removed debug from production responses
* consolidated UI reset logic
* trimmed duplicate prompt rules while keeping safety
* avoided raw user text in analytics/logging
* kept feedback tracking derived and safe

## Phase 5 — Branding Cleanup

Files changed:

* `app/layout.tsx`
* `app/page.tsx`
* `app/opengraph-image.tsx`
* `app/lib/analytics.ts`

Completed:

* removed visible/public TextPanic references
* removed `textpanic.com` from share-card/social-facing areas
* renamed share-card filename to BetweenLines naming
* updated Open Graph image/footer to BetweenLines AI
* renamed internal frontend helper symbols from TextPanic to BetweenLines naming

Intentionally left:

* private `package.json` name `should-i-send-this`
* old Upstash rate-limit prefixes if changing them could affect behavior
* safety prompt wording referencing “roast language,” because it was not public branding

## Phase 6 — Rewrite Card Copy

The rewrite card was refined.

Preferred copy:

* Heading: “A Clearer Version”
* Supporting line: “Use this as a starting point — edit it so it still sounds like you.”
* Button: “Copy clearer version”

The rewrite should feel optional and helpful, not commanding.

Avoid:

* “Send this instead”
* “Use this”
* anything that implies the app knows better than the user

## Phase 7 — Result Deck Simplification

The result deck was simplified.

Primary visible cards:

* Between the Lines
* Perception Gap™
* How This Might Land

Previously separate deeper insights were moved into an optional “Deeper read” section:

* Most Revealing Line
* Hidden Subtext
* Confidence Signal
* Emotional Pressure
* Intent vs Impact details

The Perception Gap™ card now includes:

* what you likely mean
* what they may hear

The active/opened card styling was unified with the dark navy hero style.

The old share/export/preview flow was removed or significantly de-emphasized.

The “Copy insight” area was simplified and made more privacy-conscious.

## Phase 8 — Consistency Refinement

Problem observed:

The same message entered twice produced similar but noticeably different results.

Concern:

Users may lose trust if the same input produces inconsistent communication reads.

Fix implemented in `app/api/analyze/route.ts`:

* `temperature: 0.2`
* `top_p` left unset
* `max_output_tokens` unchanged at 780
* `store: false` added to the Responses call
* prompt guidance added for stable/repeatable analysis
* longer examples replaced with shorter stable wording patterns
* deterministic fallback behavior confirmed

Result:

Repeated same-message analysis became much more stable.

Expected behavior:

Outputs do not need to be byte-identical, but scores, interpretation, and Perception Gap™ should remain consistent.

## Phase 9 — Direct “You” Language

Problem observed:

Some outputs said:

“The sender wants…”

This felt detached and clinical.

Fix implemented:

Prompt now tells the model to speak directly to the user in user-facing output.

Preferred:

* “You want…”
* “You may be trying…”
* “What you likely mean…”

Avoid:

* “The sender wants…”
* detached clinical phrasing
* therapy-like language

The Perception Gap™ instruction changed from:

“what the sender likely means”

to:

“what you likely mean”

## Phase 10 — Global Communication/Cultural Guardrails

Need:

The product should work globally and for people from different communication backgrounds without stereotyping cultures or nationalities.

Fix implemented:

Prompt now handles cultural/regional communication through communication style dimensions instead of nationality assumptions.

Added style dimensions:

* direct vs diplomatic
* formal vs casual
* warm vs efficient
* brief vs detailed
* expressive vs restrained
* hierarchical vs peer-to-peer
* high-context vs explicit
* conflict-avoidant vs conflict-direct

Explicitly blocked:

* broad nationality claims
* broad ethnicity claims
* broad culture claims
* broad region-based reaction claims

Preferred wording:

* “In a more formal context…”
* “If the recipient expects a softer tone…”
* “In a more direct communication style…”

Rewrite guidance added:

* avoid unnecessary idioms
* avoid region-specific phrases unless they match the user’s original voice
* keep rewrites globally understandable where possible
* preserve user’s natural voice

## Phase 11 — Safe Feedback UI

Purpose:

Add a learning loop without storing user messages.

Files changed:

* `app/page.tsx`
* `app/api/analyze/route.ts`

Feedback labels added:

* `felt_accurate` → Felt accurate
* `overreacted` → Overreacted
* `too_vague` → Too vague
* `missed_point` → Missed the point
* `rewrite_natural` → Rewrite sounded natural
* `rewrite_fake` → Rewrite sounded fake

Safe metadata sent with feedback:

* characterCount
* severity
* confidenceScore
* clarityScore
* communicationIntelligenceScore
* rewriteVisible

Privacy confirmation:

The feedback request does not send:

* raw user message text
* rewrite text
* quote text
* optional context
* full analysis text

The feedback UI is intended to be:

* small
* calm
* secondary
* not survey-like
* not visually busy

## Phase 12 — Pre-Launch Legal and Safety Pages

Legal/safety content was added before public release.

Files added:

* `app/privacy/page.tsx`
* `app/terms/page.tsx`
* `app/disclaimer/page.tsx`
* `app/components/legal-page.tsx`

File changed:

* `app/page.tsx`

Pages added:

* `/privacy`
* `/terms`
* `/disclaimer`

Main app page updated with:

* footer legal links
* communication-guidance disclaimer

Core disclaimer line:

BetweenLines AI provides communication guidance only. You are responsible for what you choose to send.

The legal pages cover:

* communication guidance only
* no professional advice
* no emergency use
* no therapy/legal/employment/medical advice claims
* no guaranteed outcomes
* user responsible for what they send
* AI output may be imperfect
* users should not paste highly sensitive information
* copy marked as pending professional legal review

Confirmed:

* no OpenAI analysis logic changed
* no dependencies added
* lint passed
* TypeScript passed
* production build passed
* `/privacy`, `/terms`, and `/disclaimer` prerendered successfully

Existing metadataBase warning remains.

---

# 9. Current Verification Checks Used

Common checks:

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Notes:

* PowerShell sometimes blocks `npm.ps1`, so `.cmd` entrypoints are used.
* Production build sometimes requires elevated rerun due to Windows `.next\trace` write permissions.
* Existing metadataBase warning remains and is unrelated to recent changes.

---

# 10. Current Known Warnings / Issues

## metadataBase Warning

Next.js emits an existing warning about `metadataBase`.

This is not blocking.

Eventually fix by adding a final production domain in metadata configuration.

## Windows `.next\trace` Write Issue

Build sometimes requires elevated rerun because the sandbox cannot overwrite generated `.next\trace` files.

This is a local Windows/environment issue, not an app logic issue.

## Commit/Deploy Status Needs Confirmation

Several latest improvements may still be local only unless committed and pushed.

Need run:

```bash
git status
```

Then commit and push latest safe/legal work.

---

# 11. Current Recommended Git Action

If `git status` shows these files:

```text
modified: app/api/analyze/route.ts
modified: app/page.tsx
new file: app/privacy/page.tsx
new file: app/terms/page.tsx
new file: app/disclaimer/page.tsx
new file: app/components/legal-page.tsx
```

Then commit:

```bash
git add app/api/analyze/route.ts app/page.tsx app/privacy/page.tsx app/terms/page.tsx app/disclaimer/page.tsx app/components/legal-page.tsx
git commit -m "Add feedback loop and pre-launch legal protections"
git push origin main
```

After pushing, check Vercel deployment.

Test live:

* `/privacy`
* `/terms`
* `/disclaimer`
* main analysis flow
* feedback buttons
* footer links
* mobile layout
* same-message consistency
* Perception Gap™ display
* rewrite copy

---

# 12. Privacy Position

## Intended Privacy Promise

BetweenLines AI is designed to provide private pre-send communication guidance.

The app should avoid storing raw messages.

The app should avoid using raw messages in feedback tracking.

The app should avoid overpromising absolute privacy beyond what is technically true.

## Current Privacy Features

Implemented or intended:

* raw messages not intentionally stored by the app
* `store: false` added to OpenAI Responses call where supported
* feedback sends only allowlisted labels and derived metadata
* feedback does not include raw message text
* feedback does not include rewrite text
* feedback does not include quote text
* feedback does not include optional context
* feedback does not include full analysis text
* production debug removed
* safe error logging
* copied insight does not include original message

## Privacy Tasks Still To Verify

Need check:

* Vercel logs do not contain raw messages
* browser console does not log raw messages
* network payload for feedback contains no raw text
* localStorage/sessionStorage does not store raw messages
* analytics does not receive raw text
* error reporting does not include raw text
* OpenAI request behavior matches privacy language
* legal pages do not overpromise

---

# 13. Safety and Liability Position

## The App Should Clearly State

* It provides communication guidance only.
* It is not professional advice.
* It is not therapy.
* It is not emergency support.
* It is not legal, medical, mental health, employment, safety, or relationship advice.
* AI output may be imperfect.
* The user is responsible for what they choose to send.
* The app cannot guarantee how another person will respond.

## No Emergency Use

The app should not be used for:

* emergencies
* dangerous situations
* threats
* self-harm situations
* abuse or safety crises
* legal disputes requiring legal advice
* medical/mental health decisions
* workplace legal matters

## Product Tone

Legal/safety disclaimers should be clear but not scary.

The app should remain calm and inviting.

---

# 14. IP / Protection Notes

## Main Concern

Before release, protect the app’s IP and business value.

The goal is eventual acquisition by a larger company that could integrate the product into a messenger or communication platform.

## What Can Be Protected

Potentially protectable assets:

* brand name: BetweenLines AI
* signature framework: Perception Gap™
* written copy
* UI language
* code
* docs
* prompts as written expression
* private scoring/prompt architecture as trade secret
* feedback calibration system
* visual identity
* domain/social handles
* product positioning

## What Is Harder To Protect

Harder to protect:

* broad idea of AI checking message tone
* generic rewrite functionality
* generic “how this may land” wording
* general concept of improving messages

## Recommended IP Strategy

Immediate:

* use ™ for Perception Gap™
* search trade marks for BetweenLines AI
* search trade marks for Perception Gap
* secure domains/social handles
* keep repo private
* do not publish full prompt
* do not reveal scoring logic
* add copyright/trade mark notice
* speak with trade mark attorney
* use contractor NDA/IP assignment agreements

Potential footer language:

```text
© 2026 BetweenLines AI. All rights reserved.
Perception Gap™ is a trade mark of BetweenLines AI.
```

Do not use ® unless registered.

## Attorney Explanation

The app is special because it is not simply an AI rewrite tool.

It is a privacy-first pre-send communication intelligence product built around Perception Gap™ — what the user means vs what the recipient may hear.

The protection angle is:

* trade mark the brand and signature framework
* copyright the code/copy/docs/UI expression
* treat prompt/scoring architecture as trade secret
* protect the feedback calibration loop
* build records and ownership history
* avoid public disclosure of secret mechanics

---

# 15. Acquisition Vision

## End Goal

A larger company buys the product or licenses/implements the concept inside their messaging system.

Potential acquirers or strategic users:

* Meta
* WhatsApp
* Instagram
* LinkedIn
* Microsoft
* Google
* Slack
* Teams
* Gmail
* Outlook
* dating apps
* customer service platforms
* workplace communication platforms
* HR platforms
* coaching/communication tools

## Acquisition Story

BetweenLines AI is a pre-send communication intelligence layer for messaging platforms.

It helps users see how their message may land before they send it.

The key feature is not rewriting. The key feature is identifying the Perception Gap™.

## Why A Bigger Company Might Care

A larger platform may want:

* differentiated AI messaging features
* fewer misunderstandings between users
* safer communication
* user trust
* emotionally intelligent AI
* private assistance before sending
* retention/engagement
* better communication outcomes
* a non-generic AI assistant feature

## Big Company Pitch

Most AI writing tools help users say something differently.

BetweenLines AI helps users understand how their message may land before they send it.

It can be embedded as:

* “Check Perception Gap™”
* “How might this land?”
* “Make this clearer”
* “Reduce pressure”
* “Sound warmer”
* “Sound more direct”
* “Check before sending”

---

# 16. Scaling Ideas Discussed

## Product Scaling

Potential growth channels:

* social posts explaining common Perception Gaps
* examples of “what I meant vs what they heard”
* workplace communication examples
* dating/friendship/family message examples
* communication anxiety content
* creator videos
* short-form educational content
* SEO pages around message tone questions
* AI communication coach positioning, without therapy claims
* newsletter around better communication
* embedded browser extension
* mobile-first product

## Platform Expansion

Possible future integrations:

* Chrome extension
* Gmail extension
* Outlook extension
* LinkedIn messaging helper
* Slack/Teams helper
* WhatsApp-style share sheet
* mobile keyboard extension
* iOS share extension
* Android share extension
* browser overlay
* API for messaging platforms

## Product Feature Scaling

Future features:

* optional message context selector
* optional communication style selector
* saved prompt test fixtures
* regression test suite
* feedback dashboard
* safe usage analytics
* rate-limit dashboard
* better mobile flow
* account system later
* saved history later only if privacy model is clear
* team/workplace version
* browser extension
* enterprise version
* API/license model

## Communication Style Selector

Potential options:

* Not sure
* Clear and direct
* Warm and diplomatic
* Professional / formal
* Casual
* Gentle but firm
* Low-pressure
* Globally neutral

Important:

Do not build a country/nationality selector.

Focus on style, not stereotypes.

## Message Context Selector

Potential options:

* Not sure
* Work
* Dating
* Friendship
* Family
* Follow-up
* Apology
* Boundary

Goal:

Improve analysis without requiring the user to explain everything.

---

# 17. Monetization Ideas

Possible monetization paths:

## Freemium

* limited free analyses per day
* paid plan for more usage
* no unlimited free use

## Subscription

* monthly plan
* unlimited or high-limit analyses
* premium rewrite styles
* workplace communication tools
* communication style calibration

## Pay-As-You-Go

* buy a bundle of message checks
* useful if users do not want subscription

## B2B

Potential buyers:

* HR teams
* managers
* sales teams
* customer success teams
* recruiters
* legal-adjacent communication training
* executive coaching
* schools/universities with careful safety framing

## Licensing

Long-term:

* license technology/framework/API to a messaging platform
* white-label pre-send communication intelligence
* integration into corporate communication tools

## Acquisition

Ultimate goal:

* build enough product traction, IP, and trust to be bought by a larger communication platform

---

# 18. Cost and Infrastructure Scaling

## Cost Drivers

Major cost drivers:

* OpenAI API usage
* Vercel function usage
* analytics/events
* rate limiting infrastructure
* database/storage if added
* logs/monitoring
* future user accounts/history

## Cost Controls Needed

Do not launch unlimited free usage.

Needed:

* daily usage cap
* rate limiting
* input length validation
* whitespace validation
* over-limit validation
* friendly rate-limit message
* OpenAI budget alerts
* Vercel spend monitoring
* model selection strategy
* token usage tracking
* safe metadata only
* fallback handling for errors/timeouts

## Rate Limiting

Need confirm:

* production rate limiting is active
* Upstash env vars are set
* local dev bypass only happens in development
* user sees friendly message when limited
* rate-limit prefixes are stable
* rate-limit logic does not log raw message content

## Model Strategy

Use a cost-effective model by default.

Only move to more expensive models if necessary.

Maintain:

* prompt version
* model version
* token usage metadata
* error metadata
* feedback labels

No raw messages in analytics.

---

# 19. Analytics and Feedback Strategy

## Track

Safe events:

* analyze clicked
* analysis completed
* feedback label clicked
* rewrite copied
* insight copied
* rate limit hit
* error type
* model/prompt version
* character count
* derived scores
* rewrite visible

## Do Not Track

Do not track:

* raw message
* rewrite text
* quote text
* full analysis
* optional context text if private
* personal identifying details unless explicit and necessary

## Feedback Labels

Current labels:

* felt_accurate
* overreacted
* too_vague
* missed_point
* rewrite_natural
* rewrite_fake

Use these to improve:

* prompt calibration
* rewrite naturalness
* overreaction reduction
* clarity
* user trust

---

# 20. Prompt Test Fixtures Needed

Create:

`docs/prompt-test-fixtures.md`

Purpose:

Create synthetic messages that can be used to test prompt behavior after changes.

Recommended test cases:

1. Neutral healthy message
2. Anxious dating follow-up
3. Workplace follow-up
4. Boundary-setting message
5. Passive-aggressive message
6. Apology
7. Family guilt/pressure
8. Friendship tension
9. Direct but healthy message
10. Overexplained message

For each:

* message
* category
* expected emotional pressure
* expected Perception Gap™
* expected rewrite strategy
* failure risks

Important:

* synthetic examples only
* no real user messages
* no private content

---

# 21. Immediate To-Do List

## Highest Priority

1. Run `git status`.
2. Confirm current changed files.
3. Commit latest work.
4. Push to main.
5. Confirm Vercel deploy.
6. Test production pages and app flow.

## Recommended Commit

```bash
git status
git add app/api/analyze/route.ts app/page.tsx app/privacy/page.tsx app/terms/page.tsx app/disclaimer/page.tsx app/components/legal-page.tsx
git commit -m "Add feedback loop and pre-launch legal protections"
git push origin main
```

## Test After Deploy

Test:

* homepage
* analysis flow
* same-message consistency
* output uses “you,” not “the sender”
* feedback buttons
* feedback request payload
* Perception Gap™ display
* rewrite card
* `/privacy`
* `/terms`
* `/disclaimer`
* footer links
* mobile layout
* no scary legal wording
* no raw text in console
* no raw text in feedback payload

---

# 22. Pre-Launch Checklist

## Product

* analysis works
* rewrite works
* feedback works
* Perception Gap™ clear
* result deck not overwhelming
* mobile layout works
* legal links visible
* homepage promise clear
* no old TextPanic references visible
* no “the sender” language

## Privacy

* no raw message logs
* no raw feedback text
* no raw rewrite text in feedback
* no quote text in feedback
* no full analysis in feedback
* no raw text in browser storage
* privacy page matches actual behavior
* OpenAI `store: false` set where supported
* legal copy does not overpromise

## Safety

* Terms page live
* Privacy page live
* Disclaimer page live
* no professional advice language
* no emergency use language
* user responsible for what they send
* no guarantee of outcomes
* AI can be wrong

## Technical

* lint passes
* typecheck passes
* build passes
* Vercel deploys latest commit
* rate limit confirmed
* invalid input handled
* over-limit input handled
* OpenAI failure handled
* timeout handled
* metadataBase warning understood

## Business

* build record saved
* trade mark search planned
* domains/social handles checked
* IP ownership clean
* prompt/scoring kept private
* no contractors without IP assignment
* launch metrics defined

---

# 23. Medium-Term To-Do List

1. Create prompt test fixture document.
2. Run rate-limit/cost audit.
3. Add optional message context selector.
4. Add optional communication style selector.
5. Review legal copy with solicitor/attorney.
6. Search/file trade marks.
7. Add final production domain to metadataBase.
8. Add lightweight analytics dashboard.
9. Create landing page copy focused on Perception Gap™.
10. Build soft launch tester group.
11. Collect feedback.
12. Improve prompt based on safe labels.
13. Decide free limit and paid structure.
14. Create acquisition/investor one-pager.

---

# 24. Long-Term Roadmap

## Product

* browser extension
* Gmail/Outlook integration
* LinkedIn message helper
* Slack/Teams helper
* mobile app
* keyboard/share extension
* communication style profiles
* workplace communication mode
* team/manager version
* communication coaching content
* API licensing

## Business

* freemium launch
* paid plan
* workplace/team plan
* investor deck
* strategic partnership deck
* integration pitch
* acquisition outreach after traction

## IP

* file trade mark applications
* build brand around Perception Gap™
* keep prompts/scoring confidential
* document invention/product history
* maintain private repo
* use NDAs/IP assignment for helpers
* create clean ownership records

---

# 25. Things Not To Build Yet

Avoid too early:

* accounts
* saved history
* subscriptions
* complex dashboards
* public sharing feed
* country/nationality mode
* heavy analytics
* browser extension
* mobile app
* B2B admin system
* team accounts
* too many card types
* therapy/dating coach positioning

Reason:

The product needs trust, clarity, and focus before complexity.

Current priority:

* prove the core analysis is useful
* protect privacy
* keep costs controlled
* validate user demand
* refine Perception Gap™ positioning

---

# 26. Risks To Watch

## Product Risk

The app could be perceived as just another rewrite tool.

Mitigation:

Keep Perception Gap™ central.

## Trust Risk

Users may worry about pasting private messages.

Mitigation:

Clear privacy posture, no raw feedback tracking, legal pages, careful copy.

## Overreaction Risk

The AI may make normal messages seem problematic.

Mitigation:

Neutral message handling, feedback label “overreacted,” prompt fixtures.

## Consistency Risk

Same message may produce different outputs.

Mitigation:

Low temperature, stable prompt, deterministic fallback.

## Legal Risk

Users may rely on app as advice.

Mitigation:

Terms, disclaimer, no professional advice language.

## Cost Risk

Free users could create high OpenAI bills.

Mitigation:

Rate limits, daily caps, budget alerts, usage tracking.

## IP Risk

Competitors may copy concept.

Mitigation:

trade marks, private prompt, brand framework, execution, user data, build records.

---

# 27. Recommended Next Codex Tasks

## Task 1 — Create Build Record File

Create:

`docs/betweenlines-ai-build-record.md`

Use this document.

No app code changes.

## Task 2 — Create Prompt Test Fixtures

Create:

`docs/prompt-test-fixtures.md`

Include 10 synthetic test cases.

## Task 3 — Rate-Limit / Cost Audit

Inspect:

* Upstash env behavior
* production rate limiting
* local dev bypass
* invalid input
* OpenAI failure handling
* timeout handling
* token usage capture
* raw logging risks

## Task 4 — MetadataBase Fix

Add final production domain when known.

## Task 5 — Optional Context Selector

Add optional selector:

* Not sure
* Work
* Dating
* Friendship
* Family
* Follow-up
* Apology
* Boundary

## Task 6 — Communication Style Selector

Add optional style selector:

* Not sure
* Clear and direct
* Warm and diplomatic
* Professional / formal
* Casual
* Gentle but firm
* Low-pressure
* Globally neutral

---

# 28. Suggested Acquisition One-Liner

BetweenLines AI is a privacy-first pre-send communication intelligence layer that helps users see the Perception Gap™ between what they mean and what others may hear before they send a message.

---

# 29. Suggested Investor / Acquirer Explanation

Most AI writing tools help people rewrite messages.

BetweenLines AI helps people understand how their message may land.

The product can become a lightweight communication intelligence layer inside any messaging platform, helping users reduce misunderstandings, communicate more clearly, and feel more confident before sending.

Its core framework is Perception Gap™ — what you mean versus what they may hear.

---

# 30. Current Best Summary

BetweenLines AI has evolved from a simple “should I send this?” AI message checker into a privacy-first pre-send communication intelligence product.

Major completed work includes:

* brand shift to BetweenLines AI
* Perception Gap™ framework
* simplified result deck
* rewrite repositioned as secondary
* old share/export flow removed
* backend prompt hardening
* privacy cleanup
* safe feedback loop
* analysis consistency improvements
* direct “you” language
* global communication guardrails
* pre-launch legal pages
* footer links and disclaimer
* build/test workflow established

Major remaining work includes:

* confirm commit/deploy of latest changes
* save this build record in repo
* create prompt test fixtures
* audit rate limiting and cost controls
* review legal pages with attorney
* search/file trade marks
* verify production privacy
* soft launch to testers
* collect safe feedback
* refine prompt based on real usage
* prepare acquisition/integration story

The strongest long-term path is to own the category of private pre-send communication intelligence, using Perception Gap™ as the signature framework.
