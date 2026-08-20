# Hosted extension pilot security and operations

The proposed hosted origin is `https://pilot.betweenlinesai.com`. It is a default,
not a deployment decision: `betweenlinesApiBase` remains a developer/build
storage override, and the origin must be approved before packaging. The public
site and public `POST /api/analyze` route remain separate and unchanged.

## Authentication flow

1. An operator issues a high-entropy, per-user activation code through an
   approved confidential channel. Only its HMAC and a pseudonymous activation ID
   are placed in hosted environment configuration.
2. The popup sends the code once in the JSON body of an HTTPS request to
   `POST /api/extension/activate`. It never sends the activation code as a bearer
   credential and clears the input before awaiting the response.
3. Redis atomically consumes the pseudonymous activation ID with `SET NX` and a
   TTL ending when the activation code expires. Reuse is rejected.
4. The server creates a separate random 256-bit installation token, returns it
   once, and stores only an HMAC token identifier plus pseudonymous metadata in
   Redis. The raw token is never stored server-side.
5. The popup stores only the installation token as authentication material in
   `chrome.storage.local`. Drafts, analyses, activation codes, token identifiers,
   and expiry metadata are not stored.
6. `POST /api/extension/analyze` accepts the installation token as a Bearer token
   over HTTPS. It verifies origin, existence, expiry, and revocation before
   applying per-token limits and invoking the shared analyzer.

Installation records expire automatically. Tokens can be revoked by HMAC token
identifier (`PILOT_REVOKED_TOKEN_IDS`) or by their one-time pseudonymous
activation ID (`PILOT_REVOKED_ACTIVATION_IDS`). The latter is the practical
operator route because each activation creates exactly one installation token.

## Exact environment variables

Existing analysis variables:

- `OPENAI_API_KEY` — required outside demo development.
- `UPSTASH_REDIS_REST_URL` — required; pilot auth fails closed without it.
- `UPSTASH_REDIS_REST_TOKEN` — required; pilot auth fails closed without it.
- `RATE_LIMIT_COOKIE_SECRET` — required by the unchanged public endpoint.
- Existing public `ANALYSIS_*` and `FEEDBACK_*` variables remain unchanged.

Pilot variables:

- `PILOT_TOKEN_HMAC_SECRET` — required, at least 32 high-entropy characters,
  distinct from every other application secret.
- `PILOT_ACTIVATION_CODES_JSON` — required JSON array with this shape:
  `[{
  "id":"pseudonymous-user-01",
  "codeHmac":"<64 lowercase hex characters>",
  "expiresAt":"2026-09-01T00:00:00.000Z",
  "revoked":false
  }]`.
- `PILOT_EXTENSION_ALLOWED_ORIGINS` — required in production, comma-separated
  exact origins such as `chrome-extension://<pinned-32-character-id>`. Do not set
  this until the packaged extension ID has been pinned and verified.
- `PILOT_EXTENSION_IDS_PINNED` — required literal value `true` in production,
  set only after completing and recording the packaging verification below.
- `PILOT_INSTALLATION_TOKEN_TTL_SECONDS` — optional; default `2592000` (30 days).
- `PILOT_TOKEN_MINUTE_LIMIT` — optional; provisional default `10` checks/minute.
- `PILOT_TOKEN_DAILY_LIMIT` — optional; provisional default `100` checks/day.
- `PILOT_ACTIVATION_ATTEMPT_HOURLY_LIMIT` — optional; default `10` attempts/hour
  per HMAC activation-code identifier.
- `PILOT_ACTIVATION_NETWORK_HOURLY_LIMIT` — optional; default `30` attempts/hour
  per HMAC network identifier. The raw network address is not stored in Upstash.
- `PILOT_REVOKED_TOKEN_IDS` — optional comma-separated HMAC token identifiers.
- `PILOT_REVOKED_ACTIVATION_IDS` — optional comma-separated pseudonymous
  activation IDs.

