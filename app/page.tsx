"use client";

import { useState } from "react";

type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  emotionalInterpretation: string;
  recipientLikelyPerception: string;
  improvedRewrite: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (isLoading) return;

    setResult(null);
    setError("");

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Analysis failed. Please try again.");
      }

      setResult(data);
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
              Before you send
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Before you hit send...
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Paste your message and find out how it actually sounds.
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
                  Result preview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                  {isLoading
                    ? "Analyzing your message..."
                    : result
                      ? "Analysis complete"
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
                  Working through your words to give you a quick sense of tone,
                  clarity, and how the recipient may feel.
                </p>
              ) : result ? (
                <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-5 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        Tone
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {result.tone}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        Confidence
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {result.confidenceScore}/10
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5 text-center">
                      <p className="text-sm font-semibold text-slate-500">
                        Clarity
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {result.clarityScore}/10
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Emotional interpretation
                      </p>
                      <p>{result.emotionalInterpretation}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Recipient likely perception
                      </p>
                      <p>{result.recipientLikelyPerception}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Improved rewrite suggestion
                      </p>
                      <p className="rounded-3xl bg-slate-100 p-4 text-slate-950">
                        {result.improvedRewrite}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Once you paste a message and tap Analyze, this card will show
                  how your writing sounds and where it might be stronger.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
