const DEFAULT_API_BASE = "http://localhost:3000";

const WORK_MODES = {
  general: {
    relationshipContext: "professional recipient",
    desiredTone: "clear, respectful and appropriately direct",
    messageGoal:
      "communicate clearly without creating avoidable pressure or escalation",
  },
  property: {
    relationshipContext:
      "tenant, resident, landlord, contractor or property-management client",
    desiredTone: "clear, respectful, operationally precise, firm and non-presumptive",
    messageGoal:
      "Preserve the decision and facts. Avoid contradictory closings and assumed gratitude. Never invent a route, deadline, liability, promise or condition.",
  },
  complaints: {
    relationshipContext: "customer involved in a complaint or service issue",
    desiredTone: "clear, accountable, calm and appropriately empathetic",
    messageGoal:
      "Preserve the outcome. Check acknowledgement and reasoning. Never invent a review route, deadline, admission, promise or closure condition.",
  },
};

const RETRY_MESSAGE_GOALS = {
  paymentDispute:
    "Preserve the payment position. State the evidence gap and required correction neutrally. Add no legal conclusion, threat, deadline, promise or new condition.",
  tenantAccess:
    "Preserve the access request. Make charges conditional on policy. Replace vague escalation with a practical next step. Add no legal claim, deadline or promise.",
  complaint:
    "Preserve the confirmed outcome. Remove scolding and acknowledge the concern. Add no appeal, escalation route, deadline, promise or no-response claim.",
  default:
    "Preserve facts. Acknowledge inconvenience. Keep tentative timing tentative. Remove helpless wording. Add no route, deadline, guarantee, promise or condition.",
};

for (const messageGoal of [
  ...Object.values(WORK_MODES).map((mode) => mode.messageGoal),
  ...Object.values(RETRY_MESSAGE_GOALS),
]) {
  if (messageGoal.length > 160) {
    throw new Error("Extension messageGoal values must not exceed 160 characters.");
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type === "BETWEENLINES_ANALYZE") {
    analyzeMessage(request.message)
      .then((analysis) => sendResponse({ ok: true, analysis }))
      .catch((error) => sendResponse(createErrorResponse(error)));

    return true;
  }

  if (request?.type === "BETWEENLINES_FEEDBACK") {
    submitFeedback(request.feedback)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse(createErrorResponse(error)));

    return true;
  }

  return false;
});

function createErrorResponse(error) {
  return {
    ok: false,
    error:
      error instanceof Error
        ? error.message
        : "BetweenLines could not complete that request.",
  };
}

async function getApiBase() {
  const stored = await chrome.storage.local.get("betweenlinesApiBase");
  const configured = String(stored.betweenlinesApiBase || "").trim();
  return (configured || DEFAULT_API_BASE).replace(/\/$/, "");
}

async function getWorkMode() {
  const stored = await chrome.storage.local.get("betweenlinesWorkMode");
  const selected = String(stored.betweenlinesWorkMode || "general");
  const id = Object.hasOwn(WORK_MODES, selected) ? selected : "general";
  return { id, context: WORK_MODES[id] };
}

