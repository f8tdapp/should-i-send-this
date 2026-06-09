import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  emotionalInterpretation: string;
  recipientLikelyPerception: string;
  improvedRewrite: string;
};

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MESSAGE_CHARACTER_LIMIT = 750;
const OPENAI_TIMEOUT_MS = 20_000;
const RATE_LIMITED_MESSAGE =
  "Okay. Deep breath. You've analyzed a lot of texts today. Try again later.";
const BURST_RATE_LIMITED_MESSAGE =
  "Tiny pause. TextPanic needs a second before the next read.";
const TIMEOUT_MESSAGE =
  "The read is taking too long. The text can wait. Try again in a moment.";
const GENERIC_ERROR_MESSAGE =
  "TextPanic hit a weird little snag. Try again in a moment.";

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

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || "anonymous";
}

function validateMessage(body: unknown) {
  const message =
    body && typeof body === "object" && "message" in body
      ? (body as { message?: unknown }).message
      : undefined;

  if (typeof message !== "string") {
    return {
      error: "Paste a message first. TextPanic needs something to read.",
    };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return {
      error: "Paste a message first. TextPanic needs something to read.",
    };
  }

  if (trimmedMessage.length > MESSAGE_CHARACTER_LIMIT) {
    return { error: "That's enough panic for one read." };
  }

  return { message: trimmedMessage };
}

async function checkRateLimit(ip: string) {
  if (!dailyRateLimit || !burstRateLimit) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Analyze: Upstash env vars are not configured. Rate limiting is disabled.",
      );
    }

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

function createDemoAnalysis(message: string): AnalysisResult {
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
    "This is readable, but it is leaving a little too much emotional homework for the other person.";
  let recipientLikelyPerception =
    "They will probably understand the point, but they may also wonder what you are not saying out loud.";

  if (appearsNonEnglish) {
    emotionalInterpretation =
      "The message has emotional subtext, but demo mode cannot reliably localize the read. Keeping this clear instead of forcing English slang onto it.";
    recipientLikelyPerception =
      "They may understand the intent, but tone and formality could shift depending on region and relationship.";
    improvedRewrite = trimmedMessage;
  } else if (lowerMessage === "k." || lowerMessage === "k") {
    emotionalInterpretation =
      "This has the emotional warmth of a folding chair. Technically a response, spiritually a door closing.";
    recipientLikelyPerception =
      "They will likely read this as cold, annoyed, or deliberately clipped.";
    improvedRewrite =
      "Okay. I am not thrilled about it, but I hear you.";
  } else if (lowerMessage.includes("are you ignoring me")) {
    emotionalInterpretation = usesLolAsArmor
      ? "You are absolutely not 'lol'-ing right now. The joke is wearing a tiny fake mustache over panic."
      : "This is asking for reassurance, but it comes in a little hot.";
    recipientLikelyPerception =
      "They may feel accused before they have a chance to explain, even if you mostly want reassurance.";
    improvedRewrite =
      "Hey, I might be reading into it, but I haven't heard from you and wanted to check in. Are we okay?";
  } else if (lowerMessage.includes("per my last email")) {
    emotionalInterpretation =
      "This sounds like you're one inconvenience away from attaching a PDF titled 'Enough.'";
    recipientLikelyPerception =
      "They will read it as professional, but also as a very polished warning shot.";
    improvedRewrite =
      "Following up on my last email. Could you take another look when you have a chance?";
  } else if (lowerMessage.includes("whatever") && lowerMessage.includes("do what you want")) {
    emotionalInterpretation =
      "You do not, in fact, want them to do whatever they want.";
    recipientLikelyPerception =
      "They will probably hear the frustration, but the wording invites a fight instead of a real answer.";
    improvedRewrite =
      "I'm frustrated, and I don't want to keep going in circles. Do what you think is best, but I want you to know this matters to me.";
  } else if (lowerMessage.includes("this job sucks")) {
    emotionalInterpretation =
      "This is extremely clear emotionally and extremely unhelpful logistically. Valid mood, not yet a plan.";
    recipientLikelyPerception =
      "They will know you are fed up, but they may not know whether you want support, change, or just a place to vent.";
    improvedRewrite =
      "I'm really frustrated with work right now. I need to figure out what's actually fixable, because this is wearing me down.";
  } else if (context === "work" && soundsAngry) {
    emotionalInterpretation =
      "The frustration is doing the driving here. It may be true, but it needs a steering wheel.";
    recipientLikelyPerception =
      "They will likely focus on the heat of the message before they get to the actual issue.";
    improvedRewrite =
      "I'm pretty frustrated with how this is going. Can we talk through what needs to change?";
  } else if (context === "work") {
    emotionalInterpretation = isPassiveAggressive
      ? "This is wearing a blazer, but the sleeves are full of passive aggression."
      : "This is mostly clear, but it could use a little more human oxygen.";
    recipientLikelyPerception =
      "They will read it as professional, though it may feel clipped if there is tension already.";
    improvedRewrite =
      "I wanted to follow up and make sure we're on the same page. What would be the best next step here?";
  } else if (context === "dating" && soundsTentative) {
    emotionalInterpretation = usesLolAsArmor
      ? "The 'lol' is doing emotional camouflage. You are trying to sound chill while very much not feeling chill."
      : "This wants reassurance but is trying not to look like it wants reassurance.";
    recipientLikelyPerception =
      "They may sense the anxiety underneath and either reassure you or feel cornered by it.";
    improvedRewrite =
      "Hey, I might be overthinking it, but I wanted to check in. Are we good?";
  } else if (context === "apology") {
    emotionalInterpretation =
      "This is close, but a real apology needs less self-protection and more ownership.";
    recipientLikelyPerception =
      "They will be looking for whether you understand the impact, not just whether you regret the awkwardness.";
    improvedRewrite =
      "I'm sorry. I can see how that came across, and I should have handled it better.";
  } else if (soundsAngry) {
    emotionalInterpretation =
      "The feeling is honest. The delivery is where things start throwing furniture.";
    recipientLikelyPerception =
      "They will probably get defensive unless the message gives them something clear to respond to.";
    improvedRewrite =
      "I'm upset, and I want to be honest about that without making this worse. Can we talk about what's going on?";
  } else if (soundsTentative) {
    emotionalInterpretation = usesLolAsArmor
      ? "The casual wording is doing a lot of emotional heavy lifting. The 'lol' is not fooling anyone."
      : "This is gentle, but it is also circling the point like it might get in trouble for landing.";
    recipientLikelyPerception =
      "They may read it as sweet, but also a little unsure or approval-seeking.";
    improvedRewrite =
      "Hey, I wanted to check in without making this weird. How are you feeling about things?";
  }

  return {
    tone: `${label}${
      isPassiveAggressive
        ? "Passive-aggressive"
        : soundsAngry
          ? "Frustrated and blunt"
          : soundsTentative
            ? "Anxious but trying to sound chill"
            : "Clear enough, a little under-seasoned"
    }`,
    confidenceScore: isBlunt || soundsTentative ? 6 : 8,
    clarityScore: isBlunt ? 6 : 8,
    emotionalInterpretation: `${label}${emotionalInterpretation}`,
    recipientLikelyPerception,
    improvedRewrite,
  };
}

