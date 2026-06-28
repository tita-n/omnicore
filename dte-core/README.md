# @omnicore/dte

**Dynamic Trust Engine** — a framework-agnostic library that evaluates account trustworthiness by collecting signals from independent modules, computing per-dimension trust scores, and making explainable decisions.

No single signal determines trust. Every decision is explainable.

## Install

```bash
npm install @omnicore/dte
```

## Quick Start

```typescript
import { DTE, SIGNAL_TYPES } from '@omnicore/dte';

const dte = new DTE();

// 1. Submit trust signals from any module
dte.submitSignal({
  accountId: 'user-abc',
  signalType: SIGNAL_TYPES.AGE_VERIFICATION,
  value: 85,
  confidence: 95,
  explanation: 'Government ID verified',
});

dte.submitSignal({
  accountId: 'user-abc',
  signalType: SIGNAL_TYPES.PHONE_VERIFICATION,
  value: 70,
  confidence: 90,
  explanation: 'Phone number verified via SMS',
});

// 2. Ask the engine a question
const decision = dte.evaluateAction('user-abc', 'send_message');
// { outcome: 'allow', explanation: '...', triggeredRules: [...], ... }

// 3. Get an explainable breakdown
const explanation = dte.getTrustExplanation('user-abc', 'identity');
// { dimension: 'identity', score: 78, confidence: 93, contributors: [...] }

// 4. View decision history
const history = dte.getDecisionHistory('user-abc');
// [{ decisionId, action, outcome, explanation, evaluatedAt, ... }]
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        DTE                               │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │  Signal   │  │    Trust      │  │   Decision     │   │
│  │  Engine   │─▶│  Calculator   │─▶│    Engine      │   │
│  └────┬─────┘  └───────────────┘  └───────┬────────┘   │
│       │                                    │           │
│  ┌────▼─────┐  ┌───────────────┐  ┌───────▼────────┐   │
│  │  Signal   │  │   Rules       │  │   Event        │   │
│  │ Registry  │  │   Engine      │  │   Logger       │   │
│  └──────────┘  └───────────────┘  └────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │  Audit   │  │Configuration  │  │    Storage     │   │
│  │  System  │  │   Manager     │  │  (Memory)      │   │
│  └──────────┘  └───────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

All modules communicate through interfaces. Storage is swappable (`ITrustStorage`).

## Trust Dimensions

Scores are computed independently per dimension (not one combined score):

| Dimension  | Description |
|------------|-------------|
| `identity` | Verified identity signals (age, phone, email, liveness) |
| `behavior` | Behavioral analysis and fraud detection |
| `community` | Community reports and reputation |
| `device` | Device trust and consistency |
| `account` | Account age and activity |

Each dimension returns: `{ score: 0-100, confidence: 0-100, contributingSignals[], lastUpdated }`.

## Signal Registry

Signals use predefined types — no freeform strings:

```typescript
SIGNAL_TYPES.AGE_VERIFICATION
SIGNAL_TYPES.PHONE_VERIFICATION
SIGNAL_TYPES.EMAIL_VERIFICATION
SIGNAL_TYPES.DEVICE_TRUST
SIGNAL_TYPES.LIVENESS
SIGNAL_TYPES.BEHAVIOR
SIGNAL_TYPES.COMMUNITY_REPORT
SIGNAL_TYPES.SPAM_DETECTION
SIGNAL_TYPES.PHOTO_VERIFICATION
```

Register custom types for future modules:

```typescript
dte.registerSignalType({
  type: 'ML_FRAUD_SCORE',
  source: 'ml-fraud-detection',
  category: 'behavior',
  description: 'ML-based fraud probability',
  defaultWeight: 0.9,
  defaultTtlMs: 86_400_000, // 24 hours
});
```

## Decisions

Every decision includes an explanation, triggered rules, and a snapshot of the trust profile:

```typescript
{
  outcome: 'allow' | 'deny' | 'require_additional_verification',
  explanation: "Rule 'send-messages' matched. Action 'send_message' → allow. (Minimum identity trust required for messaging)",
  triggeredRules: [{ ruleId: 'send-messages', description: '...' }],
  trustSnapshot: { dimensions: {...}, computedAt: ... },
  evaluatedAt: 1775000000000
}
```

## Decision History

Every decision is persisted. Debug why a user was denied at any point in time:

```typescript
dte.getDecisionHistory('user-abc', { limit: 10, action: 'send_message' });
```

## Rules

Rules are configured without code changes. Default rules are shipped but fully overridable:

```typescript
dte.addRule({
  ruleId: 'my-custom-rule',
  action: 'send_message',
  conditions: [
    { dimension: 'identity', operator: 'gte', value: 50 },
    { dimension: 'behavior', operator: 'gte', value: 40 },
  ],
  outcome: 'allow',
  priority: 100,
  enabled: true,
  description: 'My custom rule',
});
```

## Public API

| Method | Description |
|--------|-------------|
| `submitSignal(data)` | Submit a trust signal |
| `recalculateTrust(accountId, refTime?)` | Manually recalculate trust profile |
| `getTrustProfile(accountId)` | Get cached trust profile |
| `evaluateAction(accountId, action, refTime?)` | Evaluate whether an action should be allowed |
| `getAuditTrail(accountId, refTime?)` | Get full audit trail (events + decisions + profiles) |
| `getTrustExplanation(accountId, dimension, refTime?)` | Explainable breakdown of a dimension's score |
| `getDecisionHistory(accountId, options?)` | Browse past decisions |
| `removeSignal(signalId)` | Remove a signal |
| `updateSignal(signalId, updates)` | Update a signal |
| `addRule(rule)` | Add a rule |
| `removeRule(ruleId)` | Remove a rule |
| `getRules()` | List all rules |
| `registerSignalType(def)` | Register a custom signal type |
| `updateConfig(path, value)` | Update configuration at a dot path |

## Configuration

Weights, decay rates, and defaults are JSON-configurable:

```typescript
const dte = new DTE({
  dimensions: {
    identity: { weight: 1.0, halfLifeMs: 30 * 24 * 60 * 60 * 1000 },
    behavior: { weight: 0.8, halfLifeMs: 7 * 24 * 60 * 60 * 1000 },
  },
  rules: [...], // override default rules
});
```

## Principles

1. **Trust is earned, not assumed** — all accounts start with score 0 in all dimensions.
2. **No single signal determines trust** — signals combine with weighting, confidence, and decay.
3. **Every decision must be explainable** — the audit system provides full transparency.
4. **Trust changes dynamically over time** — signals decay and expire.
5. **Modules remain independent** — communicate only through interfaces.
6. **Framework-agnostic** — pure TypeScript, zero web dependencies, works in any Node.js application.
7. **Pluggable** — storage, signal types, rules, and decay functions are all extensible.

## License

MIT
