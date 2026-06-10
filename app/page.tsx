"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { captureTextPanicEvent } from "./lib/analytics";

type AnalysisResult = {
  tone: string;
  confidenceScore: number;
  clarityScore: number;
  communicationIntelligenceScore: number;
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
};

type InsightCardId =
  | "communication"
  | "landing"
  | "perception"
  | "intent"
  | "revealing"
  | "subtext";

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

const loadingMessages = [
  "Reading the communication impact...",
  "Checking perception and clarity...",
  "Identifying hidden subtext...",
  "Interpreting emotional subtext...",
  "Measuring emotional pressure...",
  "Looking for hidden tension...",
  "Separating confidence from overexplaining...",
  "Reading how this might land...",
];

const signaturePhrases: SignaturePhrase[] = [
  {
    name: "fake-casual",
    phrases: [
      "The casual phrasing softens the message, but the emotional ask is still visible.",
      "The light tone lowers the pressure, though it may also make the real point less direct.",
      "The message sounds casual on the surface and more invested underneath.",
      "The wording is relaxed, but the recipient may still sense a need for reassurance.",
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
      "This is clear, but the low context may read as distance.",
      "The brevity gives the recipient very little emotional information.",
      "This may be efficient, but it can also feel closed off.",
    ],
    messagePatterns: [/^\s*(k|ok|okay|sure)\.?\s*$/i],
  },
  {
    name: "anxious",
    phrases: [
      "This asks for clarity, but the emotional pressure is easy to notice.",
      "The message is reaching for reassurance while trying to stay light.",
      "The intent is connection, but the recipient may hear uncertainty.",
      "The core ask would land more cleanly with a little more directness.",
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
      "The wording sounds detached, but the impact may carry frustration.",
      "This may read as disengaged rather than resolved.",
      "The sentence is short, but the recipient may infer more tension than you intend.",
      "This wording creates a wider perception gap than it may look like.",
    ],
    messagePatterns: [/\b(k|ok|okay|fine|whatever|sure)\.?\b/i],
  },
  {
    name: "workplace",
    phrases: [
      "This is professional, with some visible pressure underneath.",
      "The message keeps the work moving, but tone may affect how it is received.",
      "This is clear as a task update, with a possible edge around follow-through.",
      "The professional frame helps, but the recipient may still sense tension.",
    ],
    messagePatterns: [
      /\b(per my last email|following up|follow up|as discussed|as mentioned)\b/i,
      /\b(manager|boss|client|meeting|deadline|email|regards)\b/i,
    ],
  },
  {
    name: "angry",
    phrases: [
      "The concern may be valid, but the emotional pressure is leading.",
      "The point is present, but the tone may raise defensiveness.",
      "This communicates urgency, though it may need a clearer request.",
      "The message would land better if the issue and the ask were separated.",
    ],
    messagePatterns: [
      /\b(angry|mad|annoyed|ridiculous|done|hate|sucks)\b/i,
      /\b(why would you|what did i do|where were you|explain yourself)\b/i,
    ],
  },
  {
    name: "overexplaining",
    phrases: [
      "The main point is here, but extra context may dilute it.",
      "This would feel stronger if the clearest sentence came earlier.",
      "The explanation is thoughtful, but it may ask the recipient to do extra sorting.",
      "The point is useful; it just needs a more direct path.",
    ],
    messagePatterns: [/\b(because|also|another thing|to be clear|what i meant)\b/i],
  },
];

const rotatingSubtextLines = [
  "The intent is understandable, but the impact could be clearer.",
  "This is close to clear; the recipient may need a little more context.",
  "The message has care in it, but the delivery could be easier to receive.",
  "The strongest version would make the ask more direct.",
  "The tone is mostly steady, with a little room to reduce pressure.",
  "This is readable, but the perception gap could be smaller.",
  "The emotional signal is present; clarity will help it land.",
  "The message would benefit from one cleaner center of gravity.",
  "There is a useful point here, and it can be easier to receive.",
  "The recipient may hear more tension than the sender intends.",
];

const defaultAnalysisResult: AnalysisResult = {
  tone: "Unknown",
  confidenceScore: 0,
  clarityScore: 0,
  communicationIntelligenceScore: 0,
  communicationFramework: {
    perceptionGap: "No perception gap was provided.",
    emotionalPressure: "No emotional pressure read was provided.",
    confidenceSignal: "No confidence signal was provided.",
    hiddenSubtext: "No hidden subtext was provided.",
    communicationClarity: "No clarity read was provided.",
  },
  emotionalInterpretation: "No emotional interpretation was provided.",
  perceptionGap: "No perception gap was provided.",
  intentVsImpact: {
    youMeant: "No intent was provided.",
    theyMayHear: "No impact was provided.",
  },
  mostRevealingLine: {
    quote: "No revealing line was provided.",
    explanation: "No explanation was provided.",
  },
  recipientLikelyPerception: "No recipient perception was provided.",
  improvedRewrite: "No rewrite suggestion was provided.",
};

