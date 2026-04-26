# AI Presentation Evaluator

> AI-powered presentation analysis platform that evaluates confidence, speech clarity, eye contact, facial expressions, and provides personalized coaching feedback.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│   React 18 + Vite + Tailwind CSS + Recharts     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Upload   │  │  Login   │  │   Results    │  │
│  │  Zone     │  │  Page    │  │   Dashboard  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ Firebase SDK
┌──────────────────────┴──────────────────────────┐
│              Firebase Services                    │
│                                                   │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │   Auth    │  │ Firestore │  │   Storage   │  │
│  └───────────┘  └─────┬─────┘  └──────┬──────┘  │
│                       │                │          │
│  ┌────────────────────┴────────────────┴───────┐ │
│  │         Cloud Functions (Node.js 20)         │ │
│  │                                              │ │
│  │  Storage Trigger → Pipeline Orchestrator     │ │
│  │                                              │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │            Analysis Pipeline            │ │ │
│  │  │                                         │ │ │
│  │  │  Audio Extraction (FFmpeg)              │ │ │
│  │  │  Speech-to-Text (Whisper API)           │ │ │
│  │  │  Filler Word Detection                  │ │ │
│  │  │  Pause Detection                        │ │ │
│  │  │  Frame Sampling (FFmpeg)                │ │ │
│  │  │  Face Detection (MediaPipe)             │ │ │
│  │  │  Eye Contact Analysis                   │ │ │
│  │  │  Emotion Analysis                       │ │ │
│  │  │  Scoring Engine                         │ │ │
│  │  │  Feedback Generator (Claude Sonnet)     │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v4 + Recharts |
| Auth & DB | Firebase Auth + Firestore |
| File Storage | Firebase Storage |
| Backend Functions | Firebase Cloud Functions (Node.js 20) |
| Video Processing | FFmpeg (via fluent-ffmpeg) |
| Speech-to-Text | OpenAI Whisper API |
| Computer Vision | MediaPipe FaceMesh + BlazeFace |
| LLM Feedback | Claude Sonnet 4 via Anthropic API |

## Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- FFmpeg installed and in PATH
- OpenAI API key
- Anthropic API key
- Firebase project with Auth, Firestore, and Storage enabled

## Setup

### 1. Clone and Install

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys
npm install

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your Firebase config
npm install
```

### 2. Firebase Setup

```bash
firebase login
firebase init
# Select: Firestore, Storage, Functions
# Set project ID in .firebaserc
```

### 3. Configure Environment Variables

**Backend `.env`:**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

**Frontend `.env`:**
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-your-project-id.cloudfunctions.net
```

### 4. Run Locally

```bash
# Backend (Firebase Emulator)
cd backend
npm run serve

# Frontend
cd frontend
npm run dev
```

### 5. Deploy

```bash
# Deploy Cloud Functions
cd backend
npm run deploy

# Build and deploy frontend
cd frontend
npm run build
firebase deploy --only hosting
```

## Scoring Algorithm

```
overallScore = (
  confidenceScore × 0.30 +
  speechClarityScore × 0.25 +
  eyeContactScore × 0.25 +
  engagementScore × 0.20
)
```

| Metric | Weight | Factors |
|--------|--------|---------|
| Confidence | 30% | Base score − filler penalty − pause penalty + emotion stability bonus |
| Speech Clarity | 25% | WPM normalization + articulation + volume consistency |
| Eye Contact | 25% | Gaze direction tracking via face landmarks |
| Engagement | 20% | Emotion variety + eye contact + pace appropriateness |

## Pipeline Steps

1. **Audio Extraction** — FFmpeg extracts mono 16kHz WAV
2. **Speech-to-Text** — Whisper API transcribes with word timestamps
3. **Filler Word Detection** — Pattern matching on transcript
4. **Pause Detection** — Identifies gaps >2 seconds
5. **Frame Sampling** — Extracts 1 frame/second via FFmpeg
6. **Face Detection** — MediaPipe/BlazeFace landmark detection
7. **Eye Contact Analysis** — Gaze direction from eye landmarks
8. **Emotion Analysis** — Facial expression classification
9. **Scoring Engine** — Weighted composite scoring
10. **Feedback Generator** — Claude Sonnet generates coaching feedback

## Firestore Schema

```
/users/{userId}
  - email, displayName, createdAt, totalAnalyses

/videos/{videoId}
  - userId, fileName, storageUrl, uploadedAt, status, duration

/analysis_results/{videoId}
  - transcript, fillerWords[], pauses[], eyeContactScore
  - emotionData[], speechMetrics, scores, feedback
```

## License

MIT
