type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  emotionalInterpretation: string;
  recipientLikelyPerception: string;
  improvedRewrite: string;
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "tone",
    "confidenceScore",
    "clarityScore",
    "emotionalInterpretation",
    "recipientLikelyPerception",
    "improvedRewrite",
  ],
  properties: {
    tone: { type: "string" },
    confidenceScore: { type: "number" },
    clarityScore: { type: "number" },
    emotionalInterpretation: { type: "string" },
    recipientLikelyPerception: { type: "string" },
    improvedRewrite: { type: "string" },
  },
} as const;

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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message =
    body && typeof body === "object" && "message" in body
      ? (body as { message?: unknown }).message
      : undefined;

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Analyze a draft message before it is sent. Be direct, practical, and kind. Return only the requested JSON.",
          },
          {
            role: "user",
            content: `Message to analyze:\n\n${message.trim()}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "message_analysis",
            strict: true,
            schema: analysisSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API request failed", await response.text());
      return Response.json(
        { error: "Analysis failed. Please try again." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return Response.json(
        { error: "Analysis failed. Please try again." },
        { status: 502 },
      );
    }

    const analysis: unknown = JSON.parse(content);

    if (!isAnalysisResult(analysis)) {
      return Response.json(
        { error: "Analysis failed. Please try again." },
        { status: 502 },
      );
    }

    return Response.json(analysis);
  } catch (error) {
    console.error("Analyze route failed", error);
    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