function normalizeAnalysisResult(value: unknown): AnalysisResult {
  if (!value || typeof value !== "object") return defaultAnalysisResult;

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
    communicationIntelligenceScore:
      typeof result.communicationIntelligenceScore === "number"
        ? Math.max(0, Math.min(100, Math.round(result.communicationIntelligenceScore)))
        : defaultAnalysisResult.communicationIntelligenceScore,
    communicationFramework: {
      perceptionGap:
        typeof communicationFramework?.perceptionGap === "string"
          ? communicationFramework.perceptionGap
          : defaultAnalysisResult.communicationFramework.perceptionGap,
      emotionalPressure:
        typeof communicationFramework?.emotionalPressure === "string"
          ? communicationFramework.emotionalPressure
          : defaultAnalysisResult.communicationFramework.emotionalPressure,
      confidenceSignal:
        typeof communicationFramework?.confidenceSignal === "string"
          ? communicationFramework.confidenceSignal
          : defaultAnalysisResult.communicationFramework.confidenceSignal,
      hiddenSubtext:
        typeof communicationFramework?.hiddenSubtext === "string"
          ? communicationFramework.hiddenSubtext
          : defaultAnalysisResult.communicationFramework.hiddenSubtext,
      communicationClarity:
        typeof communicationFramework?.communicationClarity === "string"
          ? communicationFramework.communicationClarity
          : defaultAnalysisResult.communicationFramework.communicationClarity,
    },
    emotionalInterpretation:
      typeof result.emotionalInterpretation === "string"
        ? result.emotionalInterpretation
        : defaultAnalysisResult.emotionalInterpretation,
    perceptionGap:
      typeof result.perceptionGap === "string"
        ? result.perceptionGap
        : defaultAnalysisResult.perceptionGap,
    intentVsImpact: {
      youMeant:
        typeof intentVsImpact?.youMeant === "string"
          ? intentVsImpact.youMeant
          : defaultAnalysisResult.intentVsImpact.youMeant,
      theyMayHear:
        typeof intentVsImpact?.theyMayHear === "string"
          ? intentVsImpact.theyMayHear
          : defaultAnalysisResult.intentVsImpact.theyMayHear,
    },
    mostRevealingLine: {
      quote:
        typeof mostRevealingLine?.quote === "string"
          ? mostRevealingLine.quote
          : defaultAnalysisResult.mostRevealingLine.quote,
      explanation:
        typeof mostRevealingLine?.explanation === "string"
          ? mostRevealingLine.explanation
          : defaultAnalysisResult.mostRevealingLine.explanation,
    },
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
    result.communicationIntelligenceScore,
    result.communicationFramework.perceptionGap,
    result.communicationFramework.emotionalPressure,
    result.communicationFramework.confidenceSignal,
    result.communicationFramework.hiddenSubtext,
    result.communicationFramework.communicationClarity,
    result.emotionalInterpretation,
    result.perceptionGap,
    result.intentVsImpact.youMeant,
    result.intentVsImpact.theyMayHear,
    result.mostRevealingLine.quote,
    result.mostRevealingLine.explanation,
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

  if (
    /calm|healthy|grounded|steady|emotionally safe/.test(analysisText) &&
    result.confidenceScore >= 8 &&
    result.clarityScore >= 8
  ) {
    return "Calm";
  }

  if (/confident|direct|clear and kind|clear, kind/.test(analysisText)) {
    return "Confident";
  }

  if (/overexplaining|too much detail|scenic route/.test(analysisText)) {
    return "Overexplaining";
  }

  if (/\b(per my last email|whatever|fine|sure|no worries)\b/i.test(messageText)) {
    return "Defensive";
  }

  if (/^\s*(k|ok|okay)\.?\s*$/i.test(messageText) || /cold|clipped|detached|distant/.test(analysisText)) {
    return "Detached";
  }

  if (/reassurance|uncertainty|indirect|softening|emotional pressure/.test(analysisText)) {
    return "Emotionally Pressured";
  }

  if (/angry|frustrated|furious|mad|sucks|hate|loaded|heat|escalation/.test(analysisText)) {
    return "Emotionally Loaded";
  }

  if (/thoughtful|repair|sorry|apolog/.test(analysisText)) {
    return "Thoughtful";
  }

  if (lowScores || result.confidenceScore <= 7 || result.clarityScore <= 7) {
    return "Unclear";
  }

  return "Thoughtful";
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
      "The message is oriented toward repair; naming impact clearly will help.",
      "The intent is repair, and the strongest version keeps responsibility visible.",
    );
  }

  if (/work|job|email|manager|boss|professional/.test(analysisText)) {
    subtextCandidates.push(
      "The work context benefits from a clear ask and a steady tone.",
      "The professional frame helps, but perception still depends on how much pressure is visible.",
    );
  }

  if (/date|dating|relationship|miss you/.test(analysisText)) {
    subtextCandidates.push(
      "The message is asking for connection; clarity will make it easier to answer.",
      "The recipient may respond better if the emotional ask is stated plainly.",
    );
  }

  if (/cold|clipped|blunt|short/.test(analysisText)) {
    subtextCandidates.push(
      "The message is concise, but the recipient may need more relational context.",
      "Short can be clear, but it can also leave room for unintended distance.",
      "The message is brief; the impact may be broader than the words.",
    );
  }

  if (/clear|honest|direct|readable/.test(analysisText)) {
    subtextCandidates.push(
      "The core point is there; a little more alignment would help it land.",
      "This is close to clear and could become easier to receive.",
      "The message has a usable center; the impact depends on tone.",
    );
  }

  if (/calm|confident|healthy|grounded|steady|respectful|emotionally safe/.test(analysisText)) {
    subtextCandidates.push(
      "This sounds steady; the intent and likely perception are closely aligned.",
      "The message already communicates with clarity and respect.",
      "This is likely easier to receive than it may feel while drafting.",
    );
  }

  if (/uncertain|reassurance|emotional pressure|indirect/.test(analysisText)) {
    subtextCandidates.push(
      "This asks for reassurance indirectly; a clearer ask would reduce pressure.",
      "The check-in carries more emotional weight than the wording suggests.",
      "The message is gentle, but the underlying need is still visible.",
    );
  }

  if (/angry|frustrated|furious|loaded|defensive/.test(analysisText)) {
    subtextCandidates.push(
      "The concern may be valid, but the tone may make it harder to receive.",
      "The emotional pressure is visible; a clearer request would help.",
      "The point will land better if it is separated from the intensity.",
    );
  }

  if (subtextCandidates.length === 0) {
    subtextCandidates.push(...rotatingSubtextLines);
  }

  return selectRandomLine(subtextCandidates, previousSubtext);
}

