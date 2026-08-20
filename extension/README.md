# BetweenLines embedded browser prototype

This unpacked Manifest V3 extension is the first workflow prototype for Gmail
and Outlook on the web. It does not replace the public BetweenLines site.

## Current behaviour

- Detects a focused message composer in Gmail or Outlook.
- Shows `Check how this lands` only after a draft contains at least 10 characters.
- Reads the focused draft only after the user clicks the check button.
- Uses `/api/analyze` only for the existing unauthenticated localhost workflow.
- Exchanges a one-time hosted-pilot activation code for a separate random
  installation token, then sends activated requests to the authenticated
  `/api/extension/analyze` endpoint.
- Shows intent, possible impact, before-send guidance, and one optional alternative.
- Supports one-time General Professional, Property & Lettings, and Customer
  Complaints calibration modes.
- Collects optional `Accurate` or `Missed it` feedback using allow-listed
  metadata only; the draft is never included in feedback.
- Does not create or store message history.

## Local testing

1. From the project root, run `npm run dev`.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this `extension` directory.
6. Open Gmail or Outlook on the web, start a draft, and type at least 10 characters.

Without a pilot activation, the extension calls `http://localhost:3000`. Keep
the local Next.js development server running during testing. Activated builds
use the hosted pilot endpoint; `betweenlinesApiBase` remains an optional local
storage override for developer testing.

## Privacy boundary

The content script tracks which supported draft field has focus, but it does not
read the draft until the user explicitly requests a check. It does not use
browser storage for drafts or analyses. The popup stores the selected work mode
and, after successful one-time activation, only the opaque installation token as
authentication material. The activation code is never retained. The API base
remains an optional developer override.

## Before production

- Confirm the final hosted origin and extension origin allow-list.
- Issue one-time activation codes out of band and configure only their HMACs.
- Follow `docs/hosted-pilot.md` for hosted environment and revocation setup.
- Complete Gmail and Outlook compatibility testing.
- Add store-ready icons, screenshots, privacy disclosures, and release packaging.
- Complete a security review of composer detection and draft replacement.
