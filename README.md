# BuildPaid Governance SDK

Deterministic construction governance through a single API. Score compliance, verify provenance, detect contradictions, and execute governed payments.

**86 patents filed · 1,663+ claims · Patent Pending**

```
npm install @buildpaid/governance-sdk
```

## Quick Start

```javascript
const BuildPaid = require('@buildpaid/governance-sdk');

const client = new BuildPaid({ apiKey: 'bp_your_key_here' });

// Score compliance across all rails
const compliance = await client.score.compliance({ project_id: 'prj_xxx' });
// → { score: 94, grade: 'A', rails: { coi: 'CLEAR', cpral: 'CLEAR', ... } }

// Get fundability verdict
const fundability = await client.score.fundability({ contract_id: 'CTR-001' });
// → { score: 87, verdict: 'FUNDABLE', pral_decision: 'ADVANCE' }

// Verify a provenance hash
const proof = await client.provenance.verify({ hash: '9fb7534ad022...' });
// → { status: 'AUTHENTIC', chain_depth: 47, anchor_time: '2026-05-19T...' }
```

## Authentication

All requests require a Bearer token issued per organization. Every SDK response includes an `X-BuildPaid-Signature` header (HMAC-SHA256) for tamper detection.

```javascript
const client = new BuildPaid({
  apiKey: 'bp_your_key_here',
  verifySignatures: true  // default: true — validates HMAC on every response
});
```

Request an API key: [sean@buildpaid.ai](mailto:sean@buildpaid.ai)

## Methods

### Scoring (Lender Scope)

| Method | Description |
|---|---|
| `score.compliance` | Compliance score 0–100 across all governance rails |
| `score.fundability` | Fundability verdict per contract — FUNDABLE or BLOCKED |
| `score.bpi` | BuildPaid Performance Index — 6 dimensions, tiered grade |
| `score.exposure` | Capital exposure at risk across the portfolio |

### Compliance (GC Scope)

| Method | Description |
|---|---|
| `compliance.status` | Rail clearance status for a project |
| `compliance.gates` | Activation gate states — which gates are open/blocked |
| `compliance.documents` | Document verification status per entity |
| `compliance.cpral` | CPRAL labor verification — Davis-Bacon compliance |

### Provenance (Vendor Scope)

| Method | Description |
|---|---|
| `provenance.verify` | Verify a SHA-256 provenance hash against the chain |
| `provenance.export` | Export a signed audit bundle for a project |
| `provenance.chain` | Get chain integrity status and depth |

### Events (Any Scope)

| Method | Description |
|---|---|
| `events.subscribe` | Subscribe to kernel event types via webhook |
| `events.recent` | Get recent kernel events for an entity |

## Response Shape

Every response follows the same canonical structure:

```json
{
  "ok": true,
  "method": "score.compliance",
  "data": {
    "score": 94,
    "grade": "A",
    "rails": {
      "coi": "CLEAR",
      "license": "CLEAR",
      "cpral": "CLEAR",
      "notarization": "CLEAR",
      "signature": "CLEAR",
      "supplier": "CLEAR"
    },
    "provenance_hash": "d77400ae439a..."
  },
  "kernel_event": "SDK.SCORE_COMPLIANCE",
  "timestamp": "2026-05-19T14:32:00.000Z"
}
```

Every call emits a kernel event. Every response is provenance-anchored. Nothing is ungoverned.

## Signature Verification

Every response header contains `X-BuildPaid-Signature` — an HMAC-SHA256 digest of the response body using your SDK secret. The client verifies this automatically when `verifySignatures: true`.

```javascript
// Manual verification
const crypto = require('crypto');
const expected = crypto
  .createHmac('sha256', sdkSecret)
  .update(responseBody)
  .digest('hex');

if (expected !== signatureHeader) {
  throw new Error('Response tampered');
}
```

## Webhooks

Subscribe to kernel events with authenticated delivery:

```javascript
await client.events.subscribe({
  events: ['DRAW.SUBMITTED', 'VERDICT.ISSUED', 'PAYMENT.GATED'],
  webhook_url: 'https://your-app.com/webhooks/buildpaid'
});
```

Webhook payloads are signed with HMAC-SHA256:

```json
{
  "event": "VERDICT.ISSUED",
  "entity_id": "prj_xxx",
  "data": { "verdict": "FUNDABLE", "score": 91 },
  "timestamp": "2026-05-19T14:32:00.000Z",
  "provenance_hash": "8bae6c702c65..."
}
```

Verify with the `X-BuildPaid-Signature` header before processing.

## Rate Limits

| Scope | Limit |
|---|---|
| Read methods | 100 requests/min |
| Write methods | 20 requests/min |

Rate limit headers are included on every response: `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Pricing

| Tier | Price | Includes |
|---|---|---|
| Scan | $0.50/scan | Contradiction detection, temporal governance, provenance-anchored verdict |
| Govern | $50/project/month | Full 17-engine compilation, unlimited verdicts, notarization, payment rail |
| Enterprise | Custom | Volume pricing, dedicated support, custom governance profiles, SOC 2, SLA |

## Examples

See the [`examples/`](./examples) directory:

- [`score-compliance.js`](./examples/score-compliance.js) — Score a project's compliance posture
- [`verify-provenance.js`](./examples/verify-provenance.js) — Verify a provenance hash chain
- [`webhook-handler.js`](./examples/webhook-handler.js) — Handle and verify incoming webhooks
- [`portfolio-scan.js`](./examples/portfolio-scan.js) — Scan an entire portfolio for contradictions

## Architecture

```
Your Application
    │
    ▼
BuildPaid SDK  ──────────►  /api/governance-sdk
    │                              │
    │  HMAC-SHA256 verified        │  Kernel event emitted
    │                              │
    ▼                              ▼
Response with                Provenance chain
signature header             anchored to kernel
```

The SDK is a thin client over a single POST endpoint. The governance kernel does the work. Every method call produces an immutable kernel event — the SDK itself is governed.

## Documentation

- [Dashboard](https://app.buildpaid.ai/governance.html) — Live governance statistics
- [Developer API](https://app.buildpaid.ai/developers.html) — Full endpoint reference
- [SDK Reference](https://app.buildpaid.ai/sdk.html) — Interactive method explorer
- [Certification](https://app.buildpaid.ai/certification.html) — Verify any governance certificate
- [Technical Paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6799258) — "Deterministic Governance Compilation for Capital"

## License

Proprietary. See [LICENSE](./LICENSE).

© 2026 BuildPaid · Patent Pending
