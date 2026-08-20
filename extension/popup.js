const workModeSelect = document.querySelector("#work-mode");
const modeNote = document.querySelector("#mode-note");
const activationForm = document.querySelector("#activation-form");
const activationInput = document.querySelector("#pilot-credential");
const activationButton = document.querySelector("#activate-pilot");
const activationStatus = document.querySelector("#activation-status");
const HOSTED_API_BASE = "https://pilot.betweenlinesai.com";

const modeDescriptions = {
  general:
    "Checks professional clarity, pressure and possible misinterpretation.",
  property:
    "Calibrated for tenants, landlords, repairs, arrears and property complaints.",
  complaints:
    "Calibrated for acknowledgement, defensiveness, promises and escalation risk.",
};

initializePopup();

async function initializePopup() {
  await Promise.all([initializeWorkMode(), initializeActivation()]);
}

async function initializeWorkMode() {
  const stored = await chrome.storage.local.get("betweenlinesWorkMode");
  const selected = Object.hasOwn(modeDescriptions, stored.betweenlinesWorkMode)
    ? stored.betweenlinesWorkMode
    : "general";

  workModeSelect.value = selected;
  updateModeNote(selected);
}

workModeSelect.addEventListener("change", async () => {
  const selected = workModeSelect.value;
  await chrome.storage.local.set({ betweenlinesWorkMode: selected });
  updateModeNote(selected, true);
});

function updateModeNote(mode, saved = false) {
  modeNote.textContent = `${modeDescriptions[mode]}${saved ? " Saved." : ""}`;
}

async function initializeActivation() {
  await chrome.storage.local.remove("betweenlinesPilotCredential");
  const stored = await chrome.storage.local.get(
    "betweenlinesPilotInstallationToken",
  );

  if (stored.betweenlinesPilotInstallationToken) {
    activationForm.hidden = true;
    activationStatus.textContent = "Hosted pilot activated on this browser.";
  }
}

activationButton.addEventListener("click", async () => {
  const activationCode = activationInput.value.trim();

  if (!activationCode) {
    activationStatus.textContent = "Enter the pilot activation credential.";
    return;
  }

  activationButton.disabled = true;
  activationStatus.textContent = "Verifying pilot accessâ€¦";
  activationInput.value = "";

  try {
    const stored = await chrome.storage.local.get("betweenlinesApiBase");
    const configuredApiBase = String(stored.betweenlinesApiBase || "").trim();
    const apiBase = (configuredApiBase || HOSTED_API_BASE).replace(/\/$/, "");
    const usesSecureTransport =
      apiBase.startsWith("https://") ||
      /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(apiBase);

    if (!usesSecureTransport) {
      throw new Error("Pilot activation requires HTTPS outside localhost.");
    }

    const response = await fetch(`${apiBase}/api/extension/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ activationCode }),
    });

    const data = await response.json().catch(() => null);

    if (
      !response.ok ||
      !data ||
      typeof data.installationToken !== "string" ||
      !/^blp_[A-Za-z0-9_-]{43}$/.test(data.installationToken)
    ) {
      throw new Error("That pilot activation could not be verified.");
    }

    await chrome.storage.local.set({
      betweenlinesPilotInstallationToken: data.installationToken,
    });
    activationForm.hidden = true;
    activationStatus.textContent = "Hosted pilot activated on this browser.";
  } catch (error) {
    activationStatus.textContent =
      error instanceof Error
        ? error.message
        : "Pilot activation is temporarily unavailable.";
  } finally {
    activationButton.disabled = false;
  }
});