async function analyzeMessage(message, isSaferRetry = false) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new Error("Write a message before asking BetweenLines to check it.");
  }

  if (cleanMessage.length > 750) {
    throw new Error("This prototype currently checks messages up to 750 characters.");
  }

  const [apiBase, workMode] = await Promise.all([getApiBase(), getWorkMode()]);
  const isPaymentDispute =
    /\b(invoice|payment|paid|withhold)\b/i.test(cleanMessage) &&
    /\b(contractor|work|photograph|evidence|fix|correct)\b/i.test(cleanMessage);
  const isTenantAccessWarning = detectTenantAccessWarning(cleanMessage);
  const requestContext = isSaferRetry
    ? {
        ...workMode.context,
        messageGoal: isPaymentDispute
          ? RETRY_MESSAGE_GOALS.paymentDispute
          : isTenantAccessWarning
            ? RETRY_MESSAGE_GOALS.tenantAccess
            : workMode.id === "complaints"
              ? RETRY_MESSAGE_GOALS.complaint
              : RETRY_MESSAGE_GOALS.default,
      }
    : workMode.context;
  const response = await fetch(`${apiBase}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: cleanMessage,
      ...requestContext,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data.error === "string"
        ? data.error
        : "BetweenLines could not check this message. Please try again.",
    );
  }

  if (!isValidAnalysis(data)) {
    throw new Error("BetweenLines returned an unexpected response.");
  }

  const enhanced = enhanceForWorkMode(data, workMode.id, cleanMessage);

  if (!isSaferRetry && enhanced.extensionContext.rewriteIntegrity.safe === false) {
    return analyzeMessage(cleanMessage, true);
  }

  if (isSaferRetry && enhanced.extensionContext.rewriteIntegrity.safe === false) {
    const fallbackRewrite = createConservativeFallback(
      cleanMessage,
      workMode.id,
    );

    if (fallbackRewrite) {
      return enhanceForWorkMode(
        { ...data, improvedRewrite: fallbackRewrite },
        workMode.id,
        cleanMessage,
      );
    }
  }

  return enhanced;
}

function createConservativeFallback(message, workMode) {
  if (workMode !== "property" && workMode !== "complaints") return null;

  if (workMode === "property" && detectTenantAccessWarning(message)) {
    return "Please ensure access to the property is available for the scheduled appointment. If access cannot be provided, please let us know before the appointment so that an alternative can be discussed. A missed-access charge may apply only where your agreement or the applicable policy allows it.";
  }

  if (workMode === "complaints" && detectConfirmedRefundOutcome(message)) {
    return "We understand that you remain concerned about the refund. The refund was processed correctly, and on that basis we consider this matter resolved.";
  }

  const sentences = String(message || "")
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences || sentences.length < 2) return null;

  const closurePattern =
    /(?:matter|case|complaint|issue).*(?:closed|concluded)|(?:closed|concluded).*(?:matter|case|complaint|issue)/i;
  const helplessPattern =
    /nothing (?:more|else) (?:i|we) can do|(?:i|we) (?:cannot|can't) do anything (?:more|else)/i;
  const containsClosure = sentences.some((sentence) =>
    closurePattern.test(sentence),
  );
  const containsHelplessWording = sentences.some((sentence) =>
    helplessPattern.test(sentence),
  );
  const factualSentences = sentences.filter(
    (sentence) =>
      !closurePattern.test(sentence) && !helplessPattern.test(sentence),
  );

  if (factualSentences.length === 0) {
    return null;
  }

  if (containsHelplessWording) {
    return `I understand the continued delay may be frustrating. ${factualSentences.join(" ")}`;
  }

  if (containsClosure) {
    return `${factualSentences.join(" ")} We recognise this decision may be disappointing. Based on these circumstances, our decision remains unchanged.`;
  }

  return null;
}

function enhanceForWorkMode(analysis, workMode, originalMessage) {
  const effectiveRisk = inferEffectiveRisk(analysis, originalMessage, workMode);
  const modelGuidance = analysis.classification.rewriteStrategy;
  const completeComplaintFacts =
    effectiveRisk === "low" && workMode === "complaints"
      ? getCompleteComplaintFacts(originalMessage)
      : null;
  let operationalGuidance = modelGuidance;
  let perceptionGap = analysis.perceptionGap;
  let theyMayHear = analysis.intentVsImpact.theyMayHear;

  const isContractorDispute =
    /\b(invoice|payment|paid|withhold)\b/i.test(originalMessage) &&
    /\b(contractor|work|photograph|evidence|fix|correct)\b/i.test(
      originalMessage,
    );
  const isMaintenanceUpdate =
    !isContractorDispute &&
    /\b(repair|maintenance|contractor|engineer|appointment)\b/i.test(
      originalMessage,
    ) &&
    /\b(delay|delayed|attend|attendance|waiting|tomorrow|completed)\b/i.test(
      originalMessage,
    );
  const isTenantAccessWarning =
    workMode === "property" && detectTenantAccessWarning(originalMessage);

  if (completeComplaintFacts) {
    const { date, timeframe } = completeComplaintFacts;
    const timeframeLabel = timeframe
      .replace(/\s+/g, "-")
      .replace(/-days?$/i, "-day");
    perceptionGap = `The message acknowledges the frustration, confirms that the refund was processed on ${date}, explains the ${timeframeLabel} timeframe, and gives a clear follow-up step.`;
    theyMayHear = `The refund was processed on ${date}, it should appear within ${timeframe}, and they should let you know if it does not.`;
    operationalGuidance =
      "This message is clear and supportive and can be sent as written or minimally polished.";
  } else if (effectiveRisk !== "low" && isTenantAccessWarning) {
    operationalGuidance =
      "State when and why access is needed, explain how the resident can flag an access problem, make any charge conditional on the relevant agreement or policy, and replace vague references to further action with a specific supported consequence or omit them.";
  } else if (
    effectiveRisk !== "low" &&
    workMode === "property" &&
    isContractorDispute
  ) {
    operationalGuidance =
      "Preserve the payment position, state the evidence gap and required correction neutrally, and avoid legal conclusions, threats or new contractual conditions.";
  } else if (
    effectiveRisk !== "low" &&
    workMode === "property" &&
    isMaintenanceUpdate
  ) {
    operationalGuidance =
      "Acknowledge the inconvenience, state the current repair position, keep contractor timing tentative, and remove helpless wording without adding a new promise.";
  } else if (effectiveRisk !== "low" && workMode === "property") {
    operationalGuidance =
      "Keep the decision unchanged. Acknowledge the concern and state the factual basis. Mention a review route only if one actually exists; otherwise close politely without inviting further discussion.";
  } else if (effectiveRisk !== "low" && workMode === "complaints") {
    operationalGuidance =
      "Keep the outcome unchanged. Acknowledge the concern and explain the basis. Mention a review route only if one actually exists; do not invent a next step or promise.";
  }

  return {
    ...analysis,
    perceptionGap,
    intentVsImpact: {
      ...analysis.intentVsImpact,
      theyMayHear,
    },
    extensionContext: {
      workMode,
      effectiveRisk,
      operationalGuidance,
      rewriteIntegrity: assessRewriteIntegrity(
        originalMessage,
        analysis.improvedRewrite,
        effectiveRisk !== "low" &&
          (isMaintenanceUpdate ||
            /\b(?:matter|case|complaint|issue)\b.*\b(?:closed|concluded)\b/i.test(
              originalMessage,
            ) ||
            workMode === "complaints"),
        isTenantAccessWarning,
        workMode === "complaints",
      ),
    },
  };
}

function assessRewriteIntegrity(
  originalMessage,
  rewrite,
  requiresAcknowledgement = false,
  isTenantAccessWarning = false,
  isComplaintCalibration = false,
) {
  const original = String(originalMessage || "").toLowerCase();
  const alternative = String(rewrite || "").toLowerCase();
  const proceduralPatterns = [
    /if (?:we|i) (?:do not|don't) hear/,
    /unless (?:we|i) hear/,
    /will (?:then )?consider (?:this|the) matter closed/,
    /(?:within|by) \d+ (?:business )?days?/,
  ];

  const introducedProcedure = proceduralPatterns.some(
    (pattern) => pattern.test(alternative) && !pattern.test(original),
  );
  const introducesUpdatePromise =
    /(?:i|we)(?:'ll| will) keep you (?:updated|informed)|(?:i|we) will update you/.test(
      alternative,
    ) &&
    !/(?:i|we)(?:'ll| will) keep you (?:updated|informed)|(?:i|we) will update you/.test(
      original,
    );
  const strengthensTentativeTiming =
    /\b(?:confirmed|guaranteed)(?: that)? (?:they|he|she|it|the contractor) will\b|\bwill definitely\b/.test(
      alternative,
    ) &&
    !/\b(?:confirmed|guaranteed)(?: that)? (?:they|he|she|it|the contractor) will\b|\bwill definitely\b/.test(
      original,
    );

  const usesAssumedGratitude =
    /(?:we appreciate|thank you for) your understanding/.test(alternative) &&
    !/(?:we appreciate|thank you for) your understanding/.test(original);
  const declaresClosure =
    /(?:matter|case|complaint|issue)(?: is| is now| remains| as| considered)? closed/.test(
      alternative,
    ) ||
    /consider (?:this|the) (?:matter|case|complaint|issue) closed/.test(
      alternative,
    );
  const invitesFurtherDiscussion =
    /(?:any|further) questions|please (?:contact|let (?:us|me) know)|get in touch/.test(
      alternative,
    );
  const contradictoryClosure = declaresClosure && invitesFurtherDiscussion;
  const includesNeutralAcknowledgement =
    /(?:i|we) (?:understand|recognise|recognize|acknowledge)|may be disappointing/.test(
      alternative,
    );
  const usesVagueFurtherAction =
    /\b(?:further|appropriate|additional)(?: (?:necessary|appropriate))? (?:action|steps?|measures?)\b|\bnext steps? (?:will|may) be taken\b/.test(
      alternative,
    );
  const mentionsAccessCharge =
    isTenantAccessWarning && /\b(?:charges?|fees?)\b/.test(alternative);
  const makesChargeApplicabilityConditional =
    /\b(?:charges?|fees?)\b[^.!?]*\b(?:may|might|could) apply only (?:if|when|where)\b/.test(
      alternative,
    ) ||
    /\b(?:charges?|fees?)\b[^.!?]*\b(?:only if|only when|only where|subject to|in accordance with)\b/.test(
      alternative,
    );
  const makesAccessChargeUnconditional =
    mentionsAccessCharge && !makesChargeApplicabilityConditional;
  const givesAccessSpecificGuidance =
    /\b(?:access|entry)\b/.test(alternative) &&
    /\b(?:appointment|contractor|engineer|property|premises|home|contact|tell|let (?:us|me) know)\b/.test(
      alternative,
    );
  const retainsScoldingRepetition =
    isComplaintCalibration &&
    /\b(?:already (?:been )?explained|explained (?:this )?(?:several|multiple|many) times)\b/.test(
      alternative,
    );
  const includesComplaintAcknowledgement =
    /\b(?:we|i) (?:(?:understand|recognise|recognize|acknowledge)(?: that)? (?:you remain concerned|your (?:continued )?(?:concern|concerns|frustration|disappointment))|understand why)\b/.test(
      alternative,
    );
  const invitesIrrelevantQuestions =
    isComplaintCalibration &&
    /\bquestions? (?:that (?:are|may be) )?(?:unrelated|not related) to (?:this|the|your) refund\b/.test(
      alternative,
    );
  const confirmedRefundOutcome = detectConfirmedRefundOutcome(original);
  const preservesConfirmedRefundOutcome =
    detectConfirmedRefundOutcome(alternative);
  const introducesComplaintRoute =
    isComplaintCalibration &&
    /\b(?:appeal|escalat(?:e|ion)|ombudsman|review (?:team|department|manager))\b/.test(
      alternative,
    ) &&
    !/\b(?:appeal|escalat(?:e|ion)|ombudsman|review (?:team|department|manager))\b/.test(
      original,
    );
  const introducesRefundPromise =
    isComplaintCalibration &&
    /\b(?:(?:we|i) will (?:issue|process|send|provide) (?:the |your |a )?refund|(?:the |your )?refund will be (?:issued|processed|sent|provided))\b/.test(
      alternative,
    ) &&
    !/\b(?:(?:we|i) will (?:issue|process|send|provide) (?:the |your |a )?refund|(?:the |your )?refund will be (?:issued|processed|sent|provided))\b/.test(
      original,
    );
  const complaintDeadlinePattern =
    /\b(?:within \d+ (?:business )?(?:hours?|days?|weeks?)|by (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|close of business|end of (?:the )?(?:day|week)|\d{1,2}(?:st|nd|rd|th)?)|no later than)\b/;
  const introducesComplaintDeadline =
    isComplaintCalibration &&
    complaintDeadlinePattern.test(alternative) &&
    !complaintDeadlinePattern.test(original);
  const makesAbsoluteNoResponseCommitment =
    isComplaintCalibration &&
    /\b(?:we|i) (?:will not|won't|cannot|can't|are unable to|do not intend to) (?:respond|reply)|\bno further (?:response|reply) (?:will|can) be (?:provided|given|sent)\b/.test(
      alternative,
    );
  const originalComplaintTimeframes = isComplaintCalibration
    ? original.match(
        /\b(?:\d{1,2} (?:january|february|march|april|may|june|july|august|september|october|november|december)|(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+) (?:working|business) days?)\b/g,
      ) || []
    : [];
  const omitsComplaintTimeframe = originalComplaintTimeframes.some(
    (timeframe) => !alternative.includes(timeframe),
  );

  if (retainsScoldingRepetition) {
    return {
      safe: false,
      warning:
        "This alternative retains scolding repetition. State the confirmed outcome without referring to how often it was explained.",
    };
  }

  if (invitesIrrelevantQuestions) {
    return {
      safe: false,
      warning:
        "This alternative invites discussion unrelated to the refund. Omit that irrelevant invitation.",
    };
  }

  if (isComplaintCalibration && !includesComplaintAcknowledgement) {
    return {
      safe: false,
      warning:
        "This alternative does not neutrally acknowledge the customer's concern.",
    };
  }

  if (confirmedRefundOutcome && !preservesConfirmedRefundOutcome) {
    return {
      safe: false,
      warning:
        "This alternative does not preserve the confirmed refund outcome.",
    };
  }

  if (omitsComplaintTimeframe) {
    return {
      safe: false,
      warning:
        "This alternative omits a relevant date or timeframe from the original message.",
    };
  }

  if (
    introducesComplaintRoute ||
    introducesComplaintDeadline ||
    introducesRefundPromise
  ) {
    return {
      safe: false,
      warning:
        "This alternative invents a complaint route or refund promise that was not in the original message.",
    };
  }

  if (makesAbsoluteNoResponseCommitment) {
    return {
      safe: false,
      warning:
        "This alternative makes an absolute commitment not to respond further.",
    };
  }

  if (usesVagueFurtherAction) {
    return {
      safe: false,
      warning:
        "This alternative refers vaguely to further action. Name only a specific, supported consequence or omit that wording.",
    };
  }

  if (makesAccessChargeUnconditional) {
    return {
      safe: false,
      warning:
        "This alternative presents a missed-access charge as automatic. Make it conditional on the relevant agreement or policy.",
    };
  }

  if (isTenantAccessWarning && !givesAccessSpecificGuidance) {
    return {
      safe: false,
      warning:
        "This alternative does not explain what the resident should do if access cannot be provided.",
    };
  }

  if (introducedProcedure) {
    return {
      safe: false,
      warning:
        "This alternative introduces a new deadline or closure condition that was not in your draft. Review it manually rather than applying it unchanged.",
    };
  }

  if (strengthensTentativeTiming) {
    return {
      safe: false,
      warning:
        "This alternative turns tentative timing into a confirmation or guarantee that was not present in the original message.",
    };
  }

  if (introducesUpdatePromise) {
    return {
      safe: false,
      warning:
        "This alternative adds a promise to provide an update that was not made in the original message.",
    };
  }

  if (contradictoryClosure) {
    return {
      safe: false,
      warning:
        "This alternative says the matter is closed but also invites further discussion. Choose one clear procedural position before sending.",
    };
  }

  if (requiresAcknowledgement && !includesNeutralAcknowledgement) {
    return {
      safe: false,
      warning:
        "This alternative does not meaningfully improve how the decision may land because it lacks a neutral acknowledgement.",
    };
  }

  return usesAssumedGratitude
    ? {
        safe: false,
        warning:
          "This alternative assumes the recipient understands or agrees. Use a neutral acknowledgement instead.",
      }
    : { safe: true };
}

function detectTenantAccessWarning(message) {
  const value = String(message || "");
  const concernsPropertyAccess =
    /\b(?:access|entry|enter|gain access|let (?:us|the contractor|the engineer) in)\b/i.test(
      value,
    );
  const concernsVisit =
    /\b(?:appointment|visit|inspection|repair|maintenance|contractor|engineer|property|premises|flat|home)\b/i.test(
      value,
    );
  const isWarning =
    /\b(?:must|required|ensure|failure|fail|unable|cannot|can't|missed|charge|fee|further action|consequence)\b/i.test(
      value,
    );

  return concernsPropertyAccess && concernsVisit && isWarning;
}

function detectConfirmedRefundOutcome(message) {
  const value = String(message || "").toLowerCase();
  return (
    /\brefund\b[^.!?]{0,60}\b(?:was|has been) (?:processed|issued|completed|handled)(?: correctly)?\b/.test(
      value,
    ) ||
    /\b(?:processed|issued|completed|handled) (?:the |your )?refund(?: correctly)?\b/.test(
      value,
    )
  );
}

function getCompleteComplaintFacts(message) {
  const original = String(message || "");
  const normalized = original.toLowerCase();
  const date = original.match(
    /\b\d{1,2} (?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  )?.[0];
  const timeframe = original.match(
    /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+) (?:working|business|calendar) days?\b/i,
  )?.[0];
  const hasNeutralAcknowledgement =
    /\b(?:i|we) (?:understand|recognise|recognize|acknowledge)\b/.test(
      normalized,
    );
  const hasConfirmedOutcomeOrExplanation =
    detectConfirmedRefundOutcome(normalized) ||
    /\b(?:we|i) (?:confirmed|reviewed|checked|completed|processed|issued|handled)\b/.test(
      normalized,
    );
  const hasClearFollowUpInstruction =
    /\bplease (?:let (?:us|me) know|contact (?:us|me)|get in touch) if\b/.test(
      normalized,
    );

  return hasNeutralAcknowledgement &&
    hasConfirmedOutcomeOrExplanation &&
    date &&
    timeframe &&
    hasClearFollowUpInstruction
    ? { date, timeframe }
    : null;
}

function inferEffectiveRisk(analysis, originalMessage = "", workMode = "general") {
  const modelRisk = analysis.classification.communicationRisk;
  if (modelRisk !== "low") return modelRisk;

  const original = String(originalMessage || "").toLowerCase();

  const interpretation = [
    analysis.perceptionGap,
    analysis.intentVsImpact.theyMayHear,
    analysis.recipientLikelyPerception,
  ]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

  const identifiesMaterialGap =
    /\b(abrupt|accusatory|blame|cold|concern|curt|dead end|defensive|dismissive|helpless|impatient|impatience|pressure|stuck|threatening|unclear)\b|(?:firm|absolute) closure|no (?:room|opportunity) for (?:further )?discussion|nothing (?:more|else) (?:i|we) can do|lacking empathy|limited (?:in|to) (?:their |your )?options|waiting with no immediate solution|(?:clearer|specific) ask or softer opening would reduce (?:that|the|this) gap|recipient (?:may|might|could) (?:want|feel|hear|perceive)/.test(
      interpretation,
    );
  const identifiesConcreteRisk =
    /\b(?:accusatory|blame|dismissive|pressure|threatening)\b|(?:firm|absolute) closure|no (?:room|opportunity) for (?:further )?discussion|nothing (?:more|else) (?:i|we) can do|lacking empathy/.test(
      interpretation,
    ) ||
    /\b(?:your fault|you failed|you must|or else|final warning|unacceptable|we will not respond|we won't respond|nothing (?:more|else) (?:i|we) can do)\b/.test(
      original,
    );
  const declaresClosure =
    /\b(?:matter|case|complaint|issue)(?: is| is now| remains| as| considered)? (?:closed|resolved)\b|\bconsider (?:this|the) (?:matter|case|complaint|issue) (?:closed|resolved)\b/.test(
      original,
    );
  const invitesFurtherDiscussion =
    /\b(?:any|further) questions\b|\bplease (?:contact|let (?:us|me) know)\b|\bget in touch\b/.test(
      original,
    );
  const isCompleteComplaint =
    workMode === "complaints" && getCompleteComplaintFacts(original);
  const hasConcreteRisk =
    identifiesConcreteRisk || (declaresClosure && invitesFurtherDiscussion);

  if (isCompleteComplaint && !hasConcreteRisk) return "low";

  const explicitlyReassuring =
    /\b(no significant perception gap|unlikely to be misunderstood|lands clearly|does not (?:sound|appear|come across) (?:abrupt|dismissive|defensive))\b/.test(
      interpretation,
    );

  return identifiesMaterialGap && !explicitlyReassuring ? "medium" : "low";
}

async function submitFeedback(feedback) {
  const allowedTags = new Set(["felt_accurate", "missed_point"]);
  const tag = allowedTags.has(feedback?.tag) ? feedback.tag : null;

  if (!tag) {
    throw new Error("That feedback option is not supported.");
  }

  const apiBase = await getApiBase();
  const response = await fetch(`${apiBase}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feedbackOnly: true,
      feedback: { tags: [tag] },
      metadata: {
        characterCount:
          typeof feedback.characterCount === "number"
            ? feedback.characterCount
            : undefined,
        severity: ["low", "medium", "high"].includes(feedback.severity)
          ? feedback.severity
          : undefined,
        rewriteVisible: feedback.rewriteVisible === true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Feedback could not be saved.");
  }
}

function isValidAnalysis(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.perceptionGap === "string" &&
      value.intentVsImpact &&
      typeof value.intentVsImpact.youMeant === "string" &&
      typeof value.intentVsImpact.theyMayHear === "string" &&
      value.classification &&
      ["low", "medium", "high"].includes(
        value.classification.communicationRisk,
      ) &&
      typeof value.classification.rewriteStrategy === "string" &&
      typeof value.improvedRewrite === "string",
  );
}
