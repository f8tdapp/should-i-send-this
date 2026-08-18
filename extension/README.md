# BetweenLines embedded browser prototype

This unpacked Manifest V3 extension is the first workflow prototype for Gmail
and Outlook on the web. It does not replace the public BetweenLines site.

## Current behaviour

- Detects a focused message composer in Gmail or Outlook.
- Shows `Check how this lands` only after a draft contains at least 10 characters.
- Reads the focused draft only after the user clicks the check button.
- Calls the existing `/api/analyze` endpoint.
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

The extension currently calls `http://localhost:3000`. Keep the local Next.js
development server running during testing.

## Privacy boundary

The content script tracks which supported draft field has focus, but it does not
read the draft until the user explicitly requests a check. It does not use
browser storage for drafts or analyses. The only stored setting is the API base
URL, reserved for a later production configuration flow.

## Before production

- Replace the development API base with the final production origin.
- Restrict host permissions to the final API origin.
- Add authentication and team entitlements.
- Complete Gmail and Outlook compatibility testing.
- Add store-ready icons, screenshots, privacy disclosures, and release packaging.
- Complete a security review of composer detection and draft replacement.
