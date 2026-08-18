"use client";

import { useState } from "react";

type RiskLevel = "low" | "medium" | "high";

type EmbeddedAnalysis = {
  perceptionGap: string;
  intentVsImpact: {
    youMeant: string;
    theyMayHear: string;
  };
  recipientLikelyPerception: string;
  improvedRewrite: string;
  classification: {
    communicationRisk: RiskLevel;
    rewriteStrategy: string;
  };
  communicationFramework: {
    communicationClarity: string;
    emotionalPressure: string;
  };
};

const exampleMessage =
  "As I have already explained, we cannot classify this repair as urgent. You will be contacted when someone is available.";

const riskStyles: Record<RiskLevel, { label: string; badge: string; dot: string }> = {
  low: {
    label: "Looks clear",
    badge: "bg-[#E6F3EA] text-[#245C38] ring-[#B9D9C3]",
    dot: "bg-[#3C8A57]",
  },
  medium: {
    label: "Perception Gap",
    badge: "bg-[#FFF2D7] text-[#7A4B00] ring-[#E9CD91]",
    dot: "bg-[#D48A13]",
  },
  high: {
    label: "High perception risk",
    badge: "bg-[#FCE5E4] text-[#8A2925] ring-[#E8B8B5]",
    dot: "bg-[#C44B45]",
  },
};

function isEmbeddedAnalysis(value: unknown): value is EmbeddedAnalysis {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<EmbeddedAnalysis>;
  return Boolean(
    typeof result.perceptionGap === "string" &&
      result.intentVsImpact &&
      typeof result.intentVsImpact.youMeant === "string" &&
      typeof result.intentVsImpact.theyMayHear === "string" &&
      result.classification &&
      (result.classification.communicationRisk === "low" ||
        result.classification.communicationRisk === "medium" ||
        result.classification.communicationRisk === "high") &&
      result.communicationFramework &&
      typeof result.communicationFramework.communicationClarity === "string" &&
      typeof result.communicationFramework.emotionalPressure === "string" &&
      typeof result.recipientLikelyPerception === "string" &&
      typeof result.improvedRewrite === "string",
  );
}

