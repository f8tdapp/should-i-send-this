"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { captureBetweenLinesEvent } from "./lib/analytics";

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

const rotatingThoughts = [
  "Should I send this to my ex?",
  "Does this sound passive aggressive?",
  "Am I overexplaining?",
  "Why does this feel emotionally loaded?",
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
    "BetweenLines AI",
  ].join("\n");
}

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-[#172033] text-[#FFFDF8] shadow-[0_16px_38px_-28px_rgba(17,24,39,0.72)] ${className}`}
    >
      <span className="flex w-[1.15rem] flex-col gap-1">
        <span className="h-0.5 w-4 rounded-full bg-[#FFFDF8]" />
        <span className="ml-1.5 h-0.5 w-3.5 rounded-full bg-[#FFFDF8]/88" />
        <span className="h-0.5 w-2.5 rounded-full bg-[#FFFDF8]/72" />
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#FFFDF8] bg-[#64748B]"
      />
    </div>
  );
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
      className="relative overflow-hidden rounded-[1.75rem] bg-[#FFFDF8] p-6 text-[#111827] shadow-[0_22px_70px_-54px_rgba(17,24,39,0.38)] ring-1 ring-[#D8D2C7] sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,225,214,0.55),transparent_34%),linear-gradient(145deg,rgba(248,244,236,0.72),rgba(239,232,221,0.58)_58%,rgba(255,255,255,0.7))]"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-start gap-3">
            <BrandMark className="h-9 w-9" />
            <div>
              <p className="text-[1.02rem] font-black leading-none tracking-[-0.035em]">
                BetweenLines<span className="text-[#64748B]"> AI</span>
              </p>
              <p className="mt-1 text-[0.68rem] font-medium leading-tight text-[#6B7280]">
                Communication intelligence designed to create clarity, not chaos.
              </p>
            </div>
          </div>
          <div className="max-w-[12rem] rounded-full bg-[#172033] px-3 py-1.5 text-right text-xs font-semibold leading-tight text-[#FFFFFF] shadow-[0_18px_45px_-34px_rgba(17,24,39,0.78)]">
            {socialMirror.severity}
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <div className="rounded-[1.35rem] bg-[#E9D8A6] p-5 ring-1 ring-[#9CA3AF]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#334155]">
              BETWEEN THE LINES
            </p>
            <p className="mt-3 text-[1.05rem] font-semibold leading-[1.38] tracking-tight">
              {result.emotionalInterpretation}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#F8F4EC] p-5 ring-1 ring-[#D8D2C7]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              COMMUNICATION INTELLIGENCE
            </p>
            <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-[#334155]">
              {result.communicationIntelligenceScore}
              <span className="text-base text-[#64748B]">/100</span>
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#EFE8DD] p-5 ring-1 ring-[#D8D2C7]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              PERCEPTION GAP
            </p>
            <p className="mt-3 text-[1rem] font-semibold leading-[1.38] tracking-tight text-[#334155]">
              {result.perceptionGap}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#FFFDF8] p-5 ring-1 ring-[#D8D2C7]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              INTENT VS IMPACT
            </p>
            <div className="mt-3 grid gap-3 text-[#111827] sm:grid-cols-2">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#64748B]">
                  You meant
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold leading-[1.36] tracking-tight">
                  {result.intentVsImpact.youMeant}
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#64748B]">
                  They may hear
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold leading-[1.36] tracking-tight">
                  {result.intentVsImpact.theyMayHear}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-[#E9D8A6] p-5 ring-1 ring-[#C7BDAF]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#334155]">
              MOST REVEALING LINE
            </p>
            <p className="mt-3 text-[1.02rem] font-semibold leading-[1.35] tracking-tight text-[#111827]">
              &ldquo;{result.mostRevealingLine.quote}&rdquo;
            </p>
            <p className="mt-2 text-[0.92rem] font-medium leading-[1.45] text-[#334155]">
              {result.mostRevealingLine.explanation}
            </p>
          </div>
          <div className="rounded-[1.35rem] bg-[#EFE8DD] p-5 ring-1 ring-[#D8D2C7]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              HOW THIS MIGHT LAND
            </p>
            <p className="mt-3 text-[1.05rem] font-semibold leading-[1.38] tracking-tight text-[#334155]">
              {result.recipientLikelyPerception}
            </p>
          </div>
        </div>

        <p className="mt-6 text-right text-xs font-semibold tracking-[0.12em] text-[#6B7280]">
          BetweenLines AI
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
  const [viewedInsightCardIds, setViewedInsightCardIds] = useState<
    InsightCardId[]
  >([]);
  const [thoughtIndex, setThoughtIndex] = useState(0);
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

  const resetAnalysisUiState = ({
    clearResult = true,
    viewedInsightCards = [],
  }: {
    clearResult?: boolean;
    viewedInsightCards?: InsightCardId[];
  } = {}) => {
    if (clearResult) {
      setResult(null);
      setSocialMirror(null);
    }

    setError("");
    setRewriteCopied(false);
    setAnalysisCopied(false);
    setShowSharePreview(false);
    setShowRewrite(false);
    setIsRevealingRewrite(false);
    setActiveInsightCardId("communication");
    setViewedInsightCardIds(viewedInsightCards);
  };

  const handleAnalyze = async () => {
    if (isLoading) return;

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    resetAnalysisUiState();

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
      resetAnalysisUiState({
        clearResult: false,
        viewedInsightCards: ["communication"],
      });
      captureBetweenLinesEvent("text_analyzed", {
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
    resetAnalysisUiState();

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

  const handleOpenInsightCard = (cardId: InsightCardId) => {
    setActiveInsightCardId(cardId);
    setViewedInsightCardIds((currentCardIds) =>
      currentCardIds.includes(cardId)
        ? currentCardIds
        : [...currentCardIds, cardId],
    );
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
      captureBetweenLinesEvent("rewrite_revealed", rewriteEventProperties);
      return;
    }

    setIsRevealingRewrite(true);
    revealTimeoutRef.current = setTimeout(() => {
      setShowRewrite(true);
      setIsRevealingRewrite(false);
      revealTimeoutRef.current = null;
      captureBetweenLinesEvent("rewrite_revealed", rewriteEventProperties);
    }, 650);
  };

  const handleCopyRewrite = async () => {
    if (!result?.improvedRewrite) return;

    try {
      await navigator.clipboard.writeText(result.improvedRewrite);
      setRewriteCopied(true);
      captureBetweenLinesEvent("rewrite_copied", {
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
      captureBetweenLinesEvent("result_copied", {
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
      link.download = "betweenlines-ai-read.png";
      link.href = dataUrl;
      link.click();
      captureBetweenLinesEvent("share_card_downloaded", {
        ...getSafeAnalyticsProperties(message, socialMirror.severity),
      });
    } catch (error) {
      console.error("Share card download failed.", error);
      setError(
        "The share card refused to become a PNG. Very dramatic. Try again.",
      );
      captureBetweenLinesEvent("share_card_download_failed", {
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
      captureBetweenLinesEvent("share_card_preview_opened", {
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

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let thoughtTimer: ReturnType<typeof setInterval> | null = null;

    const syncThoughtRotation = () => {
      if (thoughtTimer) {
        clearInterval(thoughtTimer);
        thoughtTimer = null;
      }

      if (!reducedMotionQuery.matches) {
        thoughtTimer = setInterval(() => {
          setThoughtIndex((currentIndex) =>
            (currentIndex + 1) % rotatingThoughts.length,
          );
        }, 3600);
      }
    };

    syncThoughtRotation();
    reducedMotionQuery.addEventListener("change", syncThoughtRotation);

    return () => {
      if (thoughtTimer) {
        clearInterval(thoughtTimer);
      }

      reducedMotionQuery.removeEventListener("change", syncThoughtRotation);
    };
  }, []);

  const loadingMessage = loadingMessages[message.length % loadingMessages.length];
  const currentThought = rotatingThoughts[thoughtIndex];
  const insightCards = result
    ? [
        {
          id: "communication" as const,
          title: "Between the Lines",
          activeClassName:
            "bg-[#172033] text-[#FFFFFF] ring-[#9CA3AF] shadow-[0_34px_88px_-46px_rgba(17,24,39,0.68)]",
          inactiveClassName:
            "bg-[#FFFDF8] text-[#334155] ring-[#D8D2C7] shadow-[0_14px_32px_-28px_rgba(17,24,39,0.24)]",
          content: (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-[39rem] text-[1.24rem] font-semibold leading-[1.36] tracking-tight sm:text-[1.48rem] sm:leading-[1.32]">
                {result.emotionalInterpretation}
              </p>
              <div className="w-fit shrink-0 rounded-2xl bg-[#FFFDF8] px-3.5 py-2.5 text-[#334155] ring-1 ring-[#C7BDAF] sm:text-right">
                <p className="text-xs font-semibold leading-4 tracking-normal text-[#64748B]">
                  Intelligence
                </p>
                <p className="mt-1 text-2xl font-semibold leading-none tracking-tight">
                  {result.communicationIntelligenceScore}
                  <span className="text-sm text-[#64748B]">/100</span>
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "landing" as const,
          title: "How This Might Land",
          activeClassName:
            "bg-[#FFF8EF] text-[#111827] ring-[#D8CDBE] shadow-[0_24px_58px_-42px_rgba(92,72,47,0.32)]",
          inactiveClassName:
            "bg-[#FAF4EA] text-[#334155] ring-[#D8CDBE] shadow-[0_12px_30px_-28px_rgba(92,72,47,0.2)]",
          content: (
            <p className="mt-3 max-w-[39rem] text-base font-medium leading-7 tracking-normal text-[#374151] sm:text-[1.06rem]">
              {result.recipientLikelyPerception}
            </p>
          ),
        },
        {
          id: "perception" as const,
          title: "Perception Gap",
          activeClassName:
            "bg-[#FFF8EF] text-[#111827] ring-[#D8CDBE] shadow-[0_24px_58px_-42px_rgba(92,72,47,0.32)]",
          inactiveClassName:
            "bg-[#FAF4EA] text-[#334155] ring-[#D8CDBE] shadow-[0_12px_30px_-28px_rgba(92,72,47,0.2)]",
          content: (
            <p className="mt-3 max-w-[39rem] text-sm font-medium leading-6 tracking-normal text-[#374151] sm:text-base">
              {result.perceptionGap}
            </p>
          ),
        },
        {
          id: "intent" as const,
          title: "Intent vs Impact",
          activeClassName:
            "bg-[#FFF8EF] text-[#111827] ring-[#D8CDBE] shadow-[0_24px_58px_-42px_rgba(92,72,47,0.32)]",
          inactiveClassName:
            "bg-[#FAF4EA] text-[#334155] ring-[#D8CDBE] shadow-[0_12px_30px_-28px_rgba(92,72,47,0.2)]",
          content: (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold leading-5 tracking-normal text-[#334155]">
                  You Meant
                </p>
                <p className="mt-1.5 max-w-[39rem] text-sm font-medium leading-6 tracking-normal text-[#374151] sm:text-base">
                  {result.intentVsImpact.youMeant}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold leading-5 tracking-normal text-[#334155]">
                  They May Hear
                </p>
                <p className="mt-1.5 max-w-[39rem] text-sm font-medium leading-6 tracking-normal text-[#374151] sm:text-base">
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
            "bg-[#FFF8EF] text-[#111827] ring-[#D8CDBE] shadow-[0_24px_58px_-42px_rgba(92,72,47,0.32)]",
          inactiveClassName:
            "bg-[#FAF4EA] text-[#334155] ring-[#D8CDBE] shadow-[0_12px_30px_-28px_rgba(92,72,47,0.2)]",
          content: (
            <div className="mt-3 max-w-[39rem] space-y-3">
              <div className="rounded-[1.05rem] bg-[#F3E8D6] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-[#D8CDBE]">
                <p className="text-base font-semibold leading-7 tracking-normal text-[#111827] sm:text-[1.05rem]">
                  &ldquo;{result.mostRevealingLine.quote}&rdquo;
                </p>
              </div>
              <p className="text-sm font-medium leading-6 text-[#374151] sm:text-base">
                {result.mostRevealingLine.explanation}
              </p>
            </div>
          ),
        },
        ...(socialMirror
          ? [
              {
                id: "subtext" as const,
                title: "Hidden Subtext",
                activeClassName:
                  "bg-[#FFF8EF] text-[#111827] ring-[#D8CDBE] shadow-[0_24px_58px_-42px_rgba(92,72,47,0.32)]",
                inactiveClassName:
                  "bg-[#FAF4EA] text-[#334155] ring-[#D8CDBE] shadow-[0_12px_30px_-28px_rgba(92,72,47,0.2)]",
                content: (
                  <p className="mt-3 max-w-[39rem] text-sm font-medium leading-6 tracking-normal text-[#374151] sm:text-base">
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
    <div className="relative min-h-screen overflow-hidden bg-[#2B3042] text-[#111827] font-sans antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#2B3042]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,253,248,0.22),rgba(232,225,214,0.12)_42%,#2B3042_78%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(180deg,rgba(43,48,66,0)_0%,rgba(23,32,51,0.34)_100%)]" />
        <div className="absolute left-1/2 top-[45%] h-[38rem] w-[min(86vw,54rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,253,248,0.18),rgba(232,225,214,0.09)_48%,rgba(43,48,66,0)_74%)] blur-2xl" />
        <div className="absolute left-1/2 top-[50%] h-[18rem] w-[min(62vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,241,234,0.12),rgba(232,225,214,0.06)_56%,rgba(43,48,66,0)_78%)] blur-xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-[60rem] flex-col justify-center px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
        <div className="app-card-enter rounded-[1.85rem] bg-[#FFFDF8] p-5 shadow-[0_46px_136px_-50px_rgba(17,24,39,0.74),0_0_88px_-44px_rgba(255,253,248,0.35)] ring-1 ring-[#C7BDAF] backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_50px_142px_-50px_rgba(17,24,39,0.78),0_0_92px_-44px_rgba(255,253,248,0.38)] sm:p-8 lg:p-10">
          <div className="mx-auto inline-flex max-w-full items-start gap-3.5 text-left sm:mx-0">
            <BrandMark className="mt-0.5 h-10 w-10" />
            <div className="min-w-0">
              <p className="text-[1.16rem] font-black leading-none tracking-[-0.03em] text-[#111827] sm:text-[1.32rem]">
                BetweenLines<span className="text-[#64748B]"> AI</span>
              </p>
              <p className="mt-1.5 max-w-[22rem] text-[0.76rem] font-medium leading-[1.4] text-[#374151] [text-wrap:balance] sm:max-w-[34rem] sm:text-[0.88rem]">
                Communication intelligence designed to create clarity, not chaos.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-[34rem] text-center sm:mx-0 sm:mt-7 sm:max-w-[42rem] sm:text-left lg:max-w-[44rem]">
            <h1 className="max-w-full text-[clamp(1.84rem,7.8vw,2.32rem)] font-semibold leading-[1.12] tracking-tight text-[#111827] [overflow-wrap:break-word] [text-wrap:balance] sm:text-[clamp(2.08rem,4vw,2.48rem)] sm:leading-[1.1]">
              See the gap between what you mean and what others may hear.
            </h1>
          </div>

          <div className="mt-5 space-y-4 sm:mt-5 sm:space-y-[1.125rem]">
            <label htmlFor="message" className="sr-only">
              Message input
            </label>
            <div className="mx-auto max-w-[42rem] border-y border-[#D8D2C7] px-3 py-2 text-center">
              <p className="text-[0.82rem] font-semibold leading-5 text-[#374151]">
                Remove the uncertainty before you hit send.
              </p>
              <div className="mt-2 min-h-[1.7rem] overflow-hidden text-center">
                <p
                  key={currentThought}
                  className="thought-line-enter text-[0.96rem] font-medium italic leading-6 text-[#334155] [text-wrap:balance] sm:text-[1.04rem]"
                >
                  &ldquo;{currentThought}&rdquo;
                </p>
              </div>
            </div>
            <div className="rounded-[1.85rem] bg-[#F8F4EC] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_22px_58px_-48px_rgba(17,24,39,0.42)] ring-1 ring-[#C7BDAF] sm:p-3">
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
                className="w-full min-h-[205px] rounded-[1.45rem] border border-[#BFB3A3] bg-[#FFFFFF] px-5 py-[1.125rem] text-base leading-7 text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_20px_44px_-36px_rgba(191,179,163,0.58),0_12px_34px_-30px_rgba(17,24,39,0.38)] placeholder:text-[#6B7280] outline-none transition duration-300 ease-out hover:border-[#C7BDAF] hover:bg-[#FFFDF8] focus:border-[#334155] focus:bg-[#FFFFFF] focus:ring-4 focus:ring-[#334155]/16 sm:min-h-[230px] sm:px-7 sm:py-5 sm:text-[1.04rem]"
              />
              <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-[#F1F5F9] px-4 py-2 text-sm font-semibold text-[#334155] shadow-sm ring-1 ring-[#D8D2C7]">
                  <span aria-hidden="true">&#128274;</span>
                  <span>We don&apos;t store or save your messages.</span>
                </div>
                <div className="flex items-center justify-end gap-3 px-1 text-xs font-medium text-[#6B7280]">
                  {isAtCharacterLimit ? (
                    <span className="text-[#334155]">
                      That&apos;s enough text for one interpretation.
                    </span>
                  ) : null}
                  <span
                    className={`tabular-nums transition-colors ${
                      isAtCharacterLimit
                        ? "font-semibold text-[#334155]"
                        : isNearCharacterLimit
                          ? "font-semibold text-[#64748B]"
                          : "text-[#6B7280]"
                    }`}
                  >
                    {messageLength} / {MESSAGE_CHARACTER_LIMIT}
                  </span>
                </div>
              </div>
            </div>

            {error ? (
              <p className="rounded-3xl border border-[#D8D2C7] bg-[#FFFDF8] px-5 py-4 text-sm font-medium text-[#334155] shadow-sm">
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
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#F1F5F9] px-6 py-3 text-base font-semibold text-[#334155] shadow-[0_14px_30px_-28px_rgba(17,24,39,0.3)] ring-1 ring-[#D8D2C7] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#EFE8DD] hover:text-[#172033] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#64748B]/18 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Clear text
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Interpret my message"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-3 rounded-full bg-[#172033] px-8 py-3.5 text-base font-semibold text-[#FFFFFF] shadow-[0_18px_48px_-30px_rgba(17,24,39,0.52)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#111827] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#334155]/24 disabled:cursor-not-allowed disabled:bg-[#64748B] disabled:shadow-none"
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

          <section className="mt-7 rounded-[1.65rem] bg-[#FFFDF8] p-4 shadow-[0_24px_70px_-52px_rgba(17,24,39,0.4)] ring-1 ring-[#D8D2C7] sm:mt-9 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[1.02rem] font-semibold leading-6 tracking-normal text-[#172033]">
                  Between the Lines
                </p>
              </div>
            </div>

            <div
              className="mt-3 space-y-3.5 transition-all duration-500 ease-out sm:mt-3.5 sm:space-y-4"
            >
              {isLoading ? (
                <div className="rounded-[1.35rem] bg-[#FFFFFF] px-5 py-6 shadow-[0_16px_44px_-36px_rgba(17,24,39,0.32)] ring-1 ring-[#D8D2C7]">
                  <div className="inline-flex items-center gap-3 text-sm font-semibold leading-6 text-[#334155]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#64748B]/25 border-t-[#64748B]" />
                    {loadingMessage}
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#6B7280]">
                    BetweenLines AI is reading the communication impact. Privately. Carefully.
                    Usefully.
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-2.5">
                    {socialMirror ? (
                      <div className="inline-flex max-w-full rounded-full bg-[#172033] px-2.5 py-0.5 text-[0.68rem] font-semibold text-[#FFFFFF] shadow-[0_10px_24px_-22px_rgba(17,24,39,0.42)]">
                        <span className="truncate">
                          {socialMirror.severity}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-1.5 text-[0.72rem] font-semibold text-[#6B7280]">
                      <span className="rounded-full bg-[#F8F4EC] px-2.5 py-1 ring-1 ring-[#E5DED3]">
                        Signal: <span className="text-[#334155]">{result.tone}</span>
                      </span>
                      <span className="rounded-full bg-[#F8F4EC] px-2.5 py-1 ring-1 ring-[#E5DED3]">
                        Confidence signal:{" "}
                        <span className="text-[#334155]">
                          {result.confidenceScore}/10
                        </span>
                      </span>
                      <span className="rounded-full bg-[#F8F4EC] px-2.5 py-1 ring-1 ring-[#E5DED3]">
                        Clarity:{" "}
                        <span className="text-[#334155]">
                          {result.clarityScore}/10
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    className="guided-read-deck rounded-[1.9rem] bg-[#EFE7DA] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-18px_34px_-30px_rgba(92,72,47,0.34),0_20px_54px_-46px_rgba(17,24,39,0.34)] ring-1 ring-[#D8CDBE] sm:p-3"
                    aria-label="Communication insight deck"
                  >
                    {visibleInsightCards.map((card, index) => {
                      const isActive = card.id === activeInsightCardId;
                      const hasBeenViewed = viewedInsightCardIds.includes(card.id);
                      const isHeroCard = card.id === "communication";

                      return (
                        <button
                          key={card.id}
                          type="button"
                          aria-label={
                            isActive
                              ? `${card.title} insight currently selected`
                              : hasBeenViewed
                                ? `Show ${card.title} insight, already read`
                                : `Show ${card.title} insight, unread`
                          }
                          aria-current={isActive ? "true" : undefined}
                          aria-expanded={isActive}
                          onClick={() => handleOpenInsightCard(card.id)}
                          style={{ zIndex: isActive ? 50 : 40 - index }}
                          className={`guided-read-card insight-deck-card result-card-enter relative block w-full rounded-[1.45rem] border-0 text-left outline-none ring-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-4 focus-visible:ring-[#64748B]/24 ${
                            isActive
                              ? `${card.activeClassName} z-50 ${isHeroCard ? "min-h-[250px] p-6 sm:min-h-[292px] sm:p-8" : "min-h-[136px] p-5 sm:min-h-[152px] sm:p-6"}`
                              : `${card.inactiveClassName} -mt-2 min-h-[60px] px-5 py-3.5 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-36px_rgba(17,24,39,0.28)] sm:-mt-3 sm:min-h-[64px] sm:px-6 ${
                                  hasBeenViewed
                                    ? "bg-[#FFF8EF] ring-[#C7BDAF] shadow-[0_12px_30px_-28px_rgba(92,72,47,0.18)]"
                                    : ""
                                }`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="inline-flex min-w-0 items-center gap-2 text-[0.84rem] font-semibold leading-5 tracking-normal sm:text-[0.95rem]">
                              {!isActive && hasBeenViewed ? (
                                <span
                                  aria-hidden="true"
                                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[0.62rem] font-bold leading-none text-[#64748B] ring-1 ring-[#D8D2C7]"
                                >
                                  &#10003;
                                </span>
                              ) : null}
                              <span className="truncate">
                                {card.title}
                              </span>
                            </p>
                            {!isActive ? (
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-normal opacity-90 ring-1 ${
                                  hasBeenViewed
                                    ? "bg-[#F1F5F9] text-[#64748B] ring-[#D8D2C7]"
                                    : "bg-[#FFFFFF]/80 ring-[#D8D2C7]"
                                }`}
                              >
                                {hasBeenViewed ? "Read" : "Tap"}
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
                    <div className="space-y-2.5 rounded-[1.55rem] bg-[#FFFFFF] p-4 shadow-[0_14px_38px_-34px_rgba(17,24,39,0.24)] ring-1 ring-[#E5DED3] sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold leading-5 tracking-normal text-[#172033]">
                            Copy the Insight
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#374151]">
                            No original text included. Just the communication
                            insight.
                          </p>
                        </div>
                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                          <button
                            type="button"
                            aria-label="Copy this analysis"
                            onClick={handleCopyAnalysis}
                            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#F1F5F9] px-5 py-2.5 text-sm font-semibold text-[#334155] shadow-[0_14px_30px_-28px_rgba(17,24,39,0.32)] ring-1 ring-[#D8D2C7] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#EFE8DD] hover:text-[#172033] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#64748B]/18"
                          >
                            {analysisCopied ? "Copied" : "Copy this analysis"}
                          </button>
                          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-semibold text-[#6B7280] sm:justify-end">
                            <button
                              type="button"
                              aria-label="Export insight"
                              onClick={handleDownloadShareCard}
                              disabled={isDownloadingShareCard}
                              className="inline-flex min-h-[32px] items-center justify-center rounded-full px-1.5 text-[#6B7280] transition duration-200 ease-out hover:text-[#334155] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#64748B]/12 disabled:cursor-wait disabled:text-[#9CA3AF]"
                            >
                              {isDownloadingShareCard
                                ? "Exporting..."
                                : "Export insight"}
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
                              className="inline-flex min-h-[32px] items-center justify-center rounded-full px-1.5 text-[#6B7280] transition duration-200 ease-out hover:text-[#334155] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#64748B]/12"
                            >
                              {showSharePreview
                                ? "Hide preview"
                                : "Preview share card"}
                            </button>
                          </div>
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
                        <div className="rounded-[1.35rem] bg-[#FFFDF8] p-3 ring-1 ring-[#E5DED3] sm:p-4">
                          <p className="mb-3 text-sm font-semibold leading-5 tracking-normal text-[#172033]">
                            Share Card Preview
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
                    <div className="relative overflow-hidden rounded-[1.45rem] bg-[#FFFFFF] p-4 shadow-[0_14px_40px_-36px_rgba(17,24,39,0.26)] ring-1 ring-[#E5DED3] sm:p-5">
                      <div
                        aria-hidden="true"
                        className="space-y-2.5 blur-[3px] transition duration-500"
                      >
                        <div className="h-3.5 w-24 rounded-full bg-[#D8D2C7]" />
                        <div className="h-4 w-[92%] rounded-full bg-[#E5DED3]" />
                        <div className="h-4 w-[78%] rounded-full bg-[#E5DED3]" />
                        <div className="h-4 w-[64%] rounded-full bg-[#E5DED3]" />
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
                        className="absolute inset-x-4 top-1/2 inline-flex min-h-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-[#334155] px-7 py-3 text-base font-semibold text-[#FFFFFF] shadow-[0_16px_38px_-30px_rgba(17,24,39,0.58)] outline-none transition duration-300 ease-out hover:-translate-y-[52%] hover:bg-[#172033] active:-translate-y-1/2 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[#64748B]/22 disabled:cursor-wait disabled:bg-[#64748B] motion-reduce:transition-none sm:left-1/2 sm:right-auto sm:w-auto sm:min-w-[17rem] sm:-translate-x-1/2"
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
                    <div className="rounded-[1.45rem] bg-[#FFF8EF] p-5 text-[#111827] shadow-[0_18px_52px_-40px_rgba(92,72,47,0.32)] ring-1 ring-[#D8CDBE] transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-[32rem]">
                          <p className="text-sm font-semibold leading-5 tracking-normal text-[#172033]">
                            A Clearer Version
                          </p>
                          <p className="mt-1.5 text-sm leading-6 text-[#6B7280]">
                            Use this as a starting point; edit it so it still sounds like you.
                          </p>
                        </div>
                        <span className="inline-flex w-fit shrink-0 rounded-full bg-[#F3E8D6] px-2.5 py-1 text-[0.68rem] font-semibold text-[#64748B] ring-1 ring-[#D8CDBE]">
                          Optional
                        </span>
                      </div>
                      <div className="mt-4 rounded-[1.15rem] bg-[#F3E8D6] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-[#D8CDBE] sm:px-5">
                        <p className="text-base font-medium leading-7 text-[#111827] sm:text-[1.06rem] sm:leading-8">
                          {result.improvedRewrite}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Copy clearer version"
                        onClick={handleCopyRewrite}
                        className="mt-5 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#172033] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-[0_14px_34px_-28px_rgba(17,24,39,0.62)] outline-none transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#334155] focus-visible:ring-4 focus-visible:ring-[#334155]/20"
                      >
                        {rewriteCopied ? "Copied" : "Copy clearer version"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-[1.45rem] bg-[#FFFFFF] px-5 py-5 shadow-[0_16px_46px_-42px_rgba(17,24,39,0.34)] ring-1 ring-[#E5DED3] sm:px-6 sm:py-6">
                  <div className="max-w-[34rem]">
                    <h3 className="text-lg font-semibold leading-7 tracking-tight text-[#111827] sm:text-xl">
                      Paste a message to see how it may land.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#374151] sm:text-base">
                      The clearer version stays private until you reveal it.
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
