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

type SignaturePhrase = {
  text: string;
  keywords: string[];
};

const backgroundBubbles = [
  {
    text: "oh no",
    className: "left-[3%] top-[10%] rotate-[-8deg] text-xl lg:text-2xl",
  },
  {
    text: "why did I send that",
    className:
      "right-[3%] top-[8%] max-w-[18rem] rotate-[7deg] text-xl lg:text-2xl [animation-delay:200ms]",
  },
  {
    text: "too much?",
    className:
      "left-[8%] top-[28%] rotate-[5deg] text-lg lg:text-xl [animation-delay:500ms]",
  },
  {
    text: "what are they going to think?",
    className:
      "right-[5%] top-[28%] max-w-[19rem] rotate-[-6deg] text-lg lg:text-xl [animation-delay:700ms]",
  },
  {
    text: "did I sound needy?",
    className:
      "left-[2%] bottom-[33%] max-w-[17rem] rotate-[8deg] text-xl lg:text-2xl [animation-delay:1000ms]",
  },
  {
    text: "please don't read that yet",
    className:
      "right-[2%] bottom-[34%] max-w-[18rem] rotate-[-5deg] text-lg lg:text-xl [animation-delay:300ms]",
  },
  {
    text: "do I double text?",
    className:
      "left-[10%] bottom-[16%] max-w-[16rem] rotate-[-4deg] text-lg lg:text-xl [animation-delay:700ms]",
  },
  {
    text: "they're typing...",
    className:
      "right-[11%] bottom-[15%] rotate-[6deg] text-lg lg:text-xl [animation-delay:1000ms]",
  },
  {
    text: "should I delete it?",
    className:
      "left-[20%] top-[4%] max-w-[17rem] rotate-[4deg] text-lg lg:text-xl [animation-delay:1200ms]",
  },
  {
    text: "that sounded insane",
    className:
      "right-[22%] top-[3%] max-w-[17rem] rotate-[-4deg] text-lg lg:text-xl [animation-delay:850ms]",
  },
  {
    text: "I should not have said that",
    className:
      "left-[21%] bottom-[3%] max-w-[19rem] rotate-[5deg] text-lg lg:text-xl [animation-delay:150ms]",
  },
  {
    text: "left on read",
    className:
      "right-[27%] bottom-[3%] rotate-[-7deg] text-xl lg:text-2xl [animation-delay:450ms]",
  },
  {
    text: "I made it worse",
    className:
      "left-[1%] top-[53%] max-w-[15rem] rotate-[-6deg] text-lg lg:text-xl [animation-delay:1300ms]",
  },
  {
    text: "send help",
    className:
      "right-[1%] top-[52%] rotate-[8deg] text-xl lg:text-2xl [animation-delay:1150ms]",
  },
  {
    text: "not the lol",
    className:
      "left-[25%] top-[18%] hidden max-w-[14rem] rotate-[-3deg] text-lg xl:block [animation-delay:650ms]",
  },
  {
    text: "this sounded better in my head",
    className:
      "right-[19%] top-[19%] hidden max-w-[20rem] rotate-[3deg] text-lg xl:block [animation-delay:950ms]",
  },
  {
    text: "was that passive aggressive?",
    className:
      "left-[24%] bottom-[20%] hidden max-w-[20rem] rotate-[3deg] text-lg xl:block [animation-delay:1750ms]",
  },
];

const loadingMessages = [
  "Reading the emotional damage...",
  "Checking for hidden panic...",
  "Consulting the group chat...",
  "Measuring the 'lol' risk...",
];