export default function EmbeddedDemo() {
  const [message, setMessage] = useState(exampleMessage);
  const [analysis, setAnalysis] = useState<EmbeddedAnalysis | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const [error, setError] = useState("");

  const risk = analysis?.classification.communicationRisk ?? "medium";
  const riskStyle = riskStyles[risk];
  const canCheck = message.trim().length > 0 && message.length <= 750 && !isChecking;

  async function checkMessage() {
    if (!canCheck) return;

    setIsChecking(true);
    setError("");
    setAnalysis(null);
    setIsPanelOpen(false);
    setShowAlternative(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          relationshipContext: "tenant or resident",
          desiredTone: "clear, respectful and appropriately firm",
          messageGoal: "communicate the decision without creating an avoidable complaint",
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const responseError =
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "The message could not be checked. Please try again.";
        throw new Error(responseError);
      }

      if (!isEmbeddedAnalysis(data)) {
        throw new Error("The analysis returned in an unexpected format.");
      }

      setAnalysis(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The message could not be checked. Please try again.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  function useAlternative() {
    if (!analysis?.improvedRewrite) return;
    setMessage(analysis.improvedRewrite);
    setAnalysis(null);
    setIsPanelOpen(false);
    setShowAlternative(false);
  }

  return (
    <div className="mt-7 grid overflow-hidden rounded-[1.65rem] border border-white/12 bg-[#DDE3E7] shadow-[0_34px_100px_-50px_rgba(0,0,0,0.85)] lg:grid-cols-[minmax(0,1fr)_23rem]">
      <section className="min-w-0 bg-[#F3F5F6]">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#CBD3D8] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3157B8] text-xs font-black text-white">
              M
            </span>
            <div>
              <p className="text-sm font-bold text-[#172033]">New message</p>
              <p className="text-[0.68rem] font-medium text-[#64748B]">
                Familiar workflow simulation
              </p>
            </div>
          </div>
          <span className="hidden rounded-full bg-[#EEF1F3] px-3 py-1 text-[0.68rem] font-semibold text-[#596876] sm:inline-flex">
            Draft saved
          </span>
        </div>

        <div className="px-4 py-4 sm:px-7 sm:py-6">
          <div className="space-y-2 border-b border-[#D6DDE1] pb-4 text-sm">
            <div className="grid grid-cols-[3rem_1fr] items-center gap-2">
              <span className="font-semibold text-[#64748B]">To</span>
              <span className="rounded-md bg-[#E9EDF0] px-2.5 py-1.5 font-semibold text-[#334155]">
                Resident
              </span>
            </div>
            <div className="grid grid-cols-[3rem_1fr] items-center gap-2">
              <span className="font-semibold text-[#64748B]">Subject</span>
              <span className="font-semibold text-[#334155]">Repair update</span>
            </div>
          </div>

          <label htmlFor="embedded-message" className="sr-only">
            Message draft
          </label>
          <textarea
            id="embedded-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setAnalysis(null);
              setIsPanelOpen(false);
              setShowAlternative(false);
            }}
            className="mt-4 min-h-[18rem] w-full resize-none bg-transparent text-[0.98rem] font-medium leading-7 text-[#172033] outline-none placeholder:text-[#8A98A4] sm:min-h-[21rem]"
            placeholder="Write your message as normal..."
            maxLength={750}
          />

          {error ? (
            <p role="alert" className="mb-3 rounded-xl bg-[#FCE5E4] px-3 py-2 text-sm font-semibold text-[#8A2925]">
              {error}
            </p>
          ) : null}

          {analysis ? (
            <button
              type="button"
              onClick={() => setIsPanelOpen(true)}
              className={`mb-3 inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition hover:-translate-y-0.5 ${riskStyle.badge}`}
            >
              <span className={`h-2 w-2 rounded-full ${riskStyle.dot}`} />
              {riskStyle.label}
              <span aria-hidden="true">→</span>
            </button>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-[#D6DDE1] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#3157B8] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#294A9C]"
            >
              Send
            </button>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-semibold tabular-nums text-[#71808C]">
                {message.length}/750
              </span>
              <button
                type="button"
                onClick={checkMessage}
                disabled={!canCheck}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#172033] px-4 text-sm font-bold text-white transition hover:bg-[#263247] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3157B8]/25 disabled:cursor-not-allowed disabled:bg-[#8995A0]"
              >
                {isChecking ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Checking…
                  </>
                ) : (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-[0.64rem] font-black text-[#172033]">
                      BL
                    </span>
                    Check how this lands
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="border-t border-[#C6D0D6] bg-[#E5EAED] p-4 lg:border-l lg:border-t-0 sm:p-5" aria-live="polite">
        {!analysis ? (
          <div className="flex h-full min-h-[20rem] flex-col justify-between rounded-[1.25rem] border border-[#C5D0D6] bg-[#F8FAF9] p-5 shadow-sm">
            <div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#172033] text-[0.68rem] font-black text-white">
                BL
              </span>
              <h2 className="mt-5 text-xl font-bold tracking-[-0.025em] text-[#172033]">
                BetweenLines is quiet by default.
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-[#596876]">
                Write normally. When a message matters, request a private check.
                No prompt and no separate dashboard.
              </p>
            </div>
            <div className="mt-8 space-y-3 border-t border-[#D8E0E4] pt-4 text-xs font-semibold text-[#64748B]">
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3157B8]" />
                Checks interpretation, not grammar
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3157B8]" />
                Keeps the sender in control
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3157B8]" />
                Does not store a message history
              </p>
            </div>
          </div>
        ) : !isPanelOpen ? (
          <div className="flex h-full min-h-[20rem] flex-col justify-center rounded-[1.25rem] border border-[#C5D0D6] bg-[#F8FAF9] p-5 text-center shadow-sm">
            <span className={`mx-auto h-3 w-3 rounded-full ${riskStyle.dot}`} />
            <h2 className="mt-4 text-xl font-bold tracking-[-0.025em] text-[#172033]">
              {riskStyle.label}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#596876]">
              The full insight stays closed until the sender chooses to view it.
            </p>
            <button
              type="button"
              onClick={() => setIsPanelOpen(true)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#172033] px-5 text-sm font-bold text-white transition hover:bg-[#263247]"
            >
              View Perception Gap
            </button>
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-[#C5D0D6] bg-[#F8FAF9] p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[0.68rem] font-bold ring-1 ${riskStyle.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${riskStyle.dot}`} />
                  {riskStyle.label}
                </span>
                <h2 className="mt-3 text-lg font-bold tracking-[-0.02em] text-[#172033]">
                  How this could land
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8EDF0] text-lg text-[#596876] transition hover:bg-[#D8E0E4] hover:text-[#172033]"
                aria-label="Close insight panel"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-sm font-semibold leading-6 text-[#334155]">
              {analysis.perceptionGap}
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white p-3.5 ring-1 ring-[#D7DFE3]">
                <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-[#64748B]">
                  You appear to mean
                </p>
                <p className="mt-2 text-sm font-semibold leading-5 text-[#172033]">
                  {analysis.intentVsImpact.youMeant}
                </p>
              </div>
              <div className="rounded-xl bg-white p-3.5 ring-1 ring-[#D7DFE3]">
                <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-[#64748B]">
                  They may hear
                </p>
                <p className="mt-2 text-sm font-semibold leading-5 text-[#172033]">
                  {analysis.intentVsImpact.theyMayHear}
                </p>
              </div>
              <div className="rounded-xl bg-[#E9EEF6] p-3.5 ring-1 ring-[#CED8E8]">
                <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-[#526783]">
                  Before sending
                </p>
                <p className="mt-2 text-sm font-semibold leading-5 text-[#26364A]">
                  {analysis.classification.rewriteStrategy}
                </p>
              </div>
            </div>

            {showAlternative ? (
              <div className="mt-4 rounded-xl bg-[#172033] p-4 text-white">
                <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-white/55">
                  One possible alternative
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-white/92">
                  {analysis.improvedRewrite}
                </p>
                <button
                  type="button"
                  onClick={useAlternative}
                  className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-bold text-[#172033] transition hover:bg-[#E8EEF0]"
                >
                  Use this version
                </button>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-[#C8D1D6] bg-white px-3 text-xs font-bold text-[#334155] transition hover:bg-[#EEF2F4]"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => setShowAlternative((visible) => !visible)}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-[#172033] px-3 text-xs font-bold text-white transition hover:bg-[#263247]"
              >
                {showAlternative ? "Hide alternative" : "Show one alternative"}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
