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
  name: string;
  phrases: string[];
  messagePatterns: RegExp[];
};

type SocialMirror = {
  severity: string;
  subtext: string;
};

const MESSAGE_CHARACTER_LIMIT = 750;

const backgroundBubbles = [
  {
    text: "oh no",
    className: "left-[1%] top-[8%] rotate-[-8deg] text-base lg:text-lg",
  },
  {
    text: "why did I send that",
    className:
      "right-[1%] top-[7%] max-w-[15rem] rotate-[7deg] text-base lg:text-lg [animation-delay:200ms]",
  },
  {
    text: "too much?",
    className:
      "left-[2%] top-[31%] rotate-[5deg] text-sm lg:text-base [animation-delay:500ms]",
  },
  {
    text: "what are they going to think?",
    className:
      "right-[1%] top-[31%] max-w-[15rem] rotate-[-6deg] text-sm lg:text-base [animation-delay:700ms]",
  },
  {
    text: "did I sound needy?",
    className:
      "left-[0%] bottom-[31%] max-w-[14rem] rotate-[8deg] text-base lg:text-lg [animation-delay:1000ms]",
  },
  {
    text: "please don't read that yet",
    className:
      "right-[0%] bottom-[31%] max-w-[15rem] rotate-[-5deg] text-sm lg:text-base [animation-delay:300ms]",
  },
  {
    text: "do I double text?",
    className:
      "left-[5%] bottom-[13%] max-w-[13rem] rotate-[-4deg] text-sm lg:text-base [animation-delay:700ms]",
  },
  {
    text: "they're typing...",
    className:
      "right-[6%] bottom-[13%] rotate-[6deg] text-sm lg:text-base [animation-delay:1000ms]",
  },
  {
    text: "should I delete it?",
    className:
      "left-[16%] top-[2%] max-w-[14rem] rotate-[4deg] text-sm lg:text-base [animation-delay:1200ms]",
  },
  {
    text: "that sounded insane",
    className:
      "right-[17%] top-[2%] max-w-[14rem] rotate-[-4deg] text-sm lg:text-base [animation-delay:850ms]",
  },
  {
    text: "I should not have said that",
    className:
      "left-[16%] bottom-[2%] max-w-[15rem] rotate-[5deg] text-sm lg:text-base [animation-delay:150ms]",
  },
  {
    text: "left on read",
    className:
      "right-[20%] bottom-[2%] rotate-[-7deg] text-base lg:text-lg [animation-delay:450ms]",
  },
  {
    text: "I made it worse",
    className:
      "left-[0%] top-[58%] max-w-[12rem] rotate-[-6deg] text-sm lg:text-base [animation-delay:1300ms]",
  },
  {
    text: "send help",
    className:
      "right-[0%] top-[58%] rotate-[8deg] text-base lg:text-lg [animation-delay:1150ms]",
  },
  {
    text: "not the lol",
    className:
      "left-[18%] top-[17%] hidden max-w-[12rem] rotate-[-3deg] text-sm xl:block [animation-delay:650ms]",
  },
  {
    text: "this sounded better in my head",
    className:
      "right-[14%] top-[17%] hidden max-w-[16rem] rotate-[3deg] text-sm xl:block [animation-delay:950ms]",
  },
  {
    text: "was that passive aggressive?",
    className:
      "left-[16%] bottom-[17%] hidden max-w-[16rem] rotate-[3deg] text-sm xl:block [animation-delay:1750ms]",
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
    name: "fake-casual",
    phrases: [
      "You're trying to sound casual, but the anxiety is holding a microphone.",
      "The joke is doing unpaid emotional labor.",
      "That 'lol' is not hiding as much as you think.",
      "The message says chill. The subtext has tabs open.",
      "This is breezy in the way a paper bag is breezy in a storm.",
    ],
    messagePatterns: [
      /\b(lol|haha|lmao)\b/i,
      /\b(no worries|all good|it's fine|its fine)\b/i,
      /\b(just checking|quick question)\b/i,
    ],
  },
  {
    name: "cold-short",
    phrases: [
      "This has the emotional warmth of a folding chair.",
      "This is technically a reply and emotionally a locked door.",
      "Tiny message. Very large silence.",
      "This is cold enough to make them reread the last five texts.",
    ],
    messagePatterns: [/^\s*(k|ok|okay|sure)\.?\s*$/i],
  },
  {
    name: "anxious",
    phrases: [
      "You're asking for clarity, but the panic is sitting in the passenger seat.",
      "This reads like you typed it, deleted it twice, then sent the brave version.",
      "You're trying to check in without admitting you've already spiraled.",
      "This text was drafted by anxiety and approved by panic.",
      "You can almost hear the overthinking.",
    ],
    messagePatterns: [
      /\b(mad at me|upset with me|ignoring me|are we okay|are we good)\b/i,
      /\b(where were you|what are you doing|haven't heard|reply)\b/i,
      /\b(checking|check in|just wanted)\b/i,
    ],
  },
  {
    name: "dismissive",
    phrases: [
      "You're saying one word, but sending a whole courtroom transcript.",
      "You do not, in fact, mean 'whatever.'",
      "The sentence is short. The resentment has luggage.",
      "This is pretending not to care while absolutely caring.",
      "Polite wording. Violent undertones.",
    ],
    messagePatterns: [/\b(k|ok|okay|fine|whatever|sure)\.?\b/i],
  },
  {
    name: "workplace",
    phrases: [
      "This is polite on paper and deeply tired underneath.",
      "You're trying to stay professional while gently shaking the table.",
      "This is less 'just following up' and more 'please stop making me chase this.'",
      "This is wearing a blazer, but the sleeves are full of tension.",
      "Professional on the surface. Shoes-on-the-carpet underneath.",
    ],
    messagePatterns: [
      /\b(per my last email|following up|follow up|as discussed|as mentioned)\b/i,
      /\b(manager|boss|client|meeting|deadline|email|regards)\b/i,
    ],
  },
  {
    name: "angry",
    phrases: [
      "You're not just asking a question. You're arriving with evidence.",
      "This is frustration wearing shoes indoors.",
      "You want answers, but the message is bringing a torch.",
      "The feeling is valid. The delivery has its hazards on.",
      "This has a point, but it is hiding behind the heat.",
    ],
    messagePatterns: [
      /\b(angry|mad|annoyed|ridiculous|done|hate|sucks)\b/i,
      /\b(why would you|what did i do|where were you|explain yourself)\b/i,
    ],
  },
  {
    name: "overexplaining",
    phrases: [
      "This brought receipts, but nobody asked for the whole binder.",
      "Somewhere in here is a really good message.",
      "This is overexplaining because silence feels illegal right now.",
      "The point is good. It just took the scenic route.",
    ],
    messagePatterns: [/\b(because|also|another thing|to be clear|what i meant)\b/i],
  },
];

const rotatingSubtextLines = [
  "This reads like a breakup drafted in a Tesco car park.",
  "Confident words. Nervous energy.",
  "You're saying 'fine.' The message is not.",
  "Somewhere between heartfelt and hostage note.",
  "This one could use a softer landing.",
  "Emotionally available. Structurally chaotic.",
  "Like a hug delivered by email.",
  "There's warmth in here. Buried deep, but there.",
  "This feels accidentally honest.",
  "A brave amount of punctuation.",
  "You can almost hear the overthinking.",
  "This lands harder than you think.",
  "Polite wording. Violent undertones.",
  "Honestly? Better than most people communicate.",
  "Reads like you typed it while pacing.",
  "This has 'sent too quickly' energy.",
  "Somewhere in here is a really good message.",
  "Not cold. Just... aggressively efficient.",
  "This feels one edit away from clarity.",
  "There's a real person in this one.",
  "The sentence is calm. The room is not.",
  "A little less edge and this could actually land.",
  "This is trying to be casual in formal shoes.",
  "Soft intent, pointy delivery.",
  "The honesty is there. It just needs better lighting.",
  "This is not dramatic. It is dramatic-adjacent.",
  "A clean thought wearing a messy coat.",
  "This message wants to be brave, but keeps checking the exits.",
  "Readable, but emotionally double-parked.",
  "The tone says composed. The commas disagree.",
  "This could be kind if it stopped flinching.",
  "A small message carrying a suspiciously large backpack.",
  "This is clearer than it is comfortable.",
  "Almost graceful. Currently wearing boots indoors.",
  "There's a good point here trying not to make eye contact.",
  "This is what happens when sincerity meets bad timing.",
  "Warm underneath, chilly at the edges.",
  "This has the energy of a sigh with spellcheck.",
  "The message is doing its best. Its best needs a nap.",
  "Good instinct. Slightly haunted execution.",
  "This is a lot of feeling for one small text box.",
  "You are closer to direct than you think.",
  "This reads honest, but not quite ready.",
  "A gentle thought with sharp elbows.",
  "This has emotional weather.",
  "Not a disaster. More of a wobbly entrance.",
  "This is the text equivalent of standing in the doorway.",
  "The feeling is right. The landing gear is questionable.",
  "A tiny edit could make this much easier to receive.",
  "There is care in here, even if it arrived late.",
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

function matchesAnyPattern(text: string, patterns: RegExp[] = []) {
  return patterns.some((pattern) => pattern.test(text));
}

function selectRandomLine(lines: string[], previousLine: string | null) {
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0];

  const availableLines = previousLine
    ? lines.filter((line) => line !== previousLine)
    : lines;

  return availableLines[Math.floor(Math.random() * availableLines.length)];
}

function getSignaturePhrases(result: AnalysisResult, message: string) {
  const messageText = message.toLowerCase();
  const matchedCategories = signaturePhrases.filter((phrase) =>
    matchesAnyPattern(messageText, phrase.messagePatterns),
  );

  return matchedCategories.flatMap((phrase) => phrase.phrases);
}

function getReadSeverity(result: AnalysisResult, message: string) {
  const messageText = message.toLowerCase();
  const analysisText = getAnalysisText(result, message);
  const lowScores = result.confidenceScore <= 5 || result.clarityScore <= 5;

  if (/\b(lol|haha|lmao)\b/i.test(messageText) && /panic|anxiety|spiral|ignoring/.test(analysisText)) {
    return "One LOL Away From A Breakdown";
  }

  if (/\b(per my last email|whatever|fine|sure)\b/i.test(messageText) || /^\s*(k|ok|okay)\.?\s*$/i.test(messageText)) {
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

function getSubtext(
  result: AnalysisResult,
  message: string,
  previousSubtext: string | null,
) {
  const matchingPhrases = getSignaturePhrases(result, message);

  if (matchingPhrases.length > 0) {
    return selectRandomLine(matchingPhrases, previousSubtext);
  }

  const analysisText = getAnalysisText(result, message);
  const subtextCandidates: string[] = [];

  if (/sorry|apolog/.test(analysisText)) {
    subtextCandidates.push(
      "You are trying to repair something without making the apology a whole production.",
      "This wants to make things right without turning into a speech.",
    );
  }

  if (/work|job|email|manager|boss|professional/.test(analysisText)) {
    subtextCandidates.push(
      "You want to stay professional, but the inside voice is already pacing.",
      "Professional on the surface. Shoes-on-the-carpet underneath.",
    );
  }

  if (/date|dating|relationship|miss you/.test(analysisText)) {
    subtextCandidates.push(
      "You want connection, but you are trying not to look like you want connection.",
      "This is reaching out while pretending its arm is not extended.",
    );
  }

  if (/cold|clipped|blunt|short/.test(analysisText)) {
    subtextCandidates.push(
      "Not cold exactly. Just arriving without a blanket.",
      "This is concise in a way that might make someone nervous.",
      "The message is brief. The read may not be.",
    );
  }

  if (/clear|honest|direct|readable/.test(analysisText)) {
    subtextCandidates.push(
      "The point is there. It just needs a little better lighting.",
      "This is close to clear. It could land softer.",
      "There's a real message in here, and it is almost ready.",
    );
  }

  if (/anxious|panic|spiral|reassurance|needy/.test(analysisText)) {
    subtextCandidates.push(
      "This wants reassurance without putting a sign on it.",
      "The check-in is doing a lot of emotional lifting.",
      "You are asking gently, but the worry is not whispering.",
    );
  }

  if (/angry|frustrated|furious|loaded|defensive/.test(analysisText)) {
    subtextCandidates.push(
      "The feeling is fair. The landing is a little sharp.",
      "This has heat, and some of it is useful.",
      "You're making a point. The point is carrying matches.",
    );
  }

  if (subtextCandidates.length === 0) {
    subtextCandidates.push(...rotatingSubtextLines);
  }

  return selectRandomLine(subtextCandidates, previousSubtext);
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [rewriteCopied, setRewriteCopied] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);
  const [socialMirror, setSocialMirror] = useState<SocialMirror | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSubtextRef = useRef<string | null>(null);
  const messageLength = message.length;
  const isMessageEmpty = message.trim().length === 0;
  const isOverCharacterLimit = messageLength > MESSAGE_CHARACTER_LIMIT;
  const isNearCharacterLimit = messageLength >= MESSAGE_CHARACTER_LIMIT * 0.85;
  const isAtCharacterLimit = messageLength >= MESSAGE_CHARACTER_LIMIT;
  const canAnalyze = !isLoading && !isMessageEmpty && !isOverCharacterLimit;

  const handleAnalyze = async () => {
    if (isLoading) return;

    setResult(null);
    setSocialMirror(null);
    setError("");
    setRewriteCopied(false);
    setShowRewrite(false);

    if (isMessageEmpty) {
      setError("Paste a message before analyzing.");
      return;
    }

    if (isOverCharacterLimit) {
      setError("That's enough panic for one read.");
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

      const normalizedResult = normalizeAnalysisResult(data);
      const nextSubtext = getSubtext(
        normalizedResult,
        message,
        lastSubtextRef.current,
      );

      lastSubtextRef.current = nextSubtext;
      setResult(normalizedResult);
      setSocialMirror({
        severity: getReadSeverity(normalizedResult, message),
        subtext: nextSubtext,
      });
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
            className={`chat-wallpaper-bubble absolute hidden rounded-[1.5rem] border border-white/55 bg-white/48 px-4 py-2.5 font-semibold leading-tight text-slate-900/68 shadow-[0_20px_62px_-46px_rgba(18,24,70,0.7),inset_0_1px_0_rgba(255,255,255,0.62)] backdrop-blur-xl md:block lg:px-5 lg:py-3 ${bubble.className}`}
          >
            {bubble.text}
          </span>
        ))}
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-5 py-10 sm:px-8 sm:py-16">
        <div className="app-card-enter rounded-[1.75rem] bg-[#fffefa]/98 p-5 shadow-[0_34px_110px_-58px_rgba(45,64,116,0.46),0_0_70px_-34px_rgba(132,112,255,0.34)] ring-1 ring-[#7185bd]/18 backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_38px_120px_-58px_rgba(45,64,116,0.52),0_0_82px_-34px_rgba(132,112,255,0.42)] sm:p-10">
          <div className="inline-flex max-w-full items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-[#fff2d8] shadow-[0_16px_38px_-28px_rgba(15,23,42,0.8)]">
              <span className="text-base font-black leading-none tracking-[-0.04em]">
                T
              </span>
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#fffefa] bg-[#2f6fed]"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[1.05rem] font-black leading-none tracking-[-0.035em] text-slate-950 sm:text-[1.18rem]">
                Text<span className="text-[#2f6fed]">Panic</span>
              </p>
              <p className="mt-1.5 max-w-[22rem] truncate text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                For messages written during emotional turbulence.
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-3xl sm:mt-9">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f6fed] sm:text-sm">
              Before you hit send...
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-[2.85rem] sm:leading-[1.04]">
              Paste your text.
              <br />
              We&apos;ll tell you if it lands or crashes.
            </h1>
          </div>

          <div className="mt-7 space-y-5 sm:mt-9 sm:space-y-6">
            <label htmlFor="message" className="sr-only">
              Message input
            </label>
            <textarea
              id="message"
              rows={10}
              maxLength={MESSAGE_CHARACTER_LIMIT}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Paste the text you're spiraling over..."
              className="w-full min-h-[260px] rounded-[1.5rem] border border-slate-200/80 bg-[#fffdf9] px-6 py-5 text-base leading-7 text-slate-900 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.22)] placeholder:text-slate-400 outline-none transition duration-300 ease-out focus:border-[#2f6fed]/40 focus:ring-4 focus:ring-[#2f6fed]/10"
            />
            <div className="flex flex-col gap-2 px-1 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>Keep it tight. The spiral can still be implied.</p>
              <div className="flex items-center gap-3">
                {isAtCharacterLimit ? (
                  <span className="text-[#9b6508]">
                    That&apos;s enough panic for one read.
                  </span>
                ) : null}
                <span
                  className={`tabular-nums transition-colors ${
                    isAtCharacterLimit
                      ? "font-semibold text-[#9b6508]"
                      : isNearCharacterLimit
                        ? "font-semibold text-[#2f6fed]"
                        : "text-slate-400"
                  }`}
                >
                  {messageLength} / {MESSAGE_CHARACTER_LIMIT}
                </span>
              </div>
            </div>

            {error ? (
              <p className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="inline-flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:shadow-none"
            >
              {isLoading ? (
                  <span className="inline-flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {loadingMessage}
                </span>
              ) : (
                "Read my text"
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
                      : "A tiny pause goes here."}
                </h2>
              </div>
            </div>

            <div
              className="mt-6 space-y-6 transition-all duration-500 ease-out"
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

                  <div className="space-y-4 sm:space-y-5">
                    <div className="rounded-[1.55rem] bg-[#fff2d8] p-6 shadow-[0_24px_64px_-54px_rgba(164,106,5,0.58)] ring-1 ring-[#efbd5b]/35 sm:p-7">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6508] sm:text-sm">
                        THE VIBE
                      </p>
                      <p className="mt-4 max-w-[39rem] text-[1.22rem] font-semibold leading-[1.38] tracking-tight text-slate-950 sm:text-[1.42rem] sm:leading-[1.34]">
                        {result.emotionalInterpretation}
                      </p>
                    </div>
                    {socialMirror ? (
                      <div className="rounded-[1.55rem] bg-[#fffdf8]/88 p-6 shadow-[0_22px_60px_-55px_rgba(15,23,42,0.34)] ring-1 ring-slate-950/[0.04] sm:p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f6fed] sm:text-sm">
                          THE SUBTEXT
                        </p>
                        <p className="mt-4 max-w-[39rem] text-[1.22rem] font-semibold leading-[1.38] tracking-tight text-slate-900 sm:text-[1.42rem] sm:leading-[1.34]">
                          {socialMirror.subtext}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-[1.55rem] bg-[#e9f1f4] p-6 shadow-[0_22px_60px_-55px_rgba(15,23,42,0.36)] ring-1 ring-[#8fb2c3]/20 sm:p-7">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4e7282] sm:text-sm">
                        HOW THIS LANDS
                      </p>
                      <p className="mt-4 max-w-[39rem] text-[1.22rem] font-semibold leading-[1.38] tracking-tight text-slate-800 sm:text-[1.42rem] sm:leading-[1.34]">
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
                <div className="relative overflow-hidden rounded-[1.65rem] bg-[#fbfcff] px-6 py-9 shadow-[0_22px_70px_-55px_rgba(63,86,132,0.55)] ring-1 ring-[#9aabc8]/22 sm:px-8 sm:py-10">
                  <div
                    aria-hidden="true"
                    className="absolute right-6 top-6 h-14 w-14 rounded-full bg-[#eaf0ff] text-[#6c82ad] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:right-8 sm:top-8"
                  >
                    <span className="absolute left-1/2 top-1/2 text-3xl font-semibold leading-none -translate-x-1/2 -translate-y-1/2">
                      *
                    </span>
                    <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[#b7c5df]" />
                    <span className="absolute bottom-3 left-3 h-1 w-1 rounded-full bg-[#b7c5df]" />
                  </div>
                  <div className="max-w-[31rem] pr-14 sm:pr-20">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#6f84a8]">
                      TextPanic check
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#243149] sm:text-3xl">
                      No panic analyzed yet.
                    </h3>
                    <p className="mt-4 text-base leading-7 text-[#64748b] sm:text-lg sm:leading-8">
                      Paste a message to get the read. The fix stays locked
                      until you ask for it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