const signaturePhrases: SignaturePhrase[] = [
  {
    text: 'You are absolutely not "lol"-ing right now.',
    keywords: ["lol", "haha", "lmao"],
  },
  {
    text: "This has the emotional warmth of a folding chair.",
    keywords: ["k.", "k", "ok.", "okay."],
  },
  {
    text: "This text was drafted by anxiety and approved by panic.",
    keywords: ["mad at me", "ignoring me", "are we okay", "checking"],
  },
  {
    text: 'You do not, in fact, mean "whatever."',
    keywords: ["whatever"],
  },
  {
    text: "This is trying to sound casual while wearing a tiny stress suit.",
    keywords: ["just checking", "no worries", "all good"],
  },
  {
    text: "The message says chill. The subtext is doing push-ups.",
    keywords: ["chill", "fine", "lol"],
  },
  {
    text: "This is a soft launch for a much bigger feeling.",
    keywords: ["maybe", "wondering", "just wanted"],
  },
  {
    text: "You are asking a question, but emotionally you already have a spreadsheet.",
    keywords: ["why", "what did i do", "are you"],
  },
  {
    text: "This is not a text. This is a temperature check with Wi-Fi.",
    keywords: ["checking", "check in", "are we"],
  },
  {
    text: "This sounds like you want reassurance but packed it in bubble wrap.",
    keywords: ["just", "maybe", "if you want"],
  },
  {
    text: "This is emotionally expensive for a message this short.",
    keywords: ["k", "fine", "sure", "whatever"],
  },
  {
    text: "This is passive aggression in a clean outfit.",
    keywords: ["per my last email", "as stated", "as mentioned"],
  },
  {
    text: "This message is smiling with its teeth clenched.",
    keywords: ["no worries", "all good", "fine"],
  },
  {
    text: "This sounds like you are one follow-up away from becoming a calendar invite.",
    keywords: ["follow up", "following up", "per my last email"],
  },
  {
    text: "This is technically polite and spiritually furious.",
    keywords: ["per my last email", "as discussed", "regards"],
  },
  {
    text: "This is trying very hard to be the bigger person and is sweating.",
    keywords: ["i understand", "no worries", "it's fine"],
  },
  {
    text: "This has the energy of someone typing, deleting, and typing again.",
    keywords: ["maybe", "just", "sorry", "wondering"],
  },
  {
    text: "This is a tiny message carrying a full emotional suitcase.",
    keywords: ["k", "ok", "fine", "sure"],
  },
  {
    text: "This sounds like a boundary trying to introduce itself.",
    keywords: ["can't", "need", "stop", "not okay"],
  },
  {
    text: "This is the text version of pretending not to care while absolutely caring.",
    keywords: ["whatever", "do what you want", "it's cool"],
  },
  {
    text: "This is not rude yet, but it is looking at rude from across the room.",
    keywords: ["fine", "sure", "okay then"],
  },
  {
    text: "This is frustration with no forwarding address.",
    keywords: ["sucks", "hate", "annoyed", "ridiculous"],
  },
  {
    text: "This message has a point, but it is hiding behind the attitude.",
    keywords: ["whatever", "done", "ridiculous"],
  },
  {
    text: "This is a valid feeling in a slightly dangerous outfit.",
    keywords: ["angry", "mad", "sucks", "hate"],
  },
  {
    text: "This is giving less 'quick question' and more 'please answer before I spiral.'",
    keywords: ["quick question", "just checking", "are you ignoring"],
  },
  {
    text: "This is overexplaining because silence feels illegal right now.",
    keywords: ["because", "i just mean", "what i meant"],
  },
  {
    text: "This message brought receipts, but nobody asked for the whole binder.",
    keywords: ["because", "also", "another thing", "to be clear"],
  },
  {
    text: "This is avoidance wearing a helpful little hat.",
    keywords: ["maybe later", "we'll see", "not sure"],
  },
  {
    text: "This is mixed signals with decent punctuation.",
    keywords: ["miss you", "but", "i don't know"],
  },
  {
    text: "This is trying to be low-maintenance while needing maintenance immediately.",
    keywords: ["no pressure", "whenever", "if you want"],
  },
  {
    text: "This is a confrontation wearing slippers.",
    keywords: ["can we talk", "we need to talk", "not okay"],
  },
  {
    text: "This is a little too polished for someone who is not mad.",
    keywords: ["regards", "best", "per my last email"],
  },
  {
    text: "This is a cry for clarity pretending to be a casual ping.",
    keywords: ["hey", "just checking", "are we good"],
  },
  {
    text: "This message is doing emotional gymnastics to avoid saying the simple thing.",
    keywords: ["i guess", "maybe", "sort of"],
  },
  {
    text: "This is neediness trying to pass as logistics.",
    keywords: ["when can", "haven't heard", "reply"],
  },
  {
    text: "This is cold enough to make the other person start rereading the chat history.",
    keywords: ["k", "ok", "sure"],
  },
  {
    text: "This is honest, but it arrives holding a tiny hammer.",
    keywords: ["truth", "honestly", "sucks", "ridiculous"],
  },
  {
    text: "This sounds less chill than you think it does.",
    keywords: ["chill", "lol", "whatever", "no worries"],
  },
  {
    text: "This is a reasonable request with a dramatic little shadow.",
    keywords: ["can you", "could you", "please"],
  },
  {
    text: "This message is not wrong. It is just arriving without a seatbelt.",
    keywords: ["angry", "mad", "done", "hate"],
  },
];

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