function normalizeAnalysisResult(
  value: unknown,
  message: string,
): AnalysisResult {
  const fallback = createDemoAnalysis(message);

  if (!value || typeof value !== "object") return fallback;

  const result = value as Record<string, unknown>;

  return {
    tone: typeof result.tone === "string" ? result.tone : fallback.tone,
    confidenceScore:
      typeof result.confidenceScore === "number"
        ? result.confidenceScore
        : fallback.confidenceScore,
    clarityScore:
      typeof result.clarityScore === "number"
        ? result.clarityScore
        : fallback.clarityScore,
    emotionalInterpretation:
      typeof result.emotionalInterpretation === "string"
        ? result.emotionalInterpretation
        : fallback.emotionalInterpretation,
    recipientLikelyPerception:
      typeof result.recipientLikelyPerception === "string"
        ? result.recipientLikelyPerception
        : fallback.recipientLikelyPerception,
    improvedRewrite:
      typeof result.improvedRewrite === "string"
        ? result.improvedRewrite
        : fallback.improvedRewrite,
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (err) {
    console.error("Analyze: invalid JSON body", err);
    return jsonResponse(
      { error: "That request came through sideways. Try pasting it again." },
      400,
    );
  }

  const validatedMessage = validateMessage(body);

  if ("error" in validatedMessage) {
    return jsonResponse({ error: validatedMessage.error }, 400);
  }

  const message = validatedMessage.message;
  const rateLimit = await checkRateLimit(getRequestIp(request));

  if (!rateLimit.success) {
    return jsonResponse(
      {
        error:
          rateLimit.code === "burst_limit_exceeded"
            ? BURST_RATE_LIMITED_MESSAGE
            : RATE_LIMITED_MESSAGE,
        code: rateLimit.code,
      },
      429,
    );
  }

  if (!client) {
    console.error(
      "Analyze: OPENAI_API_KEY is not configured. Returning demo analysis fallback.",
    );
    return jsonResponse(createDemoAnalysis(message));
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort();
  }, OPENAI_TIMEOUT_MS);

  try {
    const prompt = `You are "TextPanic", the user's brutally honest friend reading their texts before they hit send.

Product voice:
- Funny, but useful.
- Honest, but not cruel.
- Sharp, but not mean.
- Human, not corporate.
- Emotionally intelligent, not therapy-speak.
- Screenshot-worthy when the message deserves it.
- The humor should come from emotional accuracy, not random jokes.
- Do not make every answer a joke. Some messages need sincerity.

Language and cultural awareness:
- Detect the language of the user's message.
- If the message is in English, use natural English.
- If the message is in another language, analyze and rewrite in that language unless the user clearly asks otherwise.
- Preserve the original language and level of formality where possible, including formal/informal pronouns, honorifics, and workplace politeness norms.
- Adapt humor to the language and likely cultural context of the message.
- Do not force English slang, American/UK idioms, or internet jokes into non-English messages.
- If region is unclear, avoid region-specific slang and choose clear, warm, useful language.
- Humor should come from emotional accuracy, not stereotypes.
- Do not mock the user's language, dialect, grammar, accent, or culture.
- Respect workplace/professional norms by region when they are obvious from the message.
- Keep the trusted brutally honest friend voice, but soften it when bluntness or sarcasm would be culturally inappropriate or unhelpful.
- If unsure, be clear, warm, and useful rather than overly edgy.

Analyze the draft and return ONLY valid JSON. Do not include markdown, comments, or extra text.

Required JSON keys:
- tone: string
- confidenceScore: number from 0-10
- clarityScore: number from 0-10
- emotionalInterpretation: string
- recipientLikelyPerception: string
- improvedRewrite: string

Analysis style rules:
- The analysis should sound like a socially sharp friend who can read the room.
- Detect passive aggression, fake casualness, insecurity, desperation, neediness, emotional coldness, overexplaining, avoidance, manipulation, mixed signals, trying too hard to sound chill, and "lol" used as emotional camouflage.
- Be painfully accurate when appropriate, but never cruel.
- Say the quiet part out loud if it helps the user understand how the message lands.
- Use humor sparingly and only when it reveals the real emotional subtext.
- If the message is serious, vulnerable, or high-stakes, be more sincere than funny.
- Avoid clinical phrases like "this indicates" or "you may be experiencing."
- Avoid corporate phrases like "clear communication" unless the work context truly needs it.
- Match the language of the message in tone, idiom, and register. If the language is not English, do not translate the user's situation into English cultural assumptions.

Rewrite style rules:
- The improvedRewrite should sound like something a normal person would actually send.
- Make the analysis funny/sharp when appropriate, but make the improvedRewrite useful.
- Do not make the improvedRewrite sarcastic unless that is clearly appropriate.
- Do not default to phrases like "I am feeling..." unless that is truly the most natural option.
- Avoid robotic phrasing, corporate filler, HR language, and therapist-speak unless the context clearly calls for it.
- Preserve the sender's emotional intent. Do not sanitize all emotion out of the message.
- Make the message clearer and easier to receive, not bland.
- Match the likely context when possible: dating, work, friendship, family, apology, confrontation.
- Keep casual messages casual.
- Keep professional messages professional, but not stiff.
- Do not over-polish casual texts.
- If the original message is blunt, preserve some directness while making it less damaging.
- If the original message is anxious, make it calmer without removing warmth.
- If the original message is angry, make it honest but controlled.
- If the original message is very short, the rewrite can be short too.
- Do not make every message sound like HR.
- Keep improvedRewrite in the original language unless the user clearly asks for another language.
- Preserve the original formality level when it helps the message land: casual stays casual, polite stays polite, professional stays professional.
- Do not over-correct dialect, code-switching, informal texting style, or region-specific phrasing unless it creates a real clarity problem.

English examples of the desired voice. These show attitude, not language requirements:
- Input: "hey just checking if you're mad at me lol"
  emotionalInterpretation: "You are absolutely not 'lol'-ing right now. The joke is wearing a tiny fake mustache over panic."
  improvedRewrite: "Hey, I might be overthinking it, but I wanted to check in. Are we okay?"
- Input: "K."
  emotionalInterpretation: "This has the emotional warmth of a folding chair. Technically a response, spiritually a door closing."
  improvedRewrite: "Okay. I am not thrilled about it, but I hear you."
- Input: "whatever do what you want"
  emotionalInterpretation: "You do not, in fact, want them to do whatever they want."
  improvedRewrite: "I'm frustrated, and I don't want to keep going in circles. Do what you think is best, but I want you to know this matters to me."
- Input: "per my last email"
  emotionalInterpretation: "This sounds like you're one inconvenience away from attaching a PDF titled 'Enough.'"
  improvedRewrite: "Following up on my last email. Could you take another look when you have a chance?"
- Input: "this job sucks"
  emotionalInterpretation: "This is extremely clear emotionally and extremely unhelpful logistically. Valid mood, not yet a plan."
  improvedRewrite: "I'm really frustrated with work right now. I need to figure out what's actually fixable, because this is wearing me down."

Message:
${message}`;

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 500,
    }, {
      signal: abortController.signal,
    });

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
      console.error(
        "Analyze: empty response from OpenAI. Returning demo analysis fallback.",
      );
      return jsonResponse(createDemoAnalysis(message));
    }

    let analysis = createDemoAnalysis(message);
    try {
      analysis = normalizeAnalysisResult(parseAnalysisText(cleaned), message);
    } catch (err) {
      console.error(
        "Analyze: failed to parse JSON from OpenAI response. Returning demo analysis fallback.",
        err,
      );
      analysis = createDemoAnalysis(message);
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Analyze: normalized API response", analysis);
    }

    return jsonResponse(analysis);
  } catch (error) {
    if (abortController.signal.aborted) {
      console.error("Analyze route OpenAI request timed out.");
      return jsonResponse({ error: TIMEOUT_MESSAGE }, 504);
    }

    console.error(
      "Analyze route OpenAI request failed.",
      error,
    );

    return jsonResponse({ error: GENERIC_ERROR_MESSAGE }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
