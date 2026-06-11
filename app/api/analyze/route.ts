import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  communicationIntelligenceScore: number;
  classification: MessageClassification;
  communicationFramework: {
    perceptionGap: string;
    emotionalPressure: string;
    confidenceSignal: string;
    hiddenSubtext: string;
    communicationClarity: string;
  };
  emotionalInterpretation: string;
  perceptionGap: string;
  intentVsImpact: {
    youMeant: string;
    theyMayHear: string;
  };
  mostRevealingLine: {
    quote: string;
    explanation: string;
  };
  recipientLikelyPerception: string;
  improvedRewrite: string;
  debug: AnalysisDebugMetadata;
};

type MessageClassification = {
  category: string;
  likelyIntent: string;
  emotionalPressureLevel: "low" | "medium" | "high";
  confidenceSignal: string;
  communicationRisk: "low" | "medium" | "high";
  rewriteStrategy: string;
};

type OptionalMessageContext = {
  relationshipContext?: string;
  desiredTone?: string;
  messageGoal?: string;
};

type SafeFeedbackInput = {
  rating?: "helpful" | "not_helpful" | "unclear";
  tagCount: number;
  validatedTagLabels: string[];
};

type AnalysisDebugMetadata = {
  promptVersion: string;
  model: string;
  tokenUsage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
  success: boolean;
  failureReason?: string;
};

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const PROMPT_VERSION = "betweenlines-ci-v2.0.0";
const OPENAI_MODEL = "gpt-4.1-mini";
const MESSAGE_CHARACTER_LIMIT = 750;
const RELATIONSHIP_CONTEXT_CHARACTER_LIMIT = 180;
const DESIRED_TONE_CHARACTER_LIMIT = 80;
const MESSAGE_GOAL_CHARACTER_LIMIT = 160;
const OPENAI_TIMEOUT_MS = 20_000;
const ALLOWLISTED_FEEDBACK_TAGS = new Set([
  "accurate",
  "unclear",
  "too_intense",
  "too_soft",
  "good_rewrite",
  "bad_rewrite",
  "helpful",
]);
const RATE_LIMITED_MESSAGE =
  "You've used today's private reads. Give it some time and try again later.";
const BURST_RATE_LIMITED_MESSAGE =
  "Tiny pause. Give it a moment before the next interpretation.";
const TIMEOUT_MESSAGE =
  "This is taking longer than expected. Your message can wait; try again in a moment.";
const GENERIC_ERROR_MESSAGE =
  "BetweenLines AI hit a small processing snag. Try again in a moment.";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const dailyRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 d"),
      prefix: "textpanic:analyze:daily",
    })
  : null;

const burstRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "30 s"),
      prefix: "textpanic:analyze:burst",
    })
  : null;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function withDevelopmentDebug<T extends Record<string, unknown>>(
  body: T,
  debug: AnalysisDebugMetadata,
) {
  if (process.env.NODE_ENV !== "development") {
    return body;
  }

  return { ...body, debug };
}

function analysisResponse(analysis: AnalysisResult) {
  if (process.env.NODE_ENV === "development") {
    return jsonResponse(analysis);
  }

  const publicAnalysis = { ...analysis };
  delete (publicAnalysis as Partial<AnalysisResult>).debug;

  return jsonResponse(publicAnalysis);
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || "anonymous";
}

function createDebugMetadata({
  success,
  failureReason,
  tokenUsage = null,
}: {
  success: boolean;
  failureReason?: string;
  tokenUsage?: AnalysisDebugMetadata["tokenUsage"];
}): AnalysisDebugMetadata {
  return {
    promptVersion: PROMPT_VERSION,
    model: OPENAI_MODEL,
    tokenUsage,
    success,
    ...(failureReason ? { failureReason } : {}),
  };
}

function getSafeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError" };
  }

  const maybeError = error as {
    name?: unknown;
    status?: unknown;
    code?: unknown;
    type?: unknown;
  };

  return {
    name: typeof maybeError.name === "string" ? maybeError.name : "Error",
    status: typeof maybeError.status === "number" ? maybeError.status : undefined,
    code: typeof maybeError.code === "string" ? maybeError.code : undefined,
    type: typeof maybeError.type === "string" ? maybeError.type : undefined,
  };
}

function getOptionalString(
  body: Record<string, unknown>,
  key: keyof OptionalMessageContext,
  maxLength: number,
) {
  const value = body[key];

  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "string") {
    return { error: `${key} must be text.` };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {};
  }

  if (trimmedValue.length > maxLength) {
    return { error: `${key} is too long.` };
  }

  return { value: trimmedValue };
}

function getSafeFeedback(body: Record<string, unknown>): SafeFeedbackInput | undefined {
  const feedback = body.feedback;

  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) {
    return undefined;
  }

  const feedbackRecord = feedback as Record<string, unknown>;
  const rating: SafeFeedbackInput["rating"] =
    feedbackRecord.rating === "helpful" ||
    feedbackRecord.rating === "not_helpful" ||
    feedbackRecord.rating === "unclear"
      ? feedbackRecord.rating
      : undefined;
  const rawTags = Array.isArray(feedbackRecord.tags)
    ? feedbackRecord.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const validatedTagLabels = rawTags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => ALLOWLISTED_FEEDBACK_TAGS.has(tag))
    .slice(0, 5);

  if (!rating && rawTags.length === 0) {
    return undefined;
  }

  return {
    rating,
    tagCount: Math.min(rawTags.length, 20),
    validatedTagLabels,
  };
}