function getAnalysisText(result: AnalysisResult, message: string) {
  return [
    message,
    result.tone,
    result.emotionalInterpretation,
    result.recipientLikelyPerception,
    result.improvedRewrite,
  ]
    .join(" ")
    .toLowerCase();
}

function getSignaturePhrase(result: AnalysisResult, message: string) {
  const analysisText = getAnalysisText(result, message);

  return signaturePhrases.find((phrase) =>
    phrase.keywords.some((keyword) => analysisText.includes(keyword)),
  )?.text;
}

function getReadSeverity(result: AnalysisResult, message: string) {
  const analysisText = getAnalysisText(result, message);
  const lowScores = result.confidenceScore <= 5 || result.clarityScore <= 5;

  if (analysisText.includes("lol") && /panic|anxiety|spiral|ignoring/.test(analysisText)) {
    return "One LOL Away From A Breakdown";
  }

  if (/passive|per my last email|whatever|fine|sure|k\./.test(analysisText)) {
    return "Passive Aggressive Lite";
  }

  if (/anxious|anxiety|panic|spiral|reassurance|needy/.test(analysisText)) {
    return "Drafted By Anxiety";
  }

  if (/angry|frustrated|furious|mad|sucks|hate|loaded/.test(analysisText)) {
    return "Emotionally Loaded";
  }

  if (/expensive|overexplaining|defensive|cold/.test(analysisText) || lowScores) {
    return "Emotionally Expensive";
  }

  if (result.confidenceScore <= 7 || result.clarityScore <= 7) {
    return "Slightly Concerning";
  }

  return "Mostly Fine";
}

