# DTE Core Development

## Build

```bash
npm run build      # tsc -> dist/
npm test           # run test suite (node:test + tsx)
npm run test:unit  # unit tests only
npm run test:integration  # integration tests only
```

## Project Structure

```
src/
  types/         - Data model (Signal, TrustProfile, Decision, Rule, etc.)
  interfaces/    - All module interfaces (ITrustStorage, ITrustCalculator, etc.)
  signal-engine/ - SignalRegistry + SignalEngine (signal validation, storage, lifecycle)
  trust-calculator/ - TrustCalculator + decay functions
  decision-engine/  - DecisionEngine (orchestrates calculator + rules)
  rules-engine/  - RulesEngine (evaluate rules against trust profiles)
  event-logger/  - EventLogger (observability)
  audit-system/  - AuditSystem (explainability)
  config/        - ConfigManager + defaults
  storage/       - MemoryTrustStorage (implements ITrustStorage)
  dte.ts         - DTE orchestrator (wires all modules)
  index.ts       - Public API barrel
```

## Conventions

- All modules depend on interfaces, not concrete classes
- No `.js` file extensions in imports (tsx handles resolution)
- Deterministic calculations: TrustCalculator accepts `referenceTime` parameter
- Signals are validated at submission (value -100..100, confidence 0..100)
- Every decision includes explanation + triggered rules + trust snapshot
- Tests use `node:test` + `node:assert/strict` (not Jest)
