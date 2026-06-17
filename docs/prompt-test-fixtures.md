# BetweenLines AI — Prompt Test Fixtures

## Purpose

This document is a manual regression test suite for BetweenLines AI.

Use these test messages whenever the analysis prompt, result deck, classification logic, rewrite behavior, or model settings change.

The goal is to make sure BetweenLines AI stays:

* calm
* private
* practical
* nonjudgmental
* emotionally intelligent
* clear, not clinical
* useful without increasing anxiety
* focused on the Perception Gap™

BetweenLines AI should not:

* read minds
* diagnose people
* create drama where there is none
* over-soften healthy directness
* make every message seem risky
* turn into a generic rewrite tool
* sound like therapy
* make claims about what someone definitely thinks

---

## How to Use These Fixtures

For each fixture:

1. Paste the test message into the app.
2. Run the analysis.
3. Compare the result against the expected outcome.
4. Confirm whether the result feels on-brand.
5. Confirm whether the rewrite, if shown, preserves the user’s intent.
6. Confirm that the app does not include the original message in copied insights.
7. Re-run a few examples to check consistency.

The output does not need to be word-for-word identical every time.

However, these should remain stable:

* communication risk
* emotional pressure level
* clarity score
* confidence score
* main Perception Gap™
* rewrite strategy
* whether the message triggers “This Looks Clear”

---

# Fixture 1 — Clear Neutral Follow-Up

## Message

“Hi Sarah, just checking whether Friday still works for our meeting. No rush — let me know when you can.”

## Category

Work / follow-up

## Expected Outcome

The message should be treated as clear, calm, and low-risk.

## Expected Classification

* Communication risk: low
* Emotional pressure: low
* Clarity: high
* Confidence: high

## Expected Perception Gap™

Low. The message is straightforward and polite.

## Expected Rewrite Strategy

A rewrite is probably unnecessary. If shown, it should be framed as optional polish.

## Should Trigger “This Looks Clear”?

Yes.

## Failure Risks

* Overreacting to “just checking”
* Suggesting the sender sounds needy or anxious
* Rewriting unnecessarily
* Making the user doubt a perfectly reasonable message

---

# Fixture 2 — Direct but Healthy Boundary

## Message

“I won’t be able to take this on today, but I can look at it tomorrow morning.”

## Category

Work / boundary

## Expected Outcome

The app should recognize this as a clear and healthy boundary.

## Expected Classification

* Communication risk: low
* Emotional pressure: low
* Clarity: high
* Confidence: high

## Expected Perception Gap™

Low. The message is direct but reasonable.

## Expected Rewrite Strategy

Do not over-soften. Preserve the boundary.

## Should Trigger “This Looks Clear”?

Yes.

## Failure Risks

* Treating directness as rude
* Adding unnecessary apologies
* Weakening the boundary
* Making the message sound less confident

---

# Fixture 3 — Anxious Follow-Up

## Message

“Hey, I know you’re probably busy, but I just wanted to check if I did something wrong because you haven’t replied.”

## Category

Dating / friendship / follow-up

## Expected Outcome

The app should gently identify reassurance-seeking and emotional pressure.

## Expected Classification

* Communication risk: medium
* Emotional pressure: medium
* Clarity: medium
* Confidence: medium

## Expected Perception Gap™

The sender may mean to check in, but the recipient may hear anxiety, pressure, or a request for reassurance.

## Expected Rewrite Strategy

Reduce emotional pressure. Keep warmth. Avoid blame. Make the follow-up lighter.

## Should Trigger “This Looks Clear”?

No.

## Failure Risks

* Harshly judging the sender
* Saying the sender is insecure
* Claiming the recipient will feel guilty
* Removing all emotional honesty

---

# Fixture 4 — Passive-Aggressive Message

## Message

“Fine, don’t worry about it. I’ll just sort it out myself like usual.”

## Category

Conflict / frustration

## Expected Outcome

The app should identify that the message may land as resentful, guilt-inducing, or frustrated.

## Expected Classification

* Communication risk: medium or high
* Emotional pressure: medium or high
* Clarity: medium
* Confidence: medium

## Expected Perception Gap™

The sender may mean to express frustration, but the recipient may hear blame, resentment, or punishment.

## Expected Rewrite Strategy

Make the real need clearer. Remove the guilt pressure. Keep the boundary or concern.

## Should Trigger “This Looks Clear”?

No.

## Failure Risks

* Calling the sender manipulative
* Being too harsh
* Missing the passive-aggressive tone
* Rewriting into something overly cheerful or fake

---

# Fixture 5 — Apology with Accountability

## Message

“I’m sorry I snapped earlier. That wasn’t fair to you. I was stressed, but I should have handled it better.”

## Category

Apology

## Expected Outcome

The app should recognize the apology as clear, accountable, and emotionally mature.

## Expected Classification