function getSubtext(result: AnalysisResult, message: string) {
  const signaturePhrase = getSignaturePhrase(result, message);

  if (signaturePhrase) return signaturePhrase;

  const analysisText = getAnalysisText(result, message);

  if (/sorry|apolog/.test(analysisText)) {
    return "You are trying to repair something without making the apology a whole production.";
  }

  if (/work|job|email|manager|boss/.test(analysisText)) {
    return "You want to stay professional, but the inside voice is already pacing.";
  }

  if (/date|dating|relationship|miss you/.test(analysisText)) {
    return "You want connection, but you are trying not to look like you want connection.";
  }

  return "The message is saying one thing, but the emotional subtitles are doing extra work.";
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

  const socialMirror = result
    ? {
        severity: getReadSeverity(result, message),
        subtext: getSubtext(result, message),
      }
    : null;
  const loadingMessage = loadingMessages[message.length % loadingMessages.length];

  return (
    // This full-screen wrapper is the visible canvas behind the app card.
    // Body/global background changes were previously masked by this layer.
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-slate-950 font-sans antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(92,78,176,0.22)_42%,rgba(255,123,189,0.18)_100%)]" />
        <div className="absolute inset-x-[-12%] top-[-18%] h-72 rotate-[-3deg] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.32),rgba(255,255,255,0)_68%)] blur-2xl sm:h-96" />
        <div className="absolute inset-x-[-10%] bottom-[-22%] h-80 rotate-[4deg] bg-[radial-gradient(ellipse_at_center,rgba(72,48,150,0.24),rgba(72,48,150,0)_70%)] blur-3xl sm:h-[28rem]" />

        {backgroundBubbles.map((bubble) => (
          <span
            key={bubble.text}
            className={`chat-wallpaper-bubble absolute hidden rounded-[1.8rem] border border-white/75 bg-white/62 px-6 py-3.5 font-semibold leading-tight text-slate-900/82 shadow-[0_24px_80px_-42px_rgba(18,24,70,0.78),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl md:block lg:px-7 lg:py-4 ${bubble.className}`}
          >
            {bubble.text}
          </span>
        ))}
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-12 sm:px-8 sm:py-20">
        <div className="mb-6 text-center sm:text-left">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/70">
            should i send this?
          </p>
        </div>

        <div className="app-card-enter rounded-[1.75rem] bg-[#fffefa]/98 p-5 shadow-[0_34px_110px_-58px_rgba(45,64,116,0.46),0_0_70px_-34px_rgba(132,112,255,0.34)] ring-1 ring-[#7185bd]/18 backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_38px_120px_-58px_rgba(45,64,116,0.52),0_0_82px_-34px_rgba(132,112,255,0.42)] sm:p-10">
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
                  {loadingMessage}
                </span>
              ) : (
                "Analyze"
              )}
            </button>
          </div>

          <section className="mt-12 rounded-[1.5rem] bg-[#f6f3eb] p-5 shadow-sm ring-1 ring-slate-950/[0.04] sm:mt-14 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6fed]">
                  The read
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                  {isLoading
                    ? "Reading the emotional damage..."
                    : result
                      ? "The read is in"
                      : "Your future regret goes here."}
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
                  Consulting the group chat, scanning the subtext, and checking
                  whether that punctuation is doing too much.
                </p>
              ) : result ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    {socialMirror ? (
                      <div className="inline-flex max-w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-[#fff2d8] shadow-[0_18px_45px_-34px_rgba(15,23,42,0.8)]">
                        <span className="truncate">
                          Read Severity: {socialMirror.severity}
                        </span>
                      </div>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl bg-[#fffdf8]/55 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                          Tone
                        </p>
                        <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                          {result.tone}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#fffdf8]/55 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                          Confidence
                        </p>
                        <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                          {result.confidenceScore}/10
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#fffdf8]/55 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                          Clarity
                        </p>
                        <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                          {result.clarityScore}/10
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[1.7rem] bg-[#fff2d8] p-6 shadow-[0_28px_70px_-55px_rgba(164,106,5,0.65)] ring-1 ring-[#efbd5b]/35 sm:p-7">
                      <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#9b6508]">
                        The vibe
                      </p>
                      <p className="mt-4 max-w-[42rem] text-[1.42rem] font-semibold leading-[1.2] tracking-tight text-slate-950 sm:text-[1.9rem] sm:leading-[1.16]">
                        {result.emotionalInterpretation}
                      </p>
                    </div>
                    {socialMirror ? (
                      <div className="rounded-[1.55rem] bg-[#fffdf8]/88 p-6 shadow-[0_22px_60px_-55px_rgba(15,23,42,0.4)] ring-1 ring-slate-950/[0.04] sm:p-7">
                        <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#2f6fed]">
                          The Subtext
                        </p>
                        <p className="mt-4 max-w-[38rem] text-[1.28rem] font-medium leading-[1.42] tracking-tight text-slate-900 sm:text-[1.58rem] sm:leading-[1.34]">
                          {socialMirror.subtext}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-[1.55rem] bg-[#e9f1f4] p-6 shadow-[0_22px_60px_-55px_rgba(15,23,42,0.45)] ring-1 ring-[#8fb2c3]/20 sm:p-7">
                      <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#4e7282]">
                        How this lands
                      </p>
                      <p className="mt-4 max-w-[40rem] text-[1.12rem] font-medium leading-[1.58] text-slate-800 sm:text-[1.28rem] sm:leading-[1.55]">
                        {result.recipientLikelyPerception}
                      </p>
                    </div>
                  </div>

                  {!showRewrite ? (
                    <div className="rounded-[1.5rem] border border-dashed border-[#2f6fed]/30 bg-[#fffdf8]/75 p-6 text-center shadow-sm sm:p-7">
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
                  Paste the text you&apos;re about to overthink for six hours.
                  The read appears here. The fix stays locked until you ask for
                  it.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
