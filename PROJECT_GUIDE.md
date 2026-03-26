# Social Listening Tool - Thmanyah

> AI-Powered Social Listening & Analysis Platform for Thmanyah (ثمانية)

---

## Overview

This is a comprehensive **social listening and AI-powered analysis platform** built for Thmanyah, a Saudi media company. The tool provides three major capabilities:

1. **Tweet / Social Media Sentiment Analysis** - Analyze tweet sentiments using AI
2. **Commentary / Speech Analysis** - Upload and analyze Arabic audio commentary with emotional scoring
3. **Candidate Hunter** - LinkedIn candidate search, enrichment, and qualification assessment

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 (SWC) |
| **Styling** | Tailwind CSS 3 + Thmanyah Design System |
| **UI Library** | shadcn-ui (Radix UI primitives) |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form + Zod validation |
| **State** | TanStack React Query |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Auth** | Supabase Auth |
| **Charts** | Recharts |
| **Export** | XLSX, jsPDF, html2canvas |
| **LLMs** | OpenAI Whisper, Claude (via OpenRouter) |

---

## Project Structure

```
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Router config
│   ├── index.css                   # Global styles & design tokens
│   ├── components/
│   │   ├── ui/                     # shadcn-ui base components
│   │   ├── meltwater/              # Meltwater report components
│   │   ├── CommentaryAnalysisForm.tsx
│   │   ├── CommentaryProgress.tsx
│   │   ├── CommentaryResults.tsx
│   │   ├── TweetAnalysisForm.tsx
│   │   ├── TweetsTable.tsx
│   │   ├── AnalysisResults.tsx
│   │   ├── AnalysisProgress.tsx
│   │   ├── AnalysisDocumentation.tsx
│   │   ├── QueryBuilder.tsx
│   │   ├── SentimentPieChart.tsx
│   │   ├── TagInput.tsx
│   │   └── ExpandableImage.tsx
│   ├── pages/
│   │   ├── Index.tsx               # Home / Dashboard
│   │   ├── Auth.tsx                # Login / Signup
│   │   ├── Dashboard.tsx           # Tweet analysis workspace
│   │   ├── History.tsx             # Analysis history
│   │   ├── CommentaryAnalysis.tsx  # Commentary tool
│   │   ├── CommentaryHistory.tsx   # Commentary reports list
│   │   ├── CommentaryReportDetail.tsx
│   │   ├── CandidateHunter.tsx     # LinkedIn candidate search
│   │   ├── CandidateHistory.tsx    # Saved candidates
│   │   ├── MeltwaterReport.tsx     # Meltwater data analysis
│   │   └── NotFound.tsx
│   ├── integrations/supabase/      # Supabase client & types
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Utilities
├── supabase/
│   ├── migrations/                 # Database migrations
│   └── functions/                  # Edge functions
│       ├── analyze-commentary/
│       ├── analyze-tweets/
│       ├── search-linkedin-candidates/
│       ├── enrich-candidate/
│       ├── reanalyze-candidate/
│       └── analyze-demographics/
├── Usable/                         # Brand assets (fonts, logo, PDF)
├── DESIGN_GUIDE.md                 # Thmanyah design system reference
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | Index | Home page with navigation to all tools |
| `/auth` | Auth | Login and signup |
| `/dashboard` | Dashboard | Tweet sentiment analysis workspace |
| `/history` | History | Tweet analysis history |
| `/commentary-analysis` | CommentaryAnalysis | Audio commentary analysis |
| `/commentary-history` | CommentaryHistory | Commentary reports list |
| `/commentary-history/:id` | CommentaryReportDetail | Individual report view |
| `/candidate-hunter` | CandidateHunter | LinkedIn candidate search |
| `/candidate-history` | CandidateHistory | Saved candidates |
| `/meltwater-report` | MeltwaterReport | Meltwater data analysis |

---

## Design System

The UI follows the **Thmanyah Brand Identity v2.0**. Key design principles:

- **Typography**: Three custom font families (Serif Display, Serif Text, Sans) in 5 weights each
- **Colors**: Black primary, Green (#00C17A) accent, Off-White (#F7F4EE) backgrounds
- **Layout**: RTL-first, 12-column grid, 8px spacing grid
- **Components**: Rounded corners (12-16px), pill-shaped buttons, dark sidebar navigation
- **Scores**: Color-coded semantic mapping (Green=Excellent, Amber=Average, Red=Poor)

See `DESIGN_GUIDE.md` for complete specifications.

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 8080)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

---

## Environment Variables

The project requires a `.env` file with Supabase credentials. See `.env` for the required keys.

---

## Key Features

### Tweet Analysis
- Upload or paste tweets for AI sentiment analysis
- Query builder for complex filters
- Sentiment pie charts and data tables
- Export results to Excel

### Commentary Analysis
- Upload audio files for transcription (Whisper API)
- AI-powered commentary scoring across multiple criteria
- Emotional analysis and timestamp-based segments
- Typo correction using Claude Sonnet

### Candidate Hunter
- LinkedIn profile search and scraping
- AI enrichment and qualification assessment
- Demographic inference
- Relevancy scoring

### Meltwater Reports
- Import social listening data
- Topic KPIs and categorization
- Timeline charts and word clouds
- Excel export with formatting

---

## Related Documentation

- `DESIGN_GUIDE.md` - Comprehensive design system
- `IMPLEMENTATION_SUMMARY.md` - Feature implementation details
- `TESTING_GUIDE.md` - Test execution instructions
- `COMMENTARY_ERROR_HANDLING.md` - Error handling strategy