* Communication risk: low
* Emotional pressure: low to medium
* Clarity: high
* Confidence: high

## Expected Perception Gap™

Low. The message takes responsibility and avoids blaming the other person.

## Expected Rewrite Strategy

Minimal polish only. Do not overcomplicate it.

## Should Trigger “This Looks Clear”?

Yes, or very close to yes.

## Failure Risks

* Treating the apology as too vulnerable
* Adding unnecessary explanation
* Making the apology sound corporate
* Removing accountability

---

# Fixture 6 — Apology That Shifts Blame

## Message

“I’m sorry you got upset, but I only said what I said because you kept pushing me.”

## Category

Apology / conflict

## Expected Outcome

The app should identify that the apology may not feel fully accountable.

## Expected Classification

* Communication risk: medium
* Emotional pressure: medium
* Clarity: medium

## Expected Perception Gap™

The sender may intend to apologize, but the recipient may hear blame or defensiveness.

## Expected Rewrite Strategy

Keep accountability. Reduce “you made me” framing.

## Should Trigger “This Looks Clear”?

No.

## Failure Risks

* Treating it as a strong apology
* Ignoring the blame-shifting
* Becoming too moralizing
* Using therapy language

---

# Fixture 7 — Family Guilt Pressure

## Message

“I guess I just thought you’d want to spend time with your family, but do whatever you want.”

## Category

Family / guilt / conflict

## Expected Outcome

The app should identify guilt pressure and possible emotional manipulation without using harsh labels.

## Expected Classification

* Communication risk: medium or high
* Emotional pressure: high
* Clarity: medium

## Expected Perception Gap™

The sender may mean to express hurt, but the recipient may hear guilt, disappointment, or pressure.

## Expected Rewrite Strategy

Make the hurt feeling direct without guilt-tripping.

## Should Trigger “This Looks Clear”?

No.

## Failure Risks

* Calling the sender manipulative
* Ignoring the guilt pressure
* Making the rewrite too cold
* Removing the emotional truth entirely

---

# Fixture 8 — Professional Clarification

## Message

“Thanks for sending this over. Could you clarify which version of the document you want me to review before I make changes?”

## Category

Work / clarification

## Expected Outcome

The message should be treated as clear, professional, and low-risk.

## Expected Classification

* Communication risk: low
* Emotional pressure: low
* Clarity: high
* Confidence: high

## Expected Perception Gap™

Low. The message asks for clarification politely.

## Expected Rewrite Strategy

No rewrite needed, or optional polish only.

## Should Trigger “This Looks Clear”?

Yes.

## Failure Risks

* Suggesting the message sounds annoyed
* Over-polishing a clear work message
* Adding excessive warmth
* Making the user sound less efficient

---

# Fixture 9 — Blunt Workplace Message

## Message

“This needs to be fixed before the end of the day.”

## Category

Work / direct request

## Expected Outcome

The app should recognize that the message is clear but may land as abrupt depending on context.

## Expected Classification

* Communication risk: medium
* Emotional pressure: low to medium
* Clarity: high
* Confidence: high

## Expected Perception Gap™

The sender may mean urgency, but the recipient may hear pressure or sharpness.

## Expected Rewrite Strategy

Keep urgency. Add context or collaborative framing if appropriate.

## Should Trigger “This Looks Clear”?

Usually no, unless context suggests this level of directness is expected.

## Failure Risks

* Over-softening the urgency
* Treating the message as rude with certainty
* Removing the deadline
* Making the rewrite too long

---

# Fixture 10 — Overexplained Message

## Message

“Sorry, I know this is probably annoying and you’re really busy, and I don’t want to be a pain, but I was wondering if maybe you had a chance to look at the thing I sent last week?”

## Category

Work / follow-up / anxiety

## Expected Outcome

The app should identify over-apologizing and low-confidence framing.

## Expected Classification

* Communication risk: medium
* Emotional pressure: medium
* Clarity: medium
* Confidence: low to medium

## Expected Perception Gap™

The sender may mean to be considerate, but the recipient may hear uncertainty, nervousness, or lack of confidence.

## Expected Rewrite Strategy

Make it shorter, clearer, and still polite.

## Should Trigger “This Looks Clear”?

No.

## Failure Risks

* Making the sender sound cold
* Removing all politeness
* Being harsh about insecurity
* Missing the over-apology pattern

---

# Fixture 11 — Dating Message with Low Pressure

## Message

“I had a really nice time last night. No pressure, but I’d be happy to see you again if you’d like.”

## Category

Dating

## Expected Outcome

The app should recognize this as warm, clear, and low-pressure.

## Expected Classification

* Communication risk: low
* Emotional pressure: low
* Clarity: high
* Confidence: high

## Expected Perception Gap™

Low. The message communicates interest without demanding a response.

## Expected Rewrite Strategy

No rewrite needed, or very light optional polish.

