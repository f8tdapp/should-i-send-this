# BetweenLines Prompt Calibration

## Current Prompt

The analysis route uses prompt version `betweenlines-ci-v2.0.0` with model `gpt-4.1-mini`.

The prompt is built around the BetweenLines Communication Intelligence Framework:

- Perception Gap: what the sender likely means versus what the recipient may perceive.
- Emotional Pressure: the emotional weight, urgency, tension, or relational pressure in the draft.
- Confidence Signal: whether the message sounds grounded, direct, uncertain, defensive, or over-softened.
- Hidden Subtext: what a recipient may infer beyond the literal words.
- Communication Clarity: how easy it is to understand the main point and desired response.

The model must return JSON only. The backend normalizes missing or malformed fields with a deterministic fallback so the UI receives a stable shape.

## Anti-Overinterpretation Rules

The prompt explicitly tells the model not to turn neutral, healthy, or logistical messages into drama. If a message is already respectful and clear, the safest output is a low-risk read and an identical or nearly identical rewrite.

The model should not infer abandonment, hostility, manipulation, romantic interest, contempt, or hidden conflict unless the wording strongly supports it. When context is missing, it should name uncertainty instead of filling the gap with a dramatic story.

Short messages should be treated as low-context first, not automatically angry.

## Classification Layer

Each response includes a lightweight classification object:

- `category`
- `likelyIntent`
- `emotionalPressureLevel`
- `confidenceSignal`
- `communicationRisk`
- `rewriteStrategy`

OpenAI can provide this classification, but the backend also has a local deterministic classifier. The local classifier acts as a fallback for demo mode, malformed model output, empty OpenAI responses, and parse failures.

## Optional Context

The API accepts optional request fields:

- `relationshipContext`
- `desiredTone`
- `messageGoal`

These fields are trimmed, length-limited, and sent only to OpenAI as prompt calibration context. They are not logged or sent to analytics by the backend.

## Privacy Rules

Do not store or log raw user messages.

Do not store or log rewrites.

Do not send raw user message text, quotes, rewrites, or optional context to PostHog or analytics.

Backend logs may contain only safe derived metadata, such as:

- prompt version
- model
- success or failure status
- coarse character-count bucket
- token usage when OpenAI provides it
- classification labels
- optional safe feedback rating
- feedback tag count and known allowlisted feedback labels only

OpenAI responses can include `mostRevealingLine.quote` because the user needs that result in the UI, but that quote must not be logged or persisted.

## Safe Feedback Tracking

The backend supports optional safe feedback in the analyze request:

```json
{
  "feedback": {
    "rating": "helpful",
    "tags": ["clear", "good_rewrite"]
  }
}
```

Only the rating, tag count, and known allowlisted feedback labels are tracked. Raw feedback tag strings, raw message text, optional context, analysis text, quotes, and rewrites are never included in feedback logs.

## Debug Metadata

Development responses include safe debug metadata:

```json
{
  "debug": {
    "promptVersion": "betweenlines-ci-v2.0.0",
    "model": "gpt-4.1-mini",
    "tokenUsage": {
      "inputTokens": 123,
      "outputTokens": 456,
      "totalTokens": 579
    },
    "success": true
  }
}
```

Production responses do not include debug metadata. Development failure responses include a safe `failureReason` such as `validation_failed`, `openai_timeout`, or `openai_request_failed`.

## Future Calibration Roadmap

1. Build a privacy-safe evaluation set with synthetic messages and hand-authored expected classifications.
2. Add regression tests for neutral messages so calm drafts stay low-risk.
3. Track aggregate helpfulness by prompt version and classification, never by raw text.
4. Compare prompt versions using synthetic fixtures before shipping changes.
5. Add separate calibration fixtures for workplace, dating, friendship, family, apology, and conflict messages.
6. Monitor parse failures and empty model responses by prompt version.