function validateMessage(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      error: "That request came through sideways. Try pasting it again.",
    };
  }

  const record = body as Record<string, unknown>;
  const message =
    "message" in record ? record.message : undefined;

  if (typeof message !== "string") {
    return {
      error: "Paste a message first. BetweenLines AI needs something to read.",
    };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return {
      error: "Paste a message first. BetweenLines AI needs something to read.",
    };
  }

  if (trimmedMessage.length > MESSAGE_CHARACTER_LIMIT) {
    return { error: "That's enough text for one interpretation." };
  }

  const relationshipContext = getOptionalString(
    record,
    "relationshipContext",
    RELATIONSHIP_CONTEXT_CHARACTER_LIMIT,
  );
  const desiredTone = getOptionalString(
    record,
    "desiredTone",
    DESIRED_TONE_CHARACTER_LIMIT,
  );
  const messageGoal = getOptionalString(
    record,
    "messageGoal",
    MESSAGE_GOAL_CHARACTER_LIMIT,
  );
  const contextFields = { relationshipContext, desiredTone, messageGoal };
  const contextError = Object.values(contextFields).find(
    (field): field is { error: string } => "error" in field,
  );

  if (contextError) {
    return { error: contextError.error };
  }

  return {
    message: trimmedMessage,
    context: {
      ...(relationshipContext.value
        ? { relationshipContext: relationshipContext.value }
        : {}),
      ...(desiredTone.value ? { desiredTone: desiredTone.value } : {}),
      ...(messageGoal.value ? { messageGoal: messageGoal.value } : {}),
    },
    feedback: getSafeFeedback(record),
  };
}

async function checkRateLimit(ip: string) {
  // Local development only: avoids stale Upstash counters blocking manual testing.
  if (process.env.NODE_ENV === "development") {
    return { success: true };
  }

  if (!dailyRateLimit || !burstRateLimit) {
    return { success: true };
  }

  const [dailyLimit, burstLimit] = await Promise.all([
    dailyRateLimit.limit(ip),
    burstRateLimit.limit(ip),
  ]);

  if (!dailyLimit.success) {
    return {
      success: false,
      code: "daily_limit_exceeded",
      reset: dailyLimit.reset,
    };
  }

  if (!burstLimit.success) {
    return {
      success: false,
      code: "burst_limit_exceeded",
      reset: burstLimit.reset,
    };
  }

  return {
    success: true,
    reset: Math.max(dailyLimit.reset, burstLimit.reset),
  };
}

function inferDemoContext(message: string) {
  const lowerMessage = message.toLowerCase();

  if (/\b(job|boss|work|email|meeting|manager|coworker)\b/.test(lowerMessage)) {
    return "work";
  }

  if (/\b(date|dating|ignore|ignoring|text me|miss you)\b/.test(lowerMessage)) {
    return "dating";
  }

  if (/\b(sorry|apologize|apology|my fault)\b/.test(lowerMessage)) {
    return "apology";
  }

  if (/\b(friend|hang out|hangout|plans)\b/.test(lowerMessage)) {
    return "friendship";
  }

  if (/\b(mom|dad|family|sister|brother|parent)\b/.test(lowerMessage)) {
    return "family";
  }

  return "general";
}