## Should Trigger “This Looks Clear”?

Yes.

## Failure Risks

* Treating romantic interest as inherently risky
* Suggesting the sender sounds needy
* Rewriting away the warmth
* Making it overly formal

---

# Fixture 12 — Dating Message with Pressure

## Message

“I thought we had a great time, so I’m confused why you haven’t replied. I just need to know where I stand.”

## Category

Dating / follow-up

## Expected Outcome

The app should identify emotional pressure and possible intensity.

## Expected Classification

* Communication risk: medium or high
* Emotional pressure: high
* Clarity: medium

## Expected Perception Gap™

The sender may mean to seek clarity, but the recipient may hear pressure, frustration, or urgency.

## Expected Rewrite Strategy

Keep the desire for clarity but reduce pressure and emotional demand.

## Should Trigger “This Looks Clear”?

No.

## Failure Risks

* Shaming the sender
* Saying the recipient definitely feels pressured
* Removing the need for clarity completely
* Making the rewrite fake or overly casual

---

# Fixture 13 — Boundary with Friend

## Message

“I care about you, but I can’t keep being the person you call only when something goes wrong.”

## Category

Friendship / boundary

## Expected Outcome

The app should recognize a meaningful but healthy boundary.

## Expected Classification

* Communication risk: medium
* Emotional pressure: medium
* Clarity: high
* Confidence: high

## Expected Perception Gap™

The sender may mean to set a needed boundary, but the recipient may hear hurt, criticism, or rejection.

## Expected Rewrite Strategy

Preserve the boundary. Add warmth only if it does not weaken the message.

## Should Trigger “This Looks Clear”?

No, because the message has emotional weight, even though it may be appropriate.

## Failure Risks

* Over-softening the boundary
* Telling the user not to send it
* Making it sound like therapy
* Removing the seriousness

---

# Fixture 14 — Short Message That Is Fine

## Message

“Sounds good, thanks.”

## Category

Neutral / everyday

## Expected Outcome

The app should not invent hidden meaning.

## Expected Classification

* Communication risk: low
* Emotional pressure: low
* Clarity: high
* Confidence: high or medium

## Expected Perception Gap™

Very low. The message is simple and neutral.

## Expected Rewrite Strategy

No rewrite needed.

## Should Trigger “This Looks Clear”?

Yes.

## Failure Risks

* Suggesting it may sound cold without context
* Creating unnecessary concern
* Offering a long rewrite
* Overanalyzing a normal message

---

# Fixture 15 — Ambiguous Short Reply

## Message

“Okay.”

## Category

Neutral / ambiguous

## Expected Outcome

The app should recognize that the message is short and could be read in different ways depending on context, without overstating risk.

## Expected Classification

* Communication risk: low or medium
* Emotional pressure: low
* Clarity: low to medium
* Confidence: low to medium

## Expected Perception Gap™

The sender may mean simple acknowledgment, but the recipient could read it as neutral, abrupt, or slightly cold depending on the relationship and context.

## Expected Rewrite Strategy

If context matters, add a few words of warmth or clarity.

## Should Trigger “This Looks Clear”?

Not necessarily. It may be too context-dependent.

## Failure Risks

* Claiming it definitely sounds angry
* Overreacting
* Rewriting into something too elaborate
* Ignoring the ambiguity

---

# Brand-Level Pass Criteria

A prompt update passes this fixture suite if:

* Clear messages are allowed to remain clear.
* Healthy boundaries are not over-softened.
* Emotionally loaded messages are handled gently.
* Passive-aggressive or guilt-pressure messages are identified without harsh judgment.
* Rewrites preserve intent.
* The app uses uncertainty language.
* The app does not claim to know what the recipient thinks.
* The app does not sound clinical or therapeutic.
* The app does not make users more anxious.
* The app remains clearly different from a generic rewrite tool.

---

# Red Flags

A prompt update fails if the app repeatedly:

* invents hidden subtext
* treats every message as risky
* says the sender is manipulative, insecure, needy, or toxic
* tells the user what the recipient definitely thinks
* over-softens direct but healthy messages
* turns simple messages into long rewrites
* ignores emotional pressure in loaded messages
* sounds like therapy
* sounds like corporate HR
* makes the rewrite the main value

---

# Suggested Manual Regression Routine

Before deploying prompt or result-flow changes:

1. Run Fixtures 1, 2, 3, 4, 8, 10, 12, and 14.
2. Confirm the clear-message outcome appears where expected.
3. Confirm the anxious and pressure-heavy examples do not trigger “This Looks Clear.”
4. Confirm rewrites are optional for low-risk messages.
5. Confirm rewrites are calmer but still honest for medium/high-risk messages.
6. Confirm no copied insight includes the original message.
7. Re-run Fixture 3 twice to check consistency.
8. Re-run Fixture 14 to make sure the app does not overanalyze simple messages.
