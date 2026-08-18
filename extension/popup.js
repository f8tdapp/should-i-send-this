const workModeSelect = document.querySelector("#work-mode");
const modeNote = document.querySelector("#mode-note");

const modeDescriptions = {
  general:
    "Checks professional clarity, pressure and possible misinterpretation.",
  property:
    "Calibrated for tenants, landlords, repairs, arrears and property complaints.",
  complaints:
    "Calibrated for acknowledgement, defensiveness, promises and escalation risk.",
};

initializeWorkMode();

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