function getMostRevealingLine(message: string) {
  const sentences = message
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const phrases = sentences.length > 0 ? sentences : [message.trim()];
  const emotionalPatterns = [
    /\b(no worries|fine|whatever|like usual|per my last email)\b/i,
    /\b(are we okay|ignoring me|mad at me|upset with me)\b/i,
    /\b(i'm sorry|i apologize|my fault)\b/i,
    /\b(need|should|always|never|done|ridiculous)\b/i,
  ];

  return (
    phrases.find((phrase) =>
      emotionalPatterns.some((pattern) => pattern.test(phrase)),
    ) ||
    phrases.reduce((longest, phrase) =>
      phrase.length > longest.length ? phrase : longest,
    )
  ).slice(0, 160);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function createCommunicationIntelligenceScore({
  clarityScore,
  confidenceScore,
  hasHighPressure,
  hasWidePerceptionGap,
}: {
  clarityScore: number;
  confidenceScore: number;
  hasHighPressure: boolean;
  hasWidePerceptionGap: boolean;
}) {
  const clarity = clarityScore * 4;
  const confidence = confidenceScore * 3;
  const emotionalPressure = hasHighPressure ? 10 : 20;
  const perceptionAlignment = hasWidePerceptionGap ? 8 : 18;

  return clampScore(clarity + confidence + emotionalPressure + perceptionAlignment);
}

function completePerceptionGap(perceptionGap: string) {
  if (/\b(reduce|soften|clarify|clearer|name the|direct|specific ask)\b/i.test(perceptionGap)) {
    return perceptionGap;
  }

  return `${perceptionGap} A clearer ask or softer opening would reduce that gap.`;
}

function softenAnalysisLanguage(text: string) {
  return text
    .replace(/\bmanipulative\b/gi, "emotionally high-pressure")
    .replace(/\btoxic\b/gi, "hard to receive")
    .replace(/\bdesperate\b/gi, "intense")
    .replace(/\bneedy\b/gi, "reassurance-seeking")
    .replace(/\bpathetic\b/gi, "uncertain")
    .replace(/\bred flag\b/gi, "possible concern")
    .replace(/\bclingy\b/gi, "uncertain or reassurance-seeking");
}

function classifyMessage(message: string): MessageClassification {
  const trimmedMessage = message.trim();
  const context = inferDemoContext(trimmedMessage);
  const isShortAck = /^\s*(k|ok|okay|sure)\.?\s*$/i.test(trimmedMessage);
  const soundsTentative =
    /\b(just|maybe|sorry|checking|wondering|if you can|are we okay|mad at me|upset with me)\b/i.test(
      trimmedMessage,
    ) || trimmedMessage.includes("?");
  const soundsAngry =
    /\b(sucks|hate|angry|mad|annoyed|whatever|ridiculous|done|explain yourself)\b/i.test(
      trimmedMessage,
    );
  const isPassiveAggressive =
    /\b(per my last email|whatever|fine|sure|no worries)\b/i.test(
      trimmedMessage,
    ) || isShortAck;
  const soundsCalmOrHealthy =
    !soundsAngry &&
    !isPassiveAggressive &&
    !/\b(ignoring me|mad at me|upset with me|whatever|hate|ridiculous)\b/i.test(
      trimmedMessage,
    ) &&
    (/\b(i understand|thanks for telling me|no pressure|when you have time|i appreciate|i hear you|that works|sounds good|hope you're okay|i'm proud|happy for you)\b/i.test(
      trimmedMessage,
    ) ||
      (trimmedMessage.length >= 45 && !soundsTentative));

  if (soundsCalmOrHealthy) {
    return {
      category: context === "general" ? "clear check-in" : context,
      likelyIntent: "communicate clearly while keeping the exchange respectful",
      emotionalPressureLevel: "low",
      confidenceSignal: "grounded and direct",
      communicationRisk: "low",
      rewriteStrategy: "preserve the message or make only a tiny clarity edit",
    };
  }

  if (soundsAngry) {
    return {
      category: context === "work" ? "workplace frustration" : "frustration",
      likelyIntent: "name a real concern or release pressure",
      emotionalPressureLevel: "high",
      confidenceSignal: "direct but emotionally loaded",
      communicationRisk: "high",
      rewriteStrategy: "keep the honest point while lowering heat and adding a clear ask",
    };
  }

  if (isPassiveAggressive) {
    return {
      category: context === "work" ? "professional follow-up" : "indirect frustration",
      likelyIntent: "signal dissatisfaction without saying it directly",
      emotionalPressureLevel: "medium",
      confidenceSignal: "controlled but indirect",
      communicationRisk: "medium",
      rewriteStrategy: "replace implication with a neutral next step or simple feeling cue",
    };
  }

  if (soundsTentative) {
    return {
      category: context === "dating" ? "relationship check-in" : "tentative check-in",
      likelyIntent: "ask for clarity or reassurance without applying too much pressure",
      emotionalPressureLevel: "medium",
      confidenceSignal: "softened and uncertain",
      communicationRisk: "medium",
      rewriteStrategy: "make the ask warmer and more direct while keeping it low-pressure",
    };
  }

  return {
    category: context,
    likelyIntent: "communicate a practical point",
    emotionalPressureLevel: "low",
    confidenceSignal: "mostly steady",
    communicationRisk: "low",
    rewriteStrategy: "tighten clarity without changing the tone much",
  };
}

function normalizeClassification(
  value: unknown,
  fallback: MessageClassification,
): MessageClassification {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const classification = value as Record<string, unknown>;
  const emotionalPressureLevel = classification.emotionalPressureLevel;
  const communicationRisk = classification.communicationRisk;

  return {
    category:
      typeof classification.category === "string"
        ? softenAnalysisLanguage(classification.category)
        : fallback.category,
    likelyIntent:
      typeof classification.likelyIntent === "string"
        ? softenAnalysisLanguage(classification.likelyIntent)
        : fallback.likelyIntent,
    emotionalPressureLevel:
      emotionalPressureLevel === "low" ||
      emotionalPressureLevel === "medium" ||
      emotionalPressureLevel === "high"
        ? emotionalPressureLevel
        : fallback.emotionalPressureLevel,
    confidenceSignal:
      typeof classification.confidenceSignal === "string"
        ? softenAnalysisLanguage(classification.confidenceSignal)
        : fallback.confidenceSignal,
    communicationRisk:
      communicationRisk === "low" ||
      communicationRisk === "medium" ||
      communicationRisk === "high"
        ? communicationRisk
        : fallback.communicationRisk,
    rewriteStrategy:
      typeof classification.rewriteStrategy === "string"
        ? softenAnalysisLanguage(classification.rewriteStrategy)
        : fallback.rewriteStrategy,
  };
}

function createDemoAnalysis(
  message: string,
  debug = createDebugMetadata({ success: true }),
): AnalysisResult {
  const isDevelopment = process.env.NODE_ENV === "development";
  const trimmedMessage = message.trim();
  const lowerMessage = trimmedMessage.toLowerCase();
  const appearsNonEnglish = /[^\u0000-\u007f]/.test(trimmedMessage);
  const context = inferDemoContext(trimmedMessage);
  const soundsTentative =
    /\b(just|maybe|sorry|checking|wondering|upset|if you can)\b/i.test(
      trimmedMessage,
    ) || trimmedMessage.includes("?");
  const soundsAngry =
    /\b(sucks|hate|angry|mad|annoyed|whatever|ridiculous|done)\b/i.test(
      trimmedMessage,
    );
  const usesLolAsArmor = /\blol\b/i.test(trimmedMessage);
  const isPassiveAggressive =
    /\b(per my last email|k\.?$|whatever|fine|sure|no worries)\b/i.test(
      trimmedMessage,
    );
  const isBlunt = trimmedMessage.length < 40 || soundsAngry;
  const label = isDevelopment ? "Demo mode: " : "";

  let improvedRewrite =
    "I want to say this clearly without making it heavier than it needs to be. Can we talk about it?";
  let emotionalInterpretation =
    "This message could be read a few ways, but the main gap seems to be between your intended clarity and how much pressure the wording may create.";
  let perceptionGap =
    "You likely intend to be clear, but the recipient may need to infer the emotional context. Naming the need more directly would reduce that gap.";
  let youMeant =
    "You want to say something real without making the conversation heavier than it needs to be.";
  let theyMayHear =
    "They may understand the point, but they might have to guess at the feeling or need underneath.";
  const mostRevealingLineQuote = getMostRevealingLine(trimmedMessage);
  let mostRevealingLineExplanation =
    "This is where the message shows the emotional stakes most clearly.";
  let recipientLikelyPerception =
    "They may understand the point, but they could also wonder what you are not saying out loud.";

  if (appearsNonEnglish) {
    emotionalInterpretation =
      "The message has emotional subtext, but demo mode cannot reliably localize the full read. Keeping the interpretation clear instead of forcing English assumptions onto it.";
    perceptionGap =
      "Your intent may be clear in context, but formality and tone can shift across language and region. Keeping the rewrite close to your original tone reduces that gap.";
    mostRevealingLineExplanation =
      "This line carries the clearest signal, though tone can shift by language and context.";
    recipientLikelyPerception =
      "They may understand the intent, but tone and formality could shift depending on region and relationship.";
    improvedRewrite = trimmedMessage;
  } else if (lowerMessage === "k." || lowerMessage === "k") {
    emotionalInterpretation =
      "This is extremely brief, so the recipient may read distance or irritation into it.";
    perceptionGap =
      "You may intend acknowledgment, but they may perceive withdrawal or disapproval. Adding one short feeling or next step would reduce that gap.";
    mostRevealingLineExplanation =
      "The brevity does the emotional work; it can read like distance more than agreement.";
    recipientLikelyPerception =
      "They may read this as cold, annoyed, or deliberately clipped.";
    improvedRewrite =
      "Okay. I am not thrilled about it, but I hear you.";
  } else if (lowerMessage.includes("are you ignoring me")) {
    emotionalInterpretation = usesLolAsArmor
      ? "The casual ending softens the sentence, but the core message still carries emotional pressure."
      : "This is asking for reassurance, but the wording may feel accusatory.";
    perceptionGap =
      "You want reassurance, but they may perceive blame before they understand the need. Naming the check-in more gently would reduce that gap.";
    mostRevealingLineExplanation =
      "This turns a check-in into something that may feel like an accusation.";
    recipientLikelyPerception =
      "They may feel accused before they have a chance to explain, even if you mostly want reassurance.";
    improvedRewrite =
      "Hey, I might be reading into it, but I haven't heard from you and wanted to check in. Are we okay?";
  } else if (lowerMessage.includes("per my last email")) {
    emotionalInterpretation =
      "This is professional, but it can signal frustration because it points back to a missed exchange.";
    perceptionGap =
      "You intend to restore momentum, but they may perceive impatience. A specific, neutral next step would reduce that gap.";
    mostRevealingLineExplanation =
      "The phrase is professional, but it also signals impatience and prior frustration.";
    recipientLikelyPerception =
      "They may read it as professional, but also as noticeably impatient.";
    improvedRewrite =
      "Following up on my last email. Could you take another look when you have a chance?";
  } else if (lowerMessage.includes("whatever") && lowerMessage.includes("do what you want")) {
    emotionalInterpretation =
      "The wording gives permission, but the emotional impact suggests unresolved frustration.";
    perceptionGap =
      "You may intend to step back, but they may perceive resentment or a test. Saying what matters to you directly would reduce that gap.";
    mostRevealingLineExplanation =
      "This sounds like permission, but emotionally it carries disappointment and pressure.";
    recipientLikelyPerception =
      "They may hear the frustration, but the wording could invite defensiveness instead of a real answer.";
    improvedRewrite =
      "I'm frustrated, and I don't want to keep going in circles. Do what you think is best, but I want you to know this matters to me.";
  } else if (lowerMessage.includes("this job sucks")) {
    emotionalInterpretation =
      "The emotion is clear, but the message does not yet clarify whether you want support, action, or space to vent.";
    perceptionGap =
      "You intend to express pressure, but they may not know what kind of response would help. Naming whether you want support, change, or space would reduce that gap.";
    mostRevealingLineExplanation =
      "The line names the feeling clearly, but it does not tell the other person what you need.";
    recipientLikelyPerception =
      "They may understand you are fed up, but they may not know whether you want support, change, or just a place to vent.";
    improvedRewrite =
      "I'm really frustrated with work right now. I need to figure out what's actually fixable, because this is wearing me down.";
  } else if (context === "work" && soundsAngry) {
    emotionalInterpretation =
      "The concern may be valid, but the emotional pressure could draw attention away from the practical request.";
    perceptionGap =
      "You intend to flag a problem, but they may focus on the frustration before the substance. Separating the issue from the heat would reduce that gap.";
    mostRevealingLineExplanation =
      "This is where the valid issue starts to sound more heated than actionable.";
    recipientLikelyPerception =
      "They may focus on the heat of the message before they get to the actual issue.";
    improvedRewrite =
      "I'm pretty frustrated with how this is going. Can we talk through what needs to change?";
  } else if (context === "work") {
    emotionalInterpretation = isPassiveAggressive
      ? "This stays professional on the surface, but the tension is still visible."
      : "This is mostly clear and practical, with room for a little more warmth if the relationship needs it.";
    perceptionGap = isPassiveAggressive
      ? "You intend to stay professional, but they may perceive pressure underneath the wording. A neutral next step would reduce that gap."
      : "You intend to move the work forward, and they are likely to perceive a clear next step.";
    mostRevealingLineExplanation = isPassiveAggressive
      ? "The politeness softens the surface, but the frustration is still visible."
      : "This line carries the practical ask, which keeps the message grounded.";
    recipientLikelyPerception =
      "They may read it as professional, though it could feel clipped if there is tension already.";
    improvedRewrite =
      "I wanted to follow up and make sure we're on the same page. What would be the best next step here?";
  } else if (context === "dating" && soundsTentative) {
    emotionalInterpretation = usesLolAsArmor
      ? "The casual wording reduces intensity, but the message still asks for emotional clarity."
      : "This is asking for reassurance while trying to keep the tone light.";
    perceptionGap =
      "You intend to check the connection, but they may perceive uncertainty or pressure to reassure. A softer, direct check-in would reduce that gap.";
    mostRevealingLineExplanation =
      "This is the moment the message reveals it is asking for emotional clarity.";
    recipientLikelyPerception =
      "They may sense the uncertainty underneath and either reassure you or feel pressure to respond carefully.";
    improvedRewrite =
      "Hey, I might be overthinking it, but I wanted to check in. Are we good?";
  } else if (context === "apology") {
    emotionalInterpretation =
      "This is oriented toward repair; it will land best if it clearly names responsibility and impact.";
    perceptionGap =
      "You intend to repair trust, but they may look for evidence that you understand the impact. Naming responsibility clearly would reduce that gap.";
    mostRevealingLineExplanation =
      "This is where the repair attempt shows whether it is taking responsibility.";
    recipientLikelyPerception =
      "They may be looking for whether you understand the impact, not just whether you regret the awkwardness.";
    improvedRewrite =
      "I'm sorry. I can see how that came across, and I should have handled it better.";
  } else if (soundsAngry) {
    emotionalInterpretation =
      "The feeling is clear, but the delivery may raise defensiveness before the issue is understood.";
    perceptionGap =
      "You intend honesty, but they may perceive escalation. A clearer ask would reduce that gap.";
    mostRevealingLineExplanation =
      "This line carries the heat, so it may shape the whole read before the point lands.";
    recipientLikelyPerception =
      "They may get defensive unless the message gives them something clear to respond to.";
    improvedRewrite =
      "I'm upset, and I want to be honest about that without making this worse. Can we talk about what's going on?";
  } else if (soundsTentative) {
    emotionalInterpretation = usesLolAsArmor
      ? "The casual wording lowers the stakes, but it also makes the real ask less direct."
      : "This is gentle, but it circles the point instead of stating it cleanly.";
    perceptionGap =
      "You intend to be low-pressure, but they may perceive uncertainty or indirectness. Naming the ask more simply would reduce that gap.";
    mostRevealingLineExplanation =
      "This phrase reveals the reassurance-seeking under the softer wording.";
    recipientLikelyPerception =
      "They may read it as sweet, but also a little unsure or approval-seeking.";
    improvedRewrite =
      "Hey, I wanted to check in without making this weird. How are you feeling about things?";
  }

  const soundsCalmOrHealthy =
    !soundsAngry &&
    !isPassiveAggressive &&
    !usesLolAsArmor &&
    !/\b(ignoring me|mad at me|upset with me|whatever|hate|ridiculous)\b/i.test(
      trimmedMessage,
    ) &&
    (/\b(i understand|thanks for telling me|no pressure|when you have time|i appreciate|i hear you|that works|sounds good|hope you're okay|i'm proud|happy for you)\b/i.test(
      trimmedMessage,
    ) ||
      (trimmedMessage.length >= 45 && !soundsTentative));

  if (soundsCalmOrHealthy) {
    emotionalInterpretation =
      "This sounds calm, grounded, and easy to receive.";
    perceptionGap =
      "The intent and likely perception are closely aligned: clear, respectful, and steady. There is little to reduce here.";
    youMeant =
      "You meant to be clear and kind without overperforming or chasing reassurance.";
    theyMayHear =
      "They are likely to hear a steady, respectful message with room to respond.";
    mostRevealingLineExplanation =
      "This line gives the message its steady center instead of escalating the feeling.";
    recipientLikelyPerception =
      "They are likely to read this as healthy and direct. You do not need to sand it down much.";
    improvedRewrite = trimmedMessage;
  }

  const hasHighPressure =
    soundsAngry ||
    soundsTentative ||
    isPassiveAggressive ||
    /ignoring me|whatever|do what you want|per my last email/i.test(
      trimmedMessage,
    );
  const hasWidePerceptionGap =
    !soundsCalmOrHealthy && (hasHighPressure || isBlunt || soundsTentative);
  const confidenceScore = soundsCalmOrHealthy ? 9 : isBlunt || soundsTentative ? 6 : 8;
  const clarityScore = soundsCalmOrHealthy ? 9 : isBlunt ? 6 : 8;
  const communicationIntelligenceScore = createCommunicationIntelligenceScore({
    clarityScore,
    confidenceScore,
    hasHighPressure,
    hasWidePerceptionGap,
  });

  return {
    tone: `${label}${
      soundsCalmOrHealthy
        ? "Calm and healthy"
        : isPassiveAggressive
        ? "Indirect frustration"
        : soundsAngry
          ? "Emotionally loaded"
          : soundsTentative
            ? "Uncertain but careful"
            : "Clear with room to sharpen"
    }`,
    confidenceScore,
    clarityScore,
    communicationIntelligenceScore,
    classification: classifyMessage(trimmedMessage),
    communicationFramework: {
      perceptionGap: completePerceptionGap(perceptionGap),
      emotionalPressure: hasHighPressure
        ? "The message carries noticeable emotional pressure, so the recipient may respond to the tone before the content."
        : "The emotional pressure is low enough for the content to stay easy to receive.",
      confidenceSignal: soundsTentative
        ? "The message signals some uncertainty through softening or indirect phrasing."
        : "The message signals enough confidence for the core point to be understood.",
      hiddenSubtext: theyMayHear,
      communicationClarity:
        clarityScore >= 8
          ? "The main point is easy to identify."
          : "The main point could be easier to identify with a little more directness.",
    },
    emotionalInterpretation: `${label}${emotionalInterpretation}`,
    perceptionGap: completePerceptionGap(perceptionGap),
    intentVsImpact: {
      youMeant,
      theyMayHear,
    },
    mostRevealingLine: {
      quote: mostRevealingLineQuote,
      explanation: mostRevealingLineExplanation,
    },
    recipientLikelyPerception,
    improvedRewrite,
    debug,
  };
}

function normalizeAnalysisResult(
  value: unknown,
  message: string,
  debug = createDebugMetadata({ success: true }),
): AnalysisResult {
  const fallback = createDemoAnalysis(message, debug);

  if (!value || typeof value !== "object") return fallback;

  const result = value as Record<string, unknown>;
  const intentVsImpact =
    result.intentVsImpact &&
    typeof result.intentVsImpact === "object"
      ? (result.intentVsImpact as Record<string, unknown>)
      : null;
  const mostRevealingLine =
    result.mostRevealingLine &&
    typeof result.mostRevealingLine === "object"
      ? (result.mostRevealingLine as Record<string, unknown>)
      : null;
  const communicationFramework =
    result.communicationFramework &&
    typeof result.communicationFramework === "object"
      ? (result.communicationFramework as Record<string, unknown>)
      : null;

  return {
    tone:
      typeof result.tone === "string"
        ? softenAnalysisLanguage(result.tone)
        : fallback.tone,
    confidenceScore:
      typeof result.confidenceScore === "number"
        ? result.confidenceScore
        : fallback.confidenceScore,
    clarityScore:
      typeof result.clarityScore === "number"
        ? result.clarityScore
        : fallback.clarityScore,
    communicationIntelligenceScore:
      typeof result.communicationIntelligenceScore === "number"
        ? clampScore(result.communicationIntelligenceScore)
        : fallback.communicationIntelligenceScore,
    classification: normalizeClassification(
      result.classification,
      fallback.classification,
    ),
    communicationFramework: {
      perceptionGap:
        typeof communicationFramework?.perceptionGap === "string"
          ? softenAnalysisLanguage(completePerceptionGap(communicationFramework.perceptionGap))
          : fallback.communicationFramework.perceptionGap,
      emotionalPressure:
        typeof communicationFramework?.emotionalPressure === "string"
          ? softenAnalysisLanguage(communicationFramework.emotionalPressure)
          : fallback.communicationFramework.emotionalPressure,
      confidenceSignal:
        typeof communicationFramework?.confidenceSignal === "string"
          ? softenAnalysisLanguage(communicationFramework.confidenceSignal)
          : fallback.communicationFramework.confidenceSignal,
      hiddenSubtext:
        typeof communicationFramework?.hiddenSubtext === "string"
          ? softenAnalysisLanguage(communicationFramework.hiddenSubtext)
          : fallback.communicationFramework.hiddenSubtext,
      communicationClarity:
        typeof communicationFramework?.communicationClarity === "string"
          ? softenAnalysisLanguage(communicationFramework.communicationClarity)
          : fallback.communicationFramework.communicationClarity,
    },
    emotionalInterpretation:
      typeof result.emotionalInterpretation === "string"
        ? softenAnalysisLanguage(result.emotionalInterpretation)
        : fallback.emotionalInterpretation,
    perceptionGap:
      typeof result.perceptionGap === "string"
        ? softenAnalysisLanguage(completePerceptionGap(result.perceptionGap))
        : fallback.perceptionGap,
    intentVsImpact: {
      youMeant:
        typeof intentVsImpact?.youMeant === "string"
          ? softenAnalysisLanguage(intentVsImpact.youMeant)
          : fallback.intentVsImpact.youMeant,
      theyMayHear:
        typeof intentVsImpact?.theyMayHear === "string"
          ? softenAnalysisLanguage(intentVsImpact.theyMayHear)
          : fallback.intentVsImpact.theyMayHear,
    },
    mostRevealingLine: {
      quote:
        typeof mostRevealingLine?.quote === "string"
          ? mostRevealingLine.quote
          : fallback.mostRevealingLine.quote,
      explanation:
        typeof mostRevealingLine?.explanation === "string"
          ? softenAnalysisLanguage(mostRevealingLine.explanation)
          : fallback.mostRevealingLine.explanation,
    },
    recipientLikelyPerception:
      typeof result.recipientLikelyPerception === "string"
        ? softenAnalysisLanguage(result.recipientLikelyPerception)
        : fallback.recipientLikelyPerception,
    improvedRewrite:
      typeof result.improvedRewrite === "string"
        ? softenAnalysisLanguage(result.improvedRewrite)
        : fallback.improvedRewrite,
    debug,
  };
}

function parseAnalysisText(text: string) {
  const cleaned = text.trim();
  const fencedJsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedJsonMatch?.[1] ?? cleaned;
  const start = jsonText.indexOf("{");
  const end = jsonText.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("OpenAI response did not contain a JSON object.");
  }

  return JSON.parse(jsonText.slice(start, end + 1));
}

function formatPromptContext(context: OptionalMessageContext) {
  const contextLines = [
    context.relationshipContext
      ? `- relationshipContext: ${context.relationshipContext}`
      : null,
    context.desiredTone ? `- desiredTone: ${context.desiredTone}` : null,
    context.messageGoal ? `- messageGoal: ${context.messageGoal}` : null,
  ].filter(Boolean);

  if (contextLines.length === 0) {
    return "- No additional context provided.";
  }

  return contextLines.join("\n");
}

function getTokenUsage(response: unknown): AnalysisDebugMetadata["tokenUsage"] {
  if (!response || typeof response !== "object" || !("usage" in response)) {
    return null;
  }

  const usage = (response as { usage?: unknown }).usage;

  if (!usage || typeof usage !== "object") {
    return null;
  }

  const usageRecord = usage as Record<string, unknown>;
  const inputTokens =
    typeof usageRecord.input_tokens === "number"
      ? usageRecord.input_tokens
      : undefined;
  const outputTokens =
    typeof usageRecord.output_tokens === "number"
      ? usageRecord.output_tokens
      : undefined;
  const totalTokens =
    typeof usageRecord.total_tokens === "number"
      ? usageRecord.total_tokens
      : undefined;

  if (
    inputTokens === undefined &&
    outputTokens === undefined &&
    totalTokens === undefined
  ) {
    return null;
  }

  return { inputTokens, outputTokens, totalTokens };
}

function trackSafeFeedback({
  feedback,
  classification,
  debug,
  characterCount,
}: {
  feedback?: SafeFeedbackInput;
  classification: MessageClassification;
  debug: AnalysisDebugMetadata;
  characterCount: number;
}) {
  if (!feedback) {
    return;
  }

  console.info("Analyze: safe feedback received", {
    promptVersion: debug.promptVersion,
    model: debug.model,
    success: debug.success,
    rating: feedback.rating,
    tagCount: feedback.tagCount,
    validatedTagLabels: feedback.validatedTagLabels,
    validatedTagCount: feedback.validatedTagLabels.length,
    category: classification.category,
    emotionalPressureLevel: classification.emotionalPressureLevel,
    communicationRisk: classification.communicationRisk,
    characterCountBucket: Math.ceil(characterCount / 100) * 100,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (err) {
    console.error("Analyze: invalid JSON body", getSafeErrorDetails(err));
    const debug = createDebugMetadata({
      success: false,
      failureReason: "malformed_json_body",
    });

    return jsonResponse(
      withDevelopmentDebug(
        { error: "That request came through sideways. Try pasting it again." },
        debug,
      ),
      400,
    );
  }

  const validatedMessage = validateMessage(body);

  if ("error" in validatedMessage) {
    const debug = createDebugMetadata({
      success: false,
      failureReason: "validation_failed",
    });

    return jsonResponse(
      withDevelopmentDebug({ error: validatedMessage.error }, debug),
      400,
    );
  }

  const message = validatedMessage.message;
  const optionalContext = validatedMessage.context;
  const safeFeedback = validatedMessage.feedback;
  const rateLimit = await checkRateLimit(getRequestIp(request));

  if (!rateLimit.success) {
    const debug = createDebugMetadata({
      success: false,
      failureReason: rateLimit.code,
    });

    return jsonResponse(
      withDevelopmentDebug(
        {
          error:
            rateLimit.code === "burst_limit_exceeded"
              ? BURST_RATE_LIMITED_MESSAGE
              : RATE_LIMITED_MESSAGE,
          code: rateLimit.code,
        },
        debug,
      ),
      429,
    );
  }

  if (!client) {
    console.error(
      "Analyze: OPENAI_API_KEY is not configured. Returning demo analysis fallback.",
    );
    const analysis = createDemoAnalysis(
      message,
      createDebugMetadata({
        success: true,
        failureReason: "openai_api_key_missing_demo_fallback",
      }),
    );

    trackSafeFeedback({
      feedback: safeFeedback,
      classification: analysis.classification,
      debug: analysis.debug,
      characterCount: message.length,
    });

    return analysisResponse(analysis);
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, OPENAI_TIMEOUT_MS);

  try {
    const prompt = `You are BetweenLines AI, a calm, emotionally intelligent communication companion.

Prompt version: ${PROMPT_VERSION}

Core communication principles:
- Clarity over assumption.
- Curiosity over escalation.
- Interpretation over judgment.
- Never fuel paranoia, catastrophizing, or mind-reading.
- Never tell the user what someone definitely thinks or feels.
- Use "may," "could," and "might" where appropriate.
- Help the user communicate clearly with warm, steady, direct judgment.

Communication Intelligence Framework:
- Perception Gap: the difference between what the sender intended and what the recipient may perceive.
- Emotional Pressure: how much emotional weight, urgency, tension, or relational pressure the message carries.
- Confidence Signal: whether the message sounds grounded, direct, uncertain, defensive, or over-softened.
- Hidden Subtext: what the recipient may infer beyond the literal words.
- Communication Clarity: how easy it is to understand the core message and desired response.

Product voice:
- Mature, useful, nonjudgmental, emotionally intelligent, and direct without being harsh.
- No roast language, meme language, exaggerated internet phrasing, or gimmicks.
- If the message already sounds calm, confident, kind, direct, emotionally healthy, or ready to send, reassure the user instead of manufacturing a problem.
- Avoid making the recipient sound hostile unless the wording strongly supports that interpretation.
- Avoid harsh labels such as "manipulative," "toxic," "desperate," "needy," "pathetic," "red flag," or "clingy."
- Prefer language like "emotionally high-pressure," "may feel intense," "could come across as uncertain," "may read as defensive," "creates a perception gap," and "softening this could reduce pressure."

Anti-overinterpretation rules:
- Do not turn neutral, healthy, or logistical messages into drama.
- If the message is already respectful and clear, say the risk is low and keep the rewrite identical or nearly identical.
- Do not infer abandonment, hostility, manipulation, romantic interest, contempt, or hidden conflict unless the wording strongly supports it.
- Treat short messages as low-context first, not automatically angry.
- When context is missing, name uncertainty rather than filling it with a dramatic story.
- Avoid escalating "could be clearer" into a serious relational problem.
- If the safest read is ordinary, practical, or kind, choose that read.

Language and cultural awareness:
- Analyze and rewrite in the message's language unless the user clearly asks otherwise.
- Preserve formality, pronouns, honorifics, dialect, code-switching, and workplace politeness norms where possible.
- Do not force English slang, American/UK idioms, or internet jokes into non-English messages.
- Do not mock the user's language, dialect, grammar, accent, or culture.
- If region is unclear, avoid region-specific slang and be clear, warm, and useful.

Analyze the draft and return ONLY valid JSON. Do not include markdown, comments, or extra text.

Required JSON keys:
- tone: string
- confidenceScore: number from 0-10
- clarityScore: number from 0-10
- communicationIntelligenceScore: number from 0-100, where higher means clearer, steadier, lower-pressure, and better aligned with likely perception
- classification: object with exactly these keys:
  - category: string
  - likelyIntent: string
  - emotionalPressureLevel: one of "low", "medium", or "high"
  - confidenceSignal: string
  - communicationRisk: one of "low", "medium", or "high"
  - rewriteStrategy: string
- communicationFramework: object with exactly these string keys:
  - perceptionGap
  - emotionalPressure
  - confidenceSignal
  - hiddenSubtext
  - communicationClarity
- emotionalInterpretation: string
- perceptionGap: string
- intentVsImpact: object with exactly these string keys:
  - youMeant
  - theyMayHear
- mostRevealingLine: object with exactly these string keys:
  - quote: the single phrase or sentence from the user's message most responsible for the emotional impression
  - explanation: concise explanation of why that line changes the emotional tone
- recipientLikelyPerception: string
- improvedRewrite: string

Analysis style rules:
- Sound like a communication expert with strong emotional intelligence: accurate, useful, restrained, and never cruel.
- Consider reassurance-seeking, frustration, uncertainty, fear of being ignored, guilt, avoidance, vulnerability, pressure, defensiveness, overexplaining, mixed signals, and indirectness.
- Name likely perception only when it helps the user understand communication impact.
- If the message is serious, vulnerable, or high-stakes, be sincere. If it is clear, calm, confident, or healthy, say that directly.
- The intentVsImpact section should separate the user's likely good intent from the way the recipient may receive it.
- The perceptionGap field must clearly distinguish: what the sender likely means, what the recipient may hear, why the gap exists, and how to reduce that gap.
- Every perceptionGap should be concise and include a practical bridge such as naming the need, softening the opener, making the ask more specific, or reducing extra pressure.
- The communicationIntelligenceScore should reflect clarity, confidence signal, emotional pressure, and perception alignment. It is a communication quality indicator, not a judgment of the person.
- The mostRevealingLine quote must be an exact short phrase or sentence from the message, not a paraphrase. Keep the explanation concise, insightful, and screenshot-friendly.
- Avoid clinical phrases, corporate filler, and therapy-speak.
- Match the language of the message in tone, idiom, and register. If the language is not English, do not translate the user's situation into English cultural assumptions.
- If uncertain, say something close to: "This message could be read a few ways, but the main gap seems to be between your intended clarity and how much pressure the wording may create."
- Use the optional context only to improve calibration. Do not mention it unless it directly improves the analysis.
- Desired tone and message goal should guide the rewrite, but they should not override safety, clarity, or the original message's natural register.

Rewrite style rules:
- The improvedRewrite should sound like something a normal person would actually send.
- Preserve the user's intent, emotional intent, natural tone, and original language while reducing unnecessary pressure.
- Make the message clearer and easier to receive, not bland.
- Avoid sarcasm, robotic phrasing, corporate filler, HR language, and therapist-speak unless the context clearly calls for it.
- Match the likely context when possible: dating, work, friendship, family, apology, confrontation.
- Keep casual messages casual and professional messages professional but not stiff.
- If the original message is blunt, preserve some directness while making it less damaging.
- If the original message is emotionally pressured, make it steadier without removing warmth.
- If the original message is angry, make it honest but controlled.
- If the original message is already healthy, keep the rewrite minimal or identical unless a small clarity edit would truly help.
- If the original message is very short, the rewrite can be short too.
- Do not make every message sound like HR.
- Preserve the original formality level when it helps the message land: casual stays casual, polite stays polite, professional stays professional.
- Do not over-correct dialect, code-switching, informal texting style, or region-specific phrasing unless it creates a real clarity problem.

English examples of the desired voice. These show attitude, not language requirements:
- Input: "hey just checking if you're mad at me lol"
  emotionalInterpretation: "The casual phrasing softens the message, but the recipient may still hear a request for reassurance."
  perceptionGap: "You intend a light check-in, but they may perceive emotional pressure underneath it because the need for reassurance is indirect. A clearer, gentler ask would reduce that gap."
  improvedRewrite: "Hey, I might be overthinking it, but I wanted to check in. Are we okay?"
- Input: "K."
  emotionalInterpretation: "This is clear but very low-context, so it may read as detached."
  perceptionGap: "You may intend simple acknowledgment, but they may perceive distance or disapproval because there is no emotional context. Adding one short cue would reduce that gap."
  improvedRewrite: "Okay. I am not thrilled about it, but I hear you."
- Input: "whatever do what you want"
  emotionalInterpretation: "The wording sounds like permission, but the impact may be frustration or resignation."
  perceptionGap: "You may intend to disengage, but they may perceive resentment or a test because the real feeling is implied rather than named. Saying what matters directly would reduce that gap."
  improvedRewrite: "I'm frustrated, and I don't want to keep going in circles. Do what you think is best, but I want you to know this matters to me."
- Input: "per my last email"
  emotionalInterpretation: "This is professional, but it can also communicate impatience."
  perceptionGap: "You intend to reference prior context, but they may perceive frustration because the phrase points to a missed step. A neutral next action would reduce that gap."
  improvedRewrite: "Following up on my last email. Could you take another look when you have a chance?"
- Input: "this job sucks"
  emotionalInterpretation: "The emotional pressure is clear, but the message does not yet clarify what support or action you want."
  perceptionGap: "You intend to express strain, but they may not know what response would help because the need is unnamed. Saying whether you want support, change, or space would reduce that gap."
  improvedRewrite: "I'm really frustrated with work right now. I need to figure out what's actually fixable, because this is wearing me down."

Optional context:
${formatPromptContext(optionalContext)}

Message:
${message}`;

    const resp = await client.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 780,
    }, {
      signal: abortController.signal,
    });
    const tokenUsage = getTokenUsage(resp);

    // Extract text from response output. Use output_text when available
    const responseWithText = resp as { output_text?: unknown; output?: unknown };
    let text = "";
    if (typeof responseWithText.output_text === "string" && responseWithText.output_text.trim().length > 0) {
      text = responseWithText.output_text;
    } else if (Array.isArray(responseWithText.output)) {
      for (const out of responseWithText.output) {
        if (!out || typeof out !== "object" || !("content" in out) || !Array.isArray(out.content)) continue;
        for (const chunk of out.content) {
          if (!chunk) continue;
          if (typeof chunk === "string") text += chunk;
          else if (typeof chunk === "object" && "text" in chunk && typeof chunk.text === "string") text += chunk.text;
        }
      }
    }

    const cleaned = (text || "").trim();
    if (!cleaned) {
      console.error("Analyze: empty response from OpenAI. Returning demo analysis fallback.");
      const analysis = createDemoAnalysis(
        message,
        createDebugMetadata({
          success: false,
          failureReason: "openai_empty_response_demo_fallback",
          tokenUsage,
        }),
      );

      trackSafeFeedback({
        feedback: safeFeedback,
        classification: analysis.classification,
        debug: analysis.debug,
        characterCount: message.length,
      });

      return analysisResponse(analysis);
    }

    const successDebug = createDebugMetadata({
      success: true,
      tokenUsage,
    });
    let analysis = createDemoAnalysis(message, successDebug);
    try {
      analysis = normalizeAnalysisResult(parseAnalysisText(cleaned), message, successDebug);
    } catch (err) {
      console.error(
        "Analyze: failed to parse JSON from OpenAI response. Returning demo analysis fallback.",
        getSafeErrorDetails(err),
      );
      analysis = createDemoAnalysis(
        message,
        createDebugMetadata({
          success: false,
          failureReason: "openai_json_parse_failed_demo_fallback",
          tokenUsage,
        }),
      );
    }

    trackSafeFeedback({
      feedback: safeFeedback,
      classification: analysis.classification,
      debug: analysis.debug,
      characterCount: message.length,
    });

    return analysisResponse(analysis);
  } catch (error) {
    if (abortController.signal.aborted) {
      console.error("Analyze route OpenAI request timed out.");
      const debug = createDebugMetadata({
        success: false,
        failureReason: "openai_timeout",
      });

      return jsonResponse(
        withDevelopmentDebug({ error: TIMEOUT_MESSAGE }, debug),
        504,
      );
    }

    console.error(
      "Analyze route OpenAI request failed.",
      getSafeErrorDetails(error),
    );

    const debug = createDebugMetadata({
      success: false,
      failureReason: "openai_request_failed",
    });

    return jsonResponse(withDevelopmentDebug({ error: GENERIC_ERROR_MESSAGE }, debug), 502);
  } finally {
    clearTimeout(timeout);
  }
}
