# StudySync AI — Adaptive Exam Companion

An intelligent, adaptive study planner and companion that prepares students for upcoming exams by structuring multi-subject study plans, scheduling spaced revision, conducting interactive focus sessions, and offering a notes-grounded AI tutor.

---

## Features

- **Automated Topic Extraction**: Upload notes in PDF, Word (`.docx`), plain text, Markdown (`.md`), CSV, or JSON. StudySync automatically extracts core topics, difficulty scores, and concept summaries.
- **Adaptive Study Planner**: Generates a day-by-day study calendar tailored to your exam date, daily study hour limit, and preferred start time. Hard topics automatically receive 1.5x time (+50% duration) and subjects are interleaved to prevent burnout.
- **Spaced Revision & Quizzing**: Automatically weaves periodic revision and active-recall checkpoints throughout your schedule.
- **Interactive Focus Session Player**:
  - **Focus Timer**: Visual countdown ring, sound chimes, play/pause, and +5m/-5m adjustments.
  - **3D Flashcard Decks**: Spaced-repetition practice cards with flip animations and mastery tracking.
  - **Concept Quizzes**: Multiple-choice assessments with instant explanations and score reports.
  - **Reference Notes**: Extracted key points and concepts available during study.
- **Intelligent Backlog & Rescheduling**: Automatically captures missed sessions and redistributes them into upcoming days with available capacity without exceeding daily limits.
- **Progress & History Dashboard**: Tracks completion rate, daily study streaks, total mastered hours, subject breakdown, and a full chronological activity log.
- **Grounded AI Companion**: Floating tutor with access to your uploaded notes and study plan to answer questions, explain difficult concepts, and cite sources.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Backend**: Node.js, Express, TypeScript (`tsx` in dev, `esbuild` for production bundle)
- **AI Integration**: Google Gemini via `@google/genai` TypeScript SDK
- **Authentication**: JWT token authentication with bcrypt password hashing

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm (v9+)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/studysync-ai.git
cd studysync-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the sample environment file:

```bash
cp .env.example .env
```

Set your configuration in `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
JWT_SECRET="your_custom_jwt_secret_here"
```

> **Note**: A Gemini API key is optional for standard rule-based planning, flashcards, and quizzes, but required for live AI responses from the floating chatbot and AI-enhanced topic extraction.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Build & Production

To compile both the Vite frontend and the Express backend bundle:

```bash
npm run build
npm start
```

---

## Project Structure

```
├── server.ts                 # Express API server entry point
├── server/
│   ├── db.ts                 # Persistent database service & models
│   ├── planBuilder.ts        # Adaptive study schedule algorithm
│   └── topicsExtractor.ts    # File parsing & topic extraction
├── src/
│   ├── App.tsx               # Main application component & state router
│   ├── types.ts              # TypeScript interfaces and data models
│   ├── lib/
│   │   └── api.ts            # Client-side API client & token storage
│   └── components/
│       ├── Header.tsx             # Navigation, streak counter & countdown
│       ├── TodayView.tsx          # Today's scheduled sessions & player launch
│       ├── PlanView.tsx           # Day-by-day adaptive plan visualization
│       ├── SessionPlayerModal.tsx # Timer, flashcard deck, quiz & notes player
│       ├── SubjectManager.tsx     # Subject & topic difficulty manager
│       ├── NotesUploader.tsx      # Multi-format notes upload & presets
│       ├── BacklogManager.tsx     # Missed sessions backlog & auto-rescheduler
│       ├── ProgressDashboard.tsx  # Analytics, streaks, and activity history
│       ├── ExamConfigModal.tsx    # Exam date, hours & start time settings
│       ├── AuthModal.tsx          # Student login, signup & reset modal
│       └── FloatingChatbot.tsx    # Grounded AI tutor drawer
├── index.html                # HTML entry point
├── package.json              # Project scripts and dependencies
└── tsconfig.json             # TypeScript compiler configuration
```

---

## License

Apache-2.0