Never place raw activation codes, raw installation tokens, extension private
keys, messages, or personal identifiers in environment variables or source.

## Upstash data boundary and TTLs

Permitted keys contain only pseudonymous identifiers and counters:

- `betweenlines:pilot:activation-used:<activation-id>` — value `1`, expiring no
  later than the activation-code expiry.
- `betweenlines:pilot:installation:<hmac-token-id>` — version, pseudonymous
  activation ID, and expiry timestamp, with the installation-token TTL.
- `betweenlines:pilot:activation:attempt:*` — HMAC-keyed counters with an hourly
  limiter TTL.
- `betweenlines:pilot:activation:network:*` — HMAC-network counters with an
  hourly limiter TTL.
- `betweenlines:pilot:token:minute:*` — HMAC-token counters with minute-scale TTLs.
- `betweenlines:pilot:token:daily:*` — HMAC-token counters with day-scale TTLs.

No Redis key or value may contain a raw message, activation code, installation
token, email address, extension draft, or analysis response. Rate-limit TTLs are
managed by `@upstash/ratelimit`; installation state has an explicit expiry.

## Pinning the Chrome extension ID safely

Origin allow-listing is not ready until the extension ID is stable.

Preferred Chrome Web Store procedure:

1. Finalize the manifest and upload an unsigned ZIP to a private/unlisted pilot
   listing. Do not publish broadly.
2. Record the extension ID assigned to that listing and verify it from a clean
   installation of the listing.
3. Use the same Web Store listing for every update; creating a new listing
   creates a different identity.
4. Only then configure the exact `chrome-extension://<id>` origin in the hosted
   environment and test that every other origin returns `403`.

For controlled self-hosted/unpacked packaging, Chrome may generate a `.pem`
private key. Generate and retain it offline in an approved secret store, outside
this repository and all build logs. Reuse that same private key for every pack.
If a manifest `key` is needed to stabilize development IDs, include only the
corresponding public key after security review; never commit or distribute the
`.pem`. Confirm the derived ID before configuring the server allow-list.

## Logging requirements

The application code must not log request objects, bodies, activation codes,
installation tokens, `Authorization` headers, or full error objects. The pilot
routes and auth module contain no logging calls. The shared analyzer logs only
allow-listed metadata and reduced error fields; this must remain covered by code
review and tests.

Hosting configuration is a release blocker until an operator verifies, with
provider documentation and a test request containing synthetic canaries, that:

- edge, function, firewall, tracing, analytics, and error-reporting products do
  not capture request bodies or `Authorization` headers;
- access logs contain only method, path, status, timing, and approved network
  metadata;
- log drains and support tooling apply the same redaction; and
- retention and staff access are approved and documented.

Do not send a real activation code or token during this verification.

## Deployment gates

1. Approve the hosted origin and privacy/security owners.
2. Pin and verify the production extension ID using the procedure above.
3. Configure the exact origin, HMAC secret, Upstash, limits, and only HMACed
   activation records in an isolated pilot environment.
4. Verify negative tests for origin, malformed auth, one-time use, expiry,
   revocation, plaintext transport, and exhausted limits.
5. Verify hosting-log redaction with synthetic canaries.
6. Confirm `/api/analyze` public UI, limits, cookies, and response behavior remain
   unchanged.
7. Activate a test installation, inspect only the permitted pseudonymous Redis
   keys and their TTLs, then test revocation and expiry.
8. Deploy or promote only after explicit operational approval.

## Residual assumptions

- `chrome.storage.local` is not hardware-backed. Browser-profile access or a
  compromised extension can recover the installation token.
- Extension-origin checks reduce browser misuse but do not replace bearer-token
  authentication; non-browser clients can forge an `Origin` header.
- Environment-list revocation takes effect after a configuration rollout. For
  emergency immediate revocation, an approved administrative Redis workflow or
  dedicated control plane is still required.
- A retry that makes a second model request counts as another token check. Pilot
  limits should be reviewed against expected retry behavior before launch.