function detectLanguageForAnalytics(message: string) {
  if (/[^\u0000-\u007f]/.test(message)) {
    return "non_english_possible";
  }

  return "english_possible";
}

function getSafeAnalyticsProperties(message: string, severity?: string) {
  return {
    character_count: message.trim().length,
    severity,
    detected_language: detectLanguageForAnalytics(message),
  };
}

function formatAnalysisForClipboard(
  result: AnalysisResult,
  socialMirror: SocialMirror,
) {
  return [
    "BetweenLines AI",
    `Communication Intelligence: ${result.communicationIntelligenceScore}/100`,
    `Signal: ${socialMirror.severity}`,
    "",
    "BETWEEN THE LINES",
    result.emotionalInterpretation,
    "",
    "PERCEPTION GAP",
    result.perceptionGap,
    "",
    "INTENT VS IMPACT",
    `You meant: ${result.intentVsImpact.youMeant}`,
    `They may hear: ${result.intentVsImpact.theyMayHear}`,
    "",
    "MOST REVEALING LINE",
    `"${result.mostRevealingLine.quote}"`,
    result.mostRevealingLine.explanation,
    "",
    "HOW THIS MIGHT LAND",
    result.recipientLikelyPerception,
    "",
    "textpanic.com",
  ].join("\n");
}

