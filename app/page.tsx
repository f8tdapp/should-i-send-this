"use client";

import { useRef, useState } from "react";

type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  emotionalInterpretation: string;
  recipientLikelyPerception: string;
  improvedRewrite: string;
};

const defaultAnalysisResult: AnalysisResult = {
  tone: "Unknown",
  confidenceScore: 0,
  clarityScore: 0,
  emotionalInterpretation: "No emotional interpretation was provided.",
  recipientLikelyPerception: "No recipient perception was provided.",
  improvedRewrite: "No rewrite suggestion was provided.",
};

function normalizeAnalysisResult(value: unknown): AnalysisResult {
  if (!value || typeof value !== "object") return defaultAnalysisResult;

  const result = value as Record<string, unknown>;

  return {
    tone:
      typeof result.tone === "string"
        ? result.tone
        : defaultAnalysisResult.tone,
    confidenceScore:
      typeof result.confidenceScore === "number"
        ? result.confidenceScore
        : defaultAnalysisResult.confidenceScore,
    clarityScore:
      typeof result.clarityScore === "number"
        ? result.clarityScore
        : defaultAnalysisResult.clarityScore,
    emotionalInterpretation:
      typeof result.emotionalInterpretation === "string"
        ? result.emotionalInterpretation
        : defaultAnalysisResult.emotionalInterpretation,
    recipientLikelyPerception:
      typeof result.recipientLikelyPerception === "string"
        ? result.recipientLikelyPerception
        : defaultAnalysisResult.recipientLikelyPerception,
    improvedRewrite:
      typeof result.improvedRewrite === "string"
        ? result.improvedRewrite
        : defaultAnalysisResult.improvedRewrite,
  };
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [rewriteCopied, setRewriteCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnalyze = async () => {
    if (isLoading) return;

    setResult(null);
    setError("");
    setRewriteCopied(false);

    if (!message.trim()) {
      setError("Paste a message before analyzing.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const rawText = await response.text();
      const data = rawText ? JSON.parse(rawText) : null;

      console.log("Analyze API response received by frontend:", data);

      if (!response.ok) {
        throw new Error(data?.error || "Analysis failed. Please try again.");
      }

      setResult(normalizeAnalysisResult(data));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRewrite = async () => {
    if (!result?.improvedRewrite) return;

    try {
      await navigator.clipboard.writeText(result.improvedRewrite);
      setRewriteCopied(true);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setRewriteCopied(false);
      }, 1600);
    } catch {
      setError("Copy did not work in this browser. You can still select the rewrite manually.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans antialiased">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20 sm:px-8">
        <div className="mb-8 text-center sm:text-left">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            should i send this?
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_100px_-50px_rgb(15,23,42,0.18)] backdrop-blur-xl sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              Your brutally honest friend reading your texts
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Before you hit send...
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Find out what your message actually sounds like before it leaves
              your hands.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <label htmlFor="message" className="sr-only">
              Message input
            </label>
            <textarea
              id="message"
              rows={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hey, just checking if you're upset with me..."
              className="w-full min-h-[260px] rounded-[2rem] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-900 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.22)] placeholder:text-slate-400 outline-none transition duration-300 ease-out focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
            />

            {error ? (
              <p className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="inline-flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:shadow-none"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing...
                </span>
              ) : (
                "Analyze"
              )}
            </button>
          </div>

          <section className="mt-14 rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Read before sending
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                  {isLoading
                    ? "Reading the room..."
                    : result
                      ? "The read is in"
                      : "Nothing analyzed yet"}
                </h2>
              </div>
            </div>

            <div
              className={`mt-5 space-y-5 transition-all duration-500 ease-out ${
                result ? "opacity-100 translate-y-0" : "opacity-40 translate-y-3"
              }`}
            >
              {isLoading ? (
                <p className="text-sm leading-6 text-slate-600">
                  Checking the tone, the subtext, and the part your recipient is
                  most likely to notice.
                </p>
              ) : result ? (
                <div className="space-y-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                  <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-[0_18px_50px_-35px_rgba(15,23,42,0.5)] sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                      Send this instead
                    </p>
                    <p className="mt-4 text-base leading-7 text-slate-50 sm:text-lg sm:leading-8">
                      {result.improvedRewrite}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyRewrite}
                      className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-100"
                    >
                      {rewriteCopied ? "Copied" : "Copy Rewrite"}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Tone
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.tone}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Confidence
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.confidenceScore}/10
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Clarity
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {result.clarityScore}/10
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm leading-6 text-slate-600 md:grid-cols-2">
                    <div className="border-t border-slate-200 pt-4">
                      <p className="font-semibold text-slate-900">
                        What it gives off
                      </p>
                      <p className="mt-2">{result.emotionalInterpretation}</p>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <p className="font-semibold text-slate-900">
                        How they may read it
                      </p>
                      <p className="mt-2">{result.recipientLikelyPerception}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Once you paste a message and tap Analyze, this card will show
                  the sendable version first, then the honest read behind it.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
