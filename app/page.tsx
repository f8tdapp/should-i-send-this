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
  const [showRewrite, setShowRewrite] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnalyze = async () => {
    if (isLoading) return;

    setResult(null);
    setError("");
    setRewriteCopied(false);
    setShowRewrite(false);

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
      setShowRewrite(false);
      setRewriteCopied(false);
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
      setError(
        "Copy did not work in this browser. You can still select the rewrite manually.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-slate-950 font-sans antialiased">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12 sm:px-8 sm:py-20">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
            should i send this?
          </p>
        </div>

        <div className="rounded-[1.75rem] bg-white/90 p-5 shadow-[0_32px_100px_-60px_rgba(15,23,42,0.34)] ring-1 ring-slate-950/5 backdrop-blur-xl sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2f6fed]">
              Honestly?
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-tight text-slate-950 sm:text-6xl">
              Before you hit send...
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600 sm:text-xl">
              You think this sounds chill. Let&apos;s check.
            </p>
          </div>

          <div className="mt-11 space-y-5 sm:mt-12 sm:space-y-6">
            <label htmlFor="message" className="sr-only">
              Message input
            </label>
            <textarea
              id="message"
              rows={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hey, just checking if you're upset with me..."
              className="w-full min-h-[260px] rounded-[1.5rem] border border-slate-200/80 bg-[#fffdf9] px-6 py-5 text-base leading-7 text-slate-900 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.22)] placeholder:text-slate-400 outline-none transition duration-300 ease-out focus:border-[#2f6fed]/40 focus:ring-4 focus:ring-[#2f6fed]/10"
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

          <section className="mt-12 rounded-[1.5rem] bg-[#f4f6ff] p-5 shadow-sm ring-1 ring-[#2f6fed]/10 sm:mt-14 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6fed]">
                  The read
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                  {isLoading
                    ? "Reading the room..."
                    : result
                      ? "The read is in"
                      : "Nothing analyzed yet"}
                </h2>
              </div>
            </div>

            <div
              className={`mt-6 space-y-6 transition-all duration-500 ease-out ${
                result ? "opacity-100 translate-y-0" : "opacity-40 translate-y-3"
              }`}
            >
              {isLoading ? (
                <p className="text-sm leading-6 text-slate-600">
                  Checking the tone, the subtext, and the part your recipient is
                  most likely to notice.
                </p>
              ) : result ? (
                <div className="space-y-7">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <div className="rounded-full bg-white/70 px-4 py-3 ring-1 ring-slate-950/5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Tone
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {result.tone}
                      </p>
                    </div>
                    <div className="rounded-full bg-white/70 px-4 py-3 ring-1 ring-slate-950/5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Confidence
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {result.confidenceScore}/10
                      </p>
                    </div>
                    <div className="rounded-full bg-white/70 px-4 py-3 ring-1 ring-slate-950/5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Clarity
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {result.clarityScore}/10
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[1.6rem] bg-[#fff4df] p-6 shadow-[0_24px_60px_-50px_rgba(164,106,5,0.55)] ring-1 ring-[#efbd5b]/35 sm:p-8">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b6508]">
                        The vibe
                      </p>
                      <p className="mt-4 max-w-2xl text-[1.7rem] font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-[2.45rem]">
                        {result.emotionalInterpretation}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] bg-white/75 p-5 text-base leading-7 text-slate-600 ring-1 ring-slate-950/5 sm:p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                        How this lands
                      </p>
                      <p className="mt-3 text-slate-700">
                        {result.recipientLikelyPerception}
                      </p>
                    </div>
                  </div>

                  {!showRewrite ? (
                    <div className="rounded-[1.5rem] border border-dashed border-[#2f6fed]/35 bg-white/70 p-5 text-center shadow-sm sm:p-7">
                      <p className="mx-auto max-w-md text-base font-medium leading-7 text-slate-700">
                        The damage report is in. Want the version with fewer
                        emotional shrapnel pieces?
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowRewrite(true)}
                        className="mt-5 inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-[#2f6fed] px-7 py-3 text-base font-semibold text-white shadow-[0_20px_45px_-30px_rgba(47,111,237,0.8)] outline-none transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#245bd1] hover:shadow-[0_24px_55px_-28px_rgba(47,111,237,0.95)] focus:ring-4 focus:ring-[#2f6fed]/20 sm:w-auto"
                      >
                        Fine. Fix my text.
                      </button>
                    </div>
                  ) : null}

                  <div
                    aria-hidden={!showRewrite}
                    className={`overflow-hidden transition-all duration-700 ease-out ${
                      showRewrite
                        ? "max-h-[520px] translate-y-0 opacity-100 blur-0"
                        : "max-h-0 translate-y-3 opacity-0 blur-sm"
                    }`}
                  >
                    <div className="rounded-[1.6rem] bg-slate-950 p-6 text-white shadow-[0_22px_70px_-40px_rgba(15,23,42,0.75)] sm:p-8">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                        Send this instead
                      </p>
                      <p className="mt-5 text-lg leading-8 text-slate-50 sm:text-xl sm:leading-9">
                        {result.improvedRewrite}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyRewrite}
                        className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm outline-none transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-100 focus:ring-4 focus:ring-white/20"
                      >
                        {rewriteCopied ? "Copied" : "Copy Rewrite"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Once you paste a message and tap Analyze, this card will show
                  the read first. The fix stays locked until you ask for it.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
