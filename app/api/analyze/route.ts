import OpenAI from "openai";

type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  emotionalInterpretation: string;
  recipientLikelyPerception: string;
  improvedRewrite: string;
};

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Record<string, unknown>;

  return (
    typeof result.tone === "string" &&
    typeof result.confidenceScore === "number" &&
    typeof result.clarityScore === "number" &&
    typeof result.emotionalInterpretation === "string" &&
    typeof result.recipientLikelyPerception === "string" &&
    typeof result.improvedRewrite === "string"
  );
}

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function createDemoAnalysis(message: string): AnalysisResult {
  const isDevelopment = process.env.NODE_ENV === "development";
  const trimmedMessage = message.trim();
  const soundsTentative =
    /\b(just|maybe|sorry|checking|wondering|upset|if you can)\b/i.test(
      trimmedMessage,
    ) || trimmedMessage.includes("?");
  const label = isDevelopment ? "Demo mode: " : "";

  return {
    tone: `${label}${soundsTentative ? "Warm but tentative" : "Direct and calm"}`,
    confidenceScore: soundsTentative ? 6 : 8,
    clarityScore: soundsTentative ? 7 : 8,
    emotionalInterpretation: `${label}${
      soundsTentative
        ? "The message reads as thoughtful, but a little unsure. It may be trying to soften the ask more than necessary."
        : "The message reads as steady and practical, with enough emotional restraint to avoid sounding reactive."
    }`,
    recipientLikelyPerception: soundsTentative
      ? "They may see you as considerate, though they might also sense some worry or hesitation behind the wording."
      : "They will likely understand the point quickly and read the message as respectful and composed.",
    improvedRewrite: soundsTentative
      ? "I wanted to check in and see where things stand. When you have a moment, could you let me know how you are feeling about this?"
      : "I wanted to share this clearly and check whether it works for you. Let me know what you think when you have a chance.",
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (err) {
    console.error("Analyze: invalid JSON body", err);
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message =
    body && typeof body === "object" && "message" in body
      ? (body as { message?: unknown }).message
      : undefined;

  if (typeof message !== "string" || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Message is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!client) {
    console.error(
      "Analyze: OPENAI_API_KEY is not configured. Returning demo analysis fallback.",
    );
    return new Response(JSON.stringify(createDemoAnalysis(message)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const prompt = `You are a kind, practical assistant that analyzes a short message before it is sent.\n\nReturn ONLY valid JSON (no extra text) with these keys: tone (string), confidenceScore (number 0-10), clarityScore (number 0-10), emotionalInterpretation (string), recipientLikelyPerception (string), improvedRewrite (string).\n\nMessage:\n${message.trim()}`;

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 500,
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
      console.error("Analyze: empty response from OpenAI", resp);
      return new Response(JSON.stringify({ error: "Analysis failed. Please try again." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    let analysis: unknown;
    try {
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.error("Analyze: failed to parse JSON from OpenAI response", { err, cleaned });
      return new Response(JSON.stringify({ error: "Analysis failed. Invalid response format." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAnalysisResult(analysis)) {
      console.error("Analyze: response JSON did not match schema", analysis);
      return new Response(JSON.stringify({ error: "Analysis failed. Invalid result content." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "Analyze route OpenAI request failed. Returning demo analysis fallback.",
      error,
    );

    return new Response(JSON.stringify(createDemoAnalysis(message)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
