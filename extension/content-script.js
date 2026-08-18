const ROOT_ID = "betweenlines-extension-root";
const MINIMUM_MESSAGE_LENGTH = 10;
const SIGNATURE_SELECTOR =
  '.gmail_signature, [data-smartmail="gmail_signature"]';

let activeDraft = null;
let root = null;
let triggerButton = null;
let panel = null;
let currentAnalysis = null;
let currentMessageLength = 0;
let alternativeIsVisible = false;

document.addEventListener("focusin", handleFocusIn, true);
document.addEventListener("input", handleDraftInput, true);
window.addEventListener("blur", hideTriggerWhenWindowLosesFocus);

function handleFocusIn(event) {
  const candidate = getDraftElement(event.target);
  if (!candidate) return;

  activeDraft = candidate;
  ensureInterface();
  updateTriggerVisibility();
}

function handleDraftInput(event) {
  if (event.target !== activeDraft) return;

  currentAnalysis = null;
  currentMessageLength = 0;
  alternativeIsVisible = false;
  closePanel();
  updateTriggerVisibility();
}

function hideTriggerWhenWindowLosesFocus() {
  if (triggerButton) triggerButton.hidden = true;
}

function getDraftElement(target) {
  if (!(target instanceof HTMLElement)) return null;

  if (target instanceof HTMLTextAreaElement) {
    return target;
  }

  const editable = target.closest('[contenteditable="true"]');
  if (!(editable instanceof HTMLElement)) return null;

  const role = editable.getAttribute("role");
  const ariaMultiline = editable.getAttribute("aria-multiline");
  const isMessageLike =
    role === "textbox" ||
    ariaMultiline === "true" ||
    editable.closest('[role="dialog"]');

  return isMessageLike ? editable : null;
}

function readDraft(element) {
  if (element instanceof HTMLTextAreaElement) {
    return element.value.trim();
  }

  const draftOnly = element.cloneNode(true);
  if (!(draftOnly instanceof HTMLElement)) return "";

  const signatures = draftOnly.querySelectorAll(SIGNATURE_SELECTOR);
  const hadSignature = signatures.length > 0;
  signatures.forEach((signature) => signature.remove());

  const draftText = (draftOnly.innerText || draftOnly.textContent || "").trim();
  return hadSignature ? draftText.replace(/(?:\r?\n)?\s*--\s*$/, "").trim() : draftText;
}

function replaceDraft(element, value) {
  element.focus();

  if (element instanceof HTMLTextAreaElement) {
    element.value = value;
  } else {
    const signature = element.querySelector(SIGNATURE_SELECTOR);
    if (signature) {
      const draftRange = document.createRange();
      draftRange.setStart(element, 0);
      draftRange.setEndBefore(signature);
      draftRange.deleteContents();
      signature.before(document.createTextNode(value), document.createElement("br"));
    } else {
      element.textContent = value;
    }
  }

  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
}

function ensureInterface() {
  if (root?.isConnected) return;

  root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("aria-live", "polite");

  triggerButton = document.createElement("button");
  triggerButton.type = "button";
  triggerButton.className = "betweenlines-trigger";
  triggerButton.innerHTML = '<span class="betweenlines-mark">BL</span><span>Check how this lands</span>';
  triggerButton.addEventListener("click", checkActiveDraft);

  panel = document.createElement("aside");
  panel.className = "betweenlines-panel";
  panel.hidden = true;

  root.append(triggerButton, panel);
  document.documentElement.append(root);
}

function updateTriggerVisibility() {
  if (!triggerButton || !activeDraft?.isConnected) return;

  const message = readDraft(activeDraft);
  triggerButton.hidden = message.length < MINIMUM_MESSAGE_LENGTH;
}

async function checkActiveDraft() {
  if (!activeDraft?.isConnected) return;

  const message = readDraft(activeDraft);
  currentMessageLength = message.length;
  alternativeIsVisible = false;
  renderLoading();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "BETWEENLINES_ANALYZE",
      message,
    });

    if (!response?.ok) {
      throw new Error(response?.error || "BetweenLines could not check this message.");
    }

    currentAnalysis = response.analysis;
    renderAnalysis(currentAnalysis);
  } catch (error) {
    renderError(
      error instanceof Error
        ? error.message
        : "BetweenLines could not check this message.",
    );
  }
}

function renderLoading() {
  triggerButton.disabled = true;
  triggerButton.innerHTML = '<span class="betweenlines-spinner"></span><span>Checking…</span>';
  panel.hidden = false;
  panel.innerHTML = `
    <div class="betweenlines-panel-card betweenlines-panel-loading">
      <span class="betweenlines-mark">BL</span>
      <p>Reading the communication impact…</p>
    </div>
  `;
}