function ShareCard({
  result,
  socialMirror,
  cardRef,
}: {
  result: AnalysisResult;
  socialMirror: SocialMirror;
  cardRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-[1.75rem] bg-[#fffefa] p-6 text-slate-950 shadow-[0_26px_86px_-54px_rgba(15,23,42,0.46)] ring-1 ring-[#7185bd]/18 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(47,111,237,0.14),transparent_34%),linear-gradient(145deg,rgba(255,217,130,0.2),rgba(222,210,255,0.22)_58%,rgba(207,221,229,0.28))]"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-start gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-[#fff2d8] shadow-[0_16px_38px_-28px_rgba(15,23,42,0.8)]">
              <span className="text-base font-black leading-none tracking-[-0.04em]">
                T
              </span>
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#fffefa] bg-[#2f6fed]"
              />
            </div>
            <div>
              <p className="text-[1.02rem] font-black leading-none tracking-[-0.035em]">
                BetweenLines<span className="text-[#2f6fed]/90"> AI</span>
              </p>
              <p className="mt-1 text-[0.68rem] font-medium leading-tight text-slate-500/75">
                Communication Intelligence for Modern Messaging.
              </p>
            </div>
          </div>
          <div className="max-w-[12rem] rounded-full bg-slate-950 px-3 py-1.5 text-right text-xs font-semibold leading-tight text-[#fff2d8] shadow-[0_18px_45px_-34px_rgba(15,23,42,0.8)]">
            {socialMirror.severity}
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <div className="rounded-[1.35rem] bg-[#ffd982] p-5 ring-1 ring-[#d99a1c]/35">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#7b4d03]">
              BETWEEN THE LINES
            </p>
            <p className="mt-3 text-[1.05rem] font-semibold leading-[1.38] tracking-tight">
              {result.emotionalInterpretation}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#eaf0ff] p-5 ring-1 ring-[#8aa7e6]/35">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#2f4c86]">
              COMMUNICATION INTELLIGENCE
            </p>
            <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-[#17346f]">
              {result.communicationIntelligenceScore}
              <span className="text-base text-[#5f76a6]">/100</span>
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#cfdde5] p-5 ring-1 ring-[#7899aa]/32">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#3d5d6d]">
              PERCEPTION GAP
            </p>
            <p className="mt-3 text-[1rem] font-semibold leading-[1.38] tracking-tight text-[#233642]">
              {result.perceptionGap}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#fffefa] p-5 ring-1 ring-[#d6cdae]/55">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#806f3d]">
              INTENT VS IMPACT
            </p>
            <div className="mt-3 grid gap-3 text-[#2c2618] sm:grid-cols-2">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#9a8858]">
                  You meant
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold leading-[1.36] tracking-tight">
                  {result.intentVsImpact.youMeant}
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#9a8858]">
                  They may hear
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold leading-[1.36] tracking-tight">
                  {result.intentVsImpact.theyMayHear}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-[#ded2ff] p-5 ring-1 ring-[#9f8add]/36">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#584191]">
              MOST REVEALING LINE
            </p>
            <p className="mt-3 text-[1.02rem] font-semibold leading-[1.35] tracking-tight text-[#211b32]">
              &ldquo;{result.mostRevealingLine.quote}&rdquo;
            </p>
            <p className="mt-2 text-[0.92rem] font-medium leading-[1.45] text-[#4f426d]">
              {result.mostRevealingLine.explanation}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#cfdde5] p-5 ring-1 ring-[#7899aa]/32">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#3d5d6d]">
              HOW THIS MIGHT LAND
            </p>
            <p className="mt-3 text-[1.05rem] font-semibold leading-[1.38] tracking-tight text-[#233642]">
              {result.recipientLikelyPerception}
            </p>
          </div>
        </div>

        <p className="mt-6 text-right text-xs font-semibold tracking-[0.12em] text-slate-400">
          textpanic.com
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [rewriteCopied, setRewriteCopied] = useState(false);
  const [analysisCopied, setAnalysisCopied] = useState(false);
  const [isDownloadingShareCard, setIsDownloadingShareCard] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);
  const [isRevealingRewrite, setIsRevealingRewrite] = useState(false);
  const [socialMirror, setSocialMirror] = useState<SocialMirror | null>(null);
  const [activeInsightCardId, setActiveInsightCardId] =
    useState<InsightCardId>("communication");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const lastSubtextRef = useRef<string | null>(null);
  const messageLength = message.length;
  const isMessageEmpty = message.trim().length === 0;
  const isOverCharacterLimit = messageLength > MESSAGE_CHARACTER_LIMIT;
  const isNearCharacterLimit = messageLength >= MESSAGE_CHARACTER_LIMIT * 0.85;
  const isAtCharacterLimit = messageLength >= MESSAGE_CHARACTER_LIMIT;
  const canAnalyze = !isLoading && !isMessageEmpty && !isOverCharacterLimit;

  const handleAnalyze = async () => {
    if (isLoading) return;

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    setResult(null);
    setSocialMirror(null);
    setError("");
    setRewriteCopied(false);
    setAnalysisCopied(false);
    setShowSharePreview(false);
    setShowRewrite(false);
    setIsRevealingRewrite(false);
    setActiveInsightCardId("communication");

    if (isMessageEmpty) {
      setError("Paste a message before analyzing.");
      return;
    }

    if (isOverCharacterLimit) {
      setError("That's enough text for one interpretation.");
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
      const severity = getReadSeverity(normalizedResult, message);

      lastSubtextRef.current = nextSubtext;
      setResult(normalizedResult);
      setSocialMirror({
        severity,
        subtext: nextSubtext,
      });
      setShowRewrite(false);
      setRewriteCopied(false);
      setAnalysisCopied(false);
      setShowSharePreview(false);
      setActiveInsightCardId("communication");
      captureTextPanicEvent("text_analyzed", {
        ...getSafeAnalyticsProperties(message, severity),
      });
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

  const handleClearText = () => {
    setMessage("");
    setResult(null);
    setSocialMirror(null);
    setError("");
    setRewriteCopied(false);
    setAnalysisCopied(false);
    setShowSharePreview(false);
    setShowRewrite(false);
    setIsRevealingRewrite(false);
    setActiveInsightCardId("communication");

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    if (analysisCopyTimeoutRef.current) {
      clearTimeout(analysisCopyTimeoutRef.current);
      analysisCopyTimeoutRef.current = null;
    }

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  };

  const handleRevealRewrite = () => {
    if (isRevealingRewrite || showRewrite) return;

    const rewriteEventProperties = {
      ...getSafeAnalyticsProperties(message, socialMirror?.severity),
    };
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setShowRewrite(true);
      captureTextPanicEvent("rewrite_revealed", rewriteEventProperties);
      return;
    }

    setIsRevealingRewrite(true);
    revealTimeoutRef.current = setTimeout(() => {
      setShowRewrite(true);
      setIsRevealingRewrite(false);
      revealTimeoutRef.current = null;
      captureTextPanicEvent("rewrite_revealed", rewriteEventProperties);
    }, 650);
  };

  const handleCopyRewrite = async () => {
    if (!result?.improvedRewrite) return;

    try {
      await navigator.clipboard.writeText(result.improvedRewrite);
      setRewriteCopied(true);
      captureTextPanicEvent("rewrite_copied", {
        ...getSafeAnalyticsProperties(message, socialMirror?.severity),
      });

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

  const handleCopyAnalysis = async () => {
    if (!result || !socialMirror) return;

    try {
      await navigator.clipboard.writeText(
        formatAnalysisForClipboard(result, socialMirror),
      );
      setAnalysisCopied(true);
      captureTextPanicEvent("result_copied", {
        ...getSafeAnalyticsProperties(message, socialMirror.severity),
      });

      if (analysisCopyTimeoutRef.current) {
        clearTimeout(analysisCopyTimeoutRef.current);
      }

      analysisCopyTimeoutRef.current = setTimeout(() => {
        setAnalysisCopied(false);
      }, 1600);
    } catch {
      setError(
        "Copy did not work in this browser. The read is still right there.",
      );
    }
  };

  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current || !socialMirror) return;

    setIsDownloadingShareCard(true);
    setError("");

    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "textpanic-read.png";
      link.href = dataUrl;
      link.click();
      captureTextPanicEvent("share_card_downloaded", {
        ...getSafeAnalyticsProperties(message, socialMirror.severity),
      });
    } catch (error) {
      console.error("Share card download failed.", error);
      setError(
        "The share card refused to become a PNG. Very dramatic. Try again.",
      );
      captureTextPanicEvent("share_card_download_failed", {
        ...getSafeAnalyticsProperties(message, socialMirror.severity),
      });
    } finally {
      setIsDownloadingShareCard(false);
    }
  };

  const handleToggleSharePreview = () => {
    const nextShowSharePreview = !showSharePreview;

    setShowSharePreview(nextShowSharePreview);

    if (nextShowSharePreview) {
      captureTextPanicEvent("share_card_preview_opened", {
        ...getSafeAnalyticsProperties(message, socialMirror?.severity),
      });
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      if (analysisCopyTimeoutRef.current) {
        clearTimeout(analysisCopyTimeoutRef.current);
      }

      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const loadingMessage = loadingMessages[message.length % loadingMessages.length];
  const exampleUseCases = [
    "Should I send this to my ex?",
    "Does this sound passive aggressive?",
    "Am I overexplaining?",
    "Why does this feel emotionally loaded?",
  ];
  const insightCards = result
    ? [
        {
          id: "communication" as const,
          title: "Between the Lines",
          activeClassName:
            "bg-[#ffd982] text-slate-950 ring-[#d99a1c]/42 shadow-[0_28px_70px_-48px_rgba(164,106,5,0.72)]",
          inactiveClassName:
            "bg-[#f4c96f] text-[#4d3303] ring-[#d99a1c]/34 shadow-[0_18px_42px_-38px_rgba(164,106,5,0.46)]",
          content: (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-[39rem] text-[1.24rem] font-semibold leading-[1.36] tracking-tight sm:text-[1.48rem] sm:leading-[1.32]">
                {result.emotionalInterpretation}
              </p>
              <div className="w-fit shrink-0 rounded-2xl bg-[#fffefa]/70 px-3.5 py-2.5 text-[#17346f] ring-1 ring-[#d99a1c]/22 sm:text-right">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#7b4d03]/75">
                  Intelligence
                </p>
                <p className="mt-1 text-2xl font-semibold leading-none tracking-tight">
                  {result.communicationIntelligenceScore}
                  <span className="text-sm text-[#5f76a6]">/100</span>
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "landing" as const,
          title: "How This Might Land",
          activeClassName:
            "bg-[#cfdde5] text-[#233642] ring-[#7899aa]/34 shadow-[0_24px_58px_-50px_rgba(45,74,92,0.54)]",
          inactiveClassName:
            "bg-[#bfd0da] text-[#233642] ring-[#7899aa]/28 shadow-[0_18px_42px_-38px_rgba(45,74,92,0.38)]",
          content: (
            <p className="mt-3 max-w-[39rem] text-[1.14rem] font-semibold leading-[1.4] tracking-tight sm:text-[1.3rem] sm:leading-[1.34]">
              {result.recipientLikelyPerception}
            </p>
          ),
        },
        {
          id: "perception" as const,
          title: "Perception Gap",
          activeClassName:
            "bg-[#fbfcff] text-[#243149] ring-[#9aabc8]/24 shadow-[0_22px_50px_-48px_rgba(63,86,132,0.46)]",
          inactiveClassName:
            "bg-[#eef3fb] text-[#243149] ring-[#9aabc8]/22 shadow-[0_16px_38px_-36px_rgba(63,86,132,0.34)]",
          content: (
            <p className="mt-3 max-w-[39rem] text-sm font-semibold leading-6 tracking-tight sm:text-base">
              {result.perceptionGap}
            </p>
          ),
        },
        {
          id: "intent" as const,
          title: "Intent vs Impact",
          activeClassName:
            "bg-[#fffefa] text-[#2c2618] ring-[#c8b884]/32 shadow-[0_20px_46px_-48px_rgba(94,78,32,0.42)]",
          inactiveClassName:
            "bg-[#f5f0df] text-[#2c2618] ring-[#c8b884]/28 shadow-[0_16px_38px_-36px_rgba(94,78,32,0.32)]",
          content: (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#9a8858]">
                  You meant
                </p>
                <p className="mt-1.5 max-w-[39rem] text-sm font-semibold leading-6 tracking-tight sm:text-base">
                  {result.intentVsImpact.youMeant}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#9a8858]">
                  They may hear
                </p>
                <p className="mt-1.5 max-w-[39rem] text-sm font-semibold leading-6 tracking-tight sm:text-base">
                  {result.intentVsImpact.theyMayHear}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "revealing" as const,
          title: "Most Revealing Line",
          activeClassName:
            "bg-[#ded2ff] text-[#211b32] ring-[#9f8add]/32 shadow-[0_18px_42px_-46px_rgba(72,52,124,0.48)]",
          inactiveClassName:
            "bg-[#d1c3f5] text-[#211b32] ring-[#9f8add]/28 shadow-[0_16px_38px_-36px_rgba(72,52,124,0.34)]",
          content: (
            <>
              <p className="mt-3 max-w-[39rem] text-[1.06rem] font-semibold leading-[1.35] tracking-tight sm:text-[1.14rem]">
                &ldquo;{result.mostRevealingLine.quote}&rdquo;
              </p>
              <p className="mt-2 max-w-[39rem] text-sm font-medium leading-6 text-[#4f426d] sm:text-base">
                {result.mostRevealingLine.explanation}
              </p>
            </>
          ),
        },
        ...(socialMirror
          ? [
              {
                id: "subtext" as const,
                title: "Hidden Subtext",
                activeClassName:
                  "bg-[#fffdf8] text-slate-700 ring-slate-950/[0.06] shadow-[0_14px_34px_-40px_rgba(15,23,42,0.38)]",
                inactiveClassName:
                  "bg-[#f2eee2] text-slate-600 ring-slate-950/[0.05] shadow-[0_12px_30px_-36px_rgba(15,23,42,0.28)]",
                content: (
                  <p className="mt-2 max-w-[39rem] text-sm font-semibold leading-6 tracking-tight sm:text-base">
                    {socialMirror.subtext}
                  </p>
                ),
              },
            ]
          : []),
      ]
    : [];
  const visibleInsightCards =
    insightCards.length > 0
      ? [
          insightCards.find((card) => card.id === activeInsightCardId) ??
            insightCards[0],
          ...insightCards.filter((card) => card.id !== activeInsightCardId),
        ]
      : [];

  return (
    // This full-screen wrapper is the visible canvas behind the app card.
    // Body/global background changes were previously masked by this layer.
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-slate-950 font-sans antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),rgba(78,73,168,0.24)_38%,rgba(47,111,237,0.14)_66%,rgba(255,123,189,0.16)_100%)]" />
        <div className="absolute inset-x-[-12%] top-[-20%] h-72 rotate-[-3deg] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.36),rgba(222,210,255,0.18)_48%,rgba(255,255,255,0)_70%)] blur-2xl sm:h-96" />
        <div className="absolute inset-x-[-10%] bottom-[-24%] h-80 rotate-[4deg] bg-[radial-gradient(ellipse_at_center,rgba(72,48,150,0.22),rgba(47,111,237,0.12)_48%,rgba(72,48,150,0)_72%)] blur-3xl sm:h-[28rem]" />
        <div className="absolute left-1/2 top-1/2 h-[35rem] w-[min(88vw,56rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,254,250,0.58),rgba(207,221,229,0.24)_40%,rgba(47,111,237,0.12)_62%,rgba(255,255,255,0)_78%)] blur-2xl" />
        <div className="absolute left-1/2 top-[46%] h-[22rem] w-[min(68vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,217,130,0.14),rgba(222,210,255,0.1)_50%,rgba(255,255,255,0)_74%)] blur-xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-[52rem] flex-col justify-center px-5 py-7 sm:px-8 sm:py-10">
        <div className="app-card-enter rounded-[1.75rem] bg-[#fffefa]/98 p-4 shadow-[0_34px_110px_-58px_rgba(45,64,116,0.46),0_0_70px_-34px_rgba(132,112,255,0.34)] ring-1 ring-[#7185bd]/18 backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_38px_120px_-58px_rgba(45,64,116,0.52),0_0_82px_-34px_rgba(132,112,255,0.42)] sm:p-7 lg:p-8">
          <div className="inline-flex max-w-full items-start gap-3">
            <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-[#fff2d8] shadow-[0_16px_38px_-28px_rgba(15,23,42,0.8)]">
              <span className="text-base font-black leading-none tracking-[-0.04em]">
                T
              </span>
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#fffefa] bg-[#2f6fed]"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[1.05rem] font-black leading-none tracking-[-0.03em] text-slate-950 sm:text-[1.16rem]">
                BetweenLines<span className="text-[#2f6fed]/90"> AI</span>
              </p>
              <p className="mt-1 max-w-[18rem] text-[0.72rem] font-medium leading-[1.35] text-slate-500/76 sm:max-w-none sm:text-[0.78rem]">
                Communication Intelligence for Modern Messaging.
              </p>
            </div>
          </div>

          <div className="mt-4 max-w-full sm:mt-5">
            <h1 className="max-w-full text-[clamp(1.9rem,5.8vw,2.45rem)] font-semibold leading-[1.08] tracking-tight text-slate-950 [overflow-wrap:break-word] [text-wrap:balance] sm:leading-[1.06]">
              See the gap between what you mean and what others may hear.
            </h1>
          </div>

          <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4">
            <label htmlFor="message" className="sr-only">
              Message input
            </label>
            <div className="rounded-[1rem] bg-[#fbfcff]/48 px-3.5 py-2.5">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Thoughts people have before hitting send
              </p>
              <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1">
                {exampleUseCases.map((useCase) => (
                  <span
                    key={useCase}
                    className="rounded-[0.9rem] bg-[#fffefa]/52 px-2.5 py-0.5 text-[0.72rem] font-medium leading-5 text-slate-500/90"
                  >
                    &ldquo;{useCase}&rdquo;
                  </span>
                ))}
              </div>
            </div>
            <textarea
              id="message"
              aria-label="Message to analyze"
              rows={10}
              maxLength={MESSAGE_CHARACTER_LIMIT}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
              placeholder="Paste the message you want to understand..."
              className="w-full min-h-[178px] rounded-[1.45rem] border border-[#b9c7db]/70 bg-[#f4f7fb] px-5 py-4 text-base leading-7 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),inset_0_18px_42px_-36px_rgba(70,91,128,0.5),0_18px_50px_-38px_rgba(15,23,42,0.28)] placeholder:text-slate-500/78 outline-none transition duration-300 ease-out hover:border-[#9fb2cc]/85 hover:bg-[#f7f9fc] focus:border-[#2f6fed]/55 focus:bg-[#fbfcff] focus:ring-4 focus:ring-[#2f6fed]/14 sm:min-h-[195px] sm:px-6 sm:py-4"
            />
            <div className="-mt-0.5 inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-[#2f4c86] shadow-sm ring-1 ring-[#2f6fed]/16">
              <span aria-hidden="true">&#128274;</span>
              <span>We don&apos;t store or save your messages.</span>
            </div>
            <div className="flex items-center justify-end gap-3 px-1 text-xs font-medium text-slate-500">
              {isAtCharacterLimit ? (
                <span className="text-[#9b6508]">
                  That&apos;s enough text for one interpretation.
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

            {error ? (
              <p className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              {messageLength > 0 ? (
                <button
                  type="button"
                  aria-label="Clear text"
                  onClick={handleClearText}
                  disabled={isLoading}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#eaf0ff] px-6 py-3 text-base font-semibold text-[#2f4c86] shadow-[0_16px_36px_-30px_rgba(47,111,237,0.6)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#dfe8ff] hover:text-[#17346f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f6fed]/16 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Clear text
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Interpret my message"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-3 rounded-full bg-slate-950 px-8 py-3.5 text-base font-semibold text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-950/20 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:shadow-none"
              >
                {isLoading ? (
                    <span className="inline-flex items-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {loadingMessage}
                  </span>
                ) : (
                  "Interpret my message"
                )}
              </button>
            </div>
          </div>

          <section className="mt-9 rounded-[1.5rem] bg-[#f6f3eb] p-4 shadow-sm ring-1 ring-slate-950/[0.04] sm:mt-11 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6fed]">
                  BETWEEN THE LINES
                </p>
              </div>
            </div>

            <div
              className="mt-4 space-y-5 transition-all duration-500 ease-out"
            >
              {isLoading ? (
                <div className="rounded-[1.35rem] bg-[#fbfcff] px-5 py-6 shadow-sm ring-1 ring-[#9aabc8]/18">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold leading-6 text-slate-700">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2f6fed]/25 border-t-[#2f6fed]" />
                    {loadingMessage}
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    BetweenLines AI is reading the communication impact. Privately. Carefully.
                    Usefully.
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {socialMirror ? (
                      <div className="inline-flex max-w-full rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-semibold text-[#fff2d8] shadow-[0_18px_45px_-36px_rgba(15,23,42,0.7)]">
                        <span className="truncate">
                          {socialMirror.severity}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-[#fffdf8]/62 px-3 py-1.5 ring-1 ring-slate-950/[0.04]">
                        Signal: <span className="text-slate-700">{result.tone}</span>
                      </span>
                      <span className="rounded-full bg-[#fffdf8]/62 px-3 py-1.5 ring-1 ring-slate-950/[0.04]">
                        Confidence signal:{" "}
                        <span className="text-slate-700">
                          {result.confidenceScore}/10
                        </span>
                      </span>
                      <span className="rounded-full bg-[#fffdf8]/62 px-3 py-1.5 ring-1 ring-slate-950/[0.04]">
                        Clarity:{" "}
                        <span className="text-slate-700">
                          {result.clarityScore}/10
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    className="guided-read-deck rounded-[1.8rem] bg-[#fbfcff]/44 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_70px_-58px_rgba(45,64,116,0.48)] ring-1 ring-white/45 sm:p-3"
                    aria-label="Communication insight deck"
                  >
                    {visibleInsightCards.map((card, index) => {
                      const isActive = card.id === activeInsightCardId;

                      return (
                        <button
                          key={card.id}
                          type="button"
                          aria-label={
                            isActive
                              ? `${card.title} insight currently selected`
                              : `Show ${card.title} insight`
                          }
                          aria-pressed={isActive}
                          onClick={() => setActiveInsightCardId(card.id)}
                          style={{ zIndex: isActive ? 50 : 40 - index }}
                          className={`guided-read-card insight-deck-card result-card-enter relative block w-full rounded-[1.45rem] border-0 text-left outline-none ring-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-4 focus-visible:ring-[#2f6fed]/26 ${
                            isActive
                              ? `${card.activeClassName} z-50 min-h-[230px] p-6 sm:min-h-[250px] sm:p-7`
                              : `${card.inactiveClassName} -mt-2 min-h-[58px] px-5 py-4 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-38px_rgba(45,64,116,0.46)] sm:-mt-3`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] sm:text-sm">
                              {card.title}
                            </p>
                            {!isActive ? (
                              <span className="shrink-0 rounded-full bg-white/50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-75">
                                Tap
                              </span>
                            ) : null}
                          </div>
                          {isActive ? (
                            <div className="insight-active-content">
                              {card.content}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {socialMirror ? (
                    <div className="space-y-3 rounded-[1.55rem] bg-[#fffdf8]/75 p-4 shadow-sm ring-1 ring-slate-950/[0.04] sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Share the interpretation
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            No original text included. Just the communication
                            insight.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                          <button
                            type="button"
                            aria-label="Copy this analysis"
                            onClick={handleCopyAnalysis}
                            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#eaf0ff] px-5 py-2.5 text-sm font-semibold text-[#2f4c86] shadow-[0_16px_36px_-30px_rgba(47,111,237,0.6)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#dfe8ff] hover:text-[#17346f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f6fed]/16"
                          >
                            {analysisCopied ? "Copied" : "Copy this analysis"}
                          </button>
                          <button
                            type="button"
                            aria-label="Download share card"
                            onClick={handleDownloadShareCard}
                            disabled={isDownloadingShareCard}
                            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_44px_-32px_rgba(15,23,42,0.7)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-950/20 disabled:cursor-wait disabled:bg-slate-500 disabled:shadow-none"
                          >
                            {isDownloadingShareCard
                              ? "Making the card..."
                              : "Download share card"}
                          </button>
                          <button
                            type="button"
                            aria-label={
                              showSharePreview
                                ? "Hide share card preview"
                                : "Preview share card"
                            }
                            onClick={handleToggleSharePreview}
                            aria-expanded={showSharePreview}
                            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#fffefa] px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-950/[0.08] transition duration-200 ease-out hover:-translate-y-0.5 hover:text-slate-950 hover:ring-[#2f6fed]/24 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f6fed]/12"
                          >
                            {showSharePreview
                              ? "Hide share card"
                              : "Preview share card"}
                          </button>
                        </div>
                      </div>

                      <div
                        aria-hidden="true"
                        className="pointer-events-none fixed left-[-10000px] top-0 w-[720px]"
                      >
                        <ShareCard
                          result={result}
                          socialMirror={socialMirror}
                          cardRef={shareCardRef}
                        />
                      </div>

                      {showSharePreview ? (
                        <div className="rounded-[1.35rem] bg-[#f6f3eb] p-3 ring-1 ring-slate-950/[0.04] sm:p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Share card preview
                          </p>
                          <ShareCard
                            result={result}
                            socialMirror={socialMirror}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {!showRewrite ? (
                    <div className="relative overflow-hidden rounded-[1.45rem] bg-[#fffefa]/86 p-4 shadow-[0_18px_52px_-46px_rgba(45,64,116,0.42)] ring-1 ring-[#7185bd]/16 sm:p-5">
                      <div
                        aria-hidden="true"
                        className="space-y-2.5 blur-[3px] transition duration-500"
                      >
                        <div className="h-3.5 w-24 rounded-full bg-slate-300/70" />
                        <div className="h-4 w-[92%] rounded-full bg-slate-300/60" />
                        <div className="h-4 w-[78%] rounded-full bg-slate-300/55" />
                        <div className="h-4 w-[64%] rounded-full bg-slate-300/50" />
                      </div>
                      <p id="rewrite-preview-label" className="sr-only">
                        A clearer rewrite is available. Activate the button to reveal it.
                      </p>
                      <button
                        type="button"
                        aria-label="Show me a clearer version"
                        aria-describedby="rewrite-preview-label"
                        onClick={handleRevealRewrite}
                        disabled={isRevealingRewrite}
                        className="absolute inset-x-4 top-1/2 inline-flex min-h-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-[#2f6fed] px-7 py-3 text-base font-semibold text-white shadow-[0_18px_44px_-30px_rgba(47,111,237,0.82)] outline-none transition duration-300 ease-out hover:-translate-y-[52%] hover:bg-[#245bd1] active:-translate-y-1/2 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[#2f6fed]/20 disabled:cursor-wait disabled:bg-[#2a63d5] motion-reduce:transition-none sm:left-1/2 sm:right-auto sm:w-auto sm:min-w-[17rem] sm:-translate-x-1/2"
                      >
                        {isRevealingRewrite ? (
                          <span className="inline-flex items-center justify-center gap-2 text-center leading-snug">
                            Making this clearer
                            <span className="inline-flex gap-1" aria-hidden="true">
                              <span className="rewrite-loading-dot" />
                              <span className="rewrite-loading-dot [animation-delay:140ms]" />
                              <span className="rewrite-loading-dot [animation-delay:280ms]" />
                            </span>
                          </span>
                        ) : (
                          "Show me a clearer version"
                        )}
                      </button>
                    </div>
                  ) : null}

                  <div
                    aria-hidden={!showRewrite}
                    className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      showRewrite
                        ? "max-h-[520px] translate-y-0 opacity-100 blur-0"
                        : "max-h-0 translate-y-5 opacity-0 blur-md"
                    }`}
                  >
                    <div className="rounded-[1.45rem] bg-[#fffefa] p-5 text-slate-950 shadow-[0_20px_60px_-46px_rgba(45,64,116,0.45)] ring-1 ring-[#7185bd]/18 transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                        Send this instead
                      </p>
                      <p className="mt-4 text-base leading-7 text-slate-800 sm:text-lg sm:leading-8">
                        {result.improvedRewrite}
                      </p>
                      <button
                        type="button"
                        aria-label="Copy rewrite"
                        onClick={handleCopyRewrite}
                        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_-28px_rgba(15,23,42,0.7)] outline-none transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:ring-4 focus-visible:ring-slate-950/20"
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
                      Communication check
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#243149] sm:text-3xl">
                      No message interpreted yet.
                    </h3>
                    <p className="mt-4 text-base leading-7 text-[#64748b] sm:text-lg sm:leading-8">
                      Paste a message to understand its impact. The rewrite stays locked
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
