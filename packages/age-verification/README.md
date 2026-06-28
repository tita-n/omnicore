# @omnicore/age-verification

Age Verification Module (AVM) — an extensible, framework-agnostic age verification system built on Clean Architecture and SOLID principles. Part of the Omnicore trust ecosystem.

## What it is

AVM provides a structured pipeline for verifying user age through face capture, quality analysis, liveness detection, and age estimation. Milestone 1 defines the **architecture only** — all integrations (camera, face detection, liveness, age estimation) are defined as interfaces with no concrete implementations.

The pipeline sequence:  
`Camera → Face Detection → Quality Analysis → Liveness → Age Estimation → Confidence → Verification Result → DTE Connector`

## How to use

```typescript
import { AgeVerificationSDK, VerificationStatus } from '@omnicore/age-verification';

const avm = new AgeVerificationSDK({
  dteEndpoint: 'https://dte.example.com/signal'
});

// Create a verification session
const session = avm.createSession('user_abc', { locale: 'en-US' });
// session.status === VerificationStatus.CREATED

// Start verification (returns placeholder result in M1)
const result = await avm.startVerification(session.sessionId, 'user_abc');

// Check status
const status = avm.getVerificationStatus(session.sessionId);
// status === VerificationStatus.PROCESSING

// Cancel if needed
avm.cancelVerification(session.sessionId);

// Get result
const finalResult = avm.getVerificationResult(session.sessionId);
```

### Events

```typescript
avm.events$.on('verification_completed', (payload) => {
  console.log(payload.result.ageBand, payload.result.confidence);
});

avm.events$.on('verification_failed', (payload) => {
  console.error(payload.error.message);
});
```

## How to extend

All pipeline stages are defined as interfaces in `src/interfaces/`. Implement any interface and register it with the pipeline:

```typescript
import { VerificationPipeline } from '@omnicore/age-verification';

class MyFaceDetector implements FaceDetector {
  async detect(imageData, width, height) { /* ... */ }
  validate(detection, minConfidence) { /* ... */ }
  getModelInfo() { /* ... */ }
}

pipeline.registerStep({
  name: 'my_face_detection',
  execute: async (context) => { /* ... */ },
  canExecute: (context) => true,
  onError: async (context, error) => { /* ... */ },
});
```

### Available extension points

| Interface | Purpose |
|-----------|---------|
| `CameraProvider` | Camera access and frame capture |
| `FaceDetector` | Face detection in captured frames |
| `QualityAnalyzer` | Image quality assessment |
| `LivenessEngine` | Spoof/liveness detection |
| `AgeEstimator` | Age band estimation |
| `ConfidenceCalculator` | Overall confidence scoring |
| `DTEConnector` | Integration with Dynamic Trust Engine |

## Package structure

```
src/
├── config/       # Typed configuration with validation
├── connectors/   # DTE integration (public API only)
├── core/         # AgeVerificationSDK entry point
├── errors/       # Typed error hierarchy
├── events/       # Typed event system
├── interfaces/   # All provider interfaces (extension points)
├── models/       # Domain models (AgeBand, VerificationStatus, etc.)
├── pipeline/     # Pipeline orchestrator
├── services/     # (reserved for future implementations)
└── utils/        # (reserved for future helpers)
```

## Status

- **Milestone 1 (current)**: Architecture — interfaces, models, pipeline, config, events, errors, SDK skeleton
- **Milestone 2**: Concrete implementations (camera, face detection, age estimation)
- **Milestone 3**: Production hardening, optimization, browser integration

## License

MIT