function renderAnalysis(analysis) {
  resetTrigger();

  const risk =
    analysis.extensionContext?.effectiveRisk ||
    analysis.classification.communicationRisk;
  const label =
    risk === "high"
      ? "High perception risk"
      : risk === "medium"
        ? "Perception Gap"
        : "Looks clear";
  const rewriteIntegrity = analysis.extensionContext?.rewriteIntegrity;
  const rewritePassedValidation = rewriteIntegrity?.safe === true;
  const alternativeWarning =
    !rewritePassedValidation
      ? `<p class="betweenlines-alternative-warning">BetweenLines could not produce an alternative that passed its safety checks. Keep editing the original message.</p>`
      : "";
  const alternativeTitle =
    !rewritePassedValidation
      ? "Alternative unavailable"
      : "One possible alternative";
  const alternativeText =
    !rewritePassedValidation
      ? ""
      : `<p>${escapeHtml(analysis.improvedRewrite)}</p>`;
  const useAlternativeButton =
    !rewritePassedValidation
      ? ""
      : '<button type="button" class="betweenlines-primary" data-action="use-alternative">Use this version</button>';

  panel.hidden = false;
  panel.innerHTML = `
    <div class="betweenlines-panel-card">
      <div class="betweenlines-panel-header">
        <div>
          <span class="betweenlines-risk betweenlines-risk-${risk}">${escapeHtml(label)}</span>
          <h2>How this could land</h2>
        </div>
        <button type="button" class="betweenlines-close" aria-label="Close BetweenLines insight">×</button>
      </div>
      <p class="betweenlines-summary">${escapeHtml(analysis.perceptionGap)}</p>
      <section class="betweenlines-insight">
        <h3>You appear to mean</h3>
        <p>${escapeHtml(analysis.intentVsImpact.youMeant)}</p>
      </section>
      <section class="betweenlines-insight">
        <h3>They may hear</h3>
        <p>${escapeHtml(analysis.intentVsImpact.theyMayHear)}</p>
      </section>
      <section class="betweenlines-before-send">
        <h3>Before sending</h3>
        <p>${escapeHtml(toSentenceCase(analysis.extensionContext?.operationalGuidance || analysis.classification.rewriteStrategy))}</p>
      </section>
      <div class="betweenlines-actions">
        <button type="button" class="betweenlines-secondary" data-action="keep-editing">Keep editing</button>
        <button type="button" class="betweenlines-primary" data-action="show-alternative">Show one alternative</button>
      </div>
      <section class="betweenlines-alternative" hidden>
        <h3>${alternativeTitle}</h3>
        ${alternativeText}
        ${alternativeWarning}
        ${useAlternativeButton}
      </section>
      <div class="betweenlines-feedback">
        <span>Was this useful?</span>
        <button type="button" data-feedback="felt_accurate">Accurate</button>
        <button type="button" data-feedback="missed_point">Missed it</button>
      </div>
      <p class="betweenlines-privacy">Checked on request. No message history created.</p>
    </div>
  `;

  panel.querySelector(".betweenlines-close")?.addEventListener("click", closePanel);
  panel.querySelector('[data-action="keep-editing"]')?.addEventListener("click", closePanel);
  panel.querySelector('[data-action="show-alternative"]')?.addEventListener("click", () => {
    const alternative = panel.querySelector(".betweenlines-alternative");
    if (alternative) {
      alternative.hidden = false;
      alternativeIsVisible = true;
    }
  });
  panel.querySelector('[data-action="use-alternative"]')?.addEventListener("click", () => {
    if (!activeDraft || !currentAnalysis?.improvedRewrite) return;
    replaceDraft(activeDraft, currentAnalysis.improvedRewrite);
    currentAnalysis = null;
    closePanel();
  });
  panel.querySelectorAll("[data-feedback]").forEach((button) => {
    button.addEventListener("click", () => submitQualityFeedback(button));
  });
}

async function submitQualityFeedback(button) {
  if (!(button instanceof HTMLButtonElement) || !currentAnalysis) return;

  const feedbackButtons = panel?.querySelectorAll("[data-feedback]") || [];
  feedbackButtons.forEach((item) => {
    if (item instanceof HTMLButtonElement) item.disabled = true;
  });

  const response = await chrome.runtime.sendMessage({
    type: "BETWEENLINES_FEEDBACK",
    feedback: {
      tag: button.dataset.feedback,
      characterCount: currentMessageLength,
      severity:
        currentAnalysis.extensionContext?.effectiveRisk ||
        currentAnalysis.classification.communicationRisk,
      rewriteVisible: alternativeIsVisible,
    },
  });

  const feedback = panel?.querySelector(".betweenlines-feedback");
  if (!feedback) return;

  feedback.textContent = response?.ok
    ? "Thanks — feedback saved without your message."
    : "Feedback could not be saved this time.";
}

function renderError(message) {
  resetTrigger();
  panel.hidden = false;
  panel.innerHTML = `
    <div class="betweenlines-panel-card">
      <div class="betweenlines-panel-header">
        <div>
          <span class="betweenlines-risk betweenlines-risk-high">Check unavailable</span>
          <h2>BetweenLines could not complete the check</h2>
        </div>
        <button type="button" class="betweenlines-close" aria-label="Close BetweenLines error">×</button>
      </div>
      <p class="betweenlines-summary">${escapeHtml(message)}</p>
      <p class="betweenlines-privacy">Your draft was not stored by this extension.</p>
    </div>
  `;
  panel.querySelector(".betweenlines-close")?.addEventListener("click", closePanel);
}

function resetTrigger() {
  if (!triggerButton) return;
  triggerButton.disabled = false;
  triggerButton.innerHTML = '<span class="betweenlines-mark">BL</span><span>Check how this lands</span>';
}

function closePanel() {
  if (panel) panel.hidden = true;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value || "");
  return div.innerHTML;
}

function toSentenceCase(value) {
  const text = String(value || "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
