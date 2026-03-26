# Unified Social Listening Tool — Merge Plan

## Executive Summary

Merge the **Social Listening Tool (SLT)** and **Data-Weaver (DW)** into a single unified platform under the Thmanyah design system. The merged tool consolidates social media monitoring, AI-powered analysis, and multi-platform analytics into one cohesive application.

---

## 1. Feature Inventory & Overlap Analysis

### Current Social Listening Tool (SLT)
| Feature | Description | Data Source |
|---------|-------------|-------------|
| Dashboard | Landing hub with tool cards | — |
| Tweet Analysis | Real-time tweet search + AI sentiment analysis | Apify (scraping) + OpenRouter (AI) |
| Analysis History | Past tweet analyses stored in Supabase | Supabase `tweet_analyses` |
| Meltwater Report | Static/imported report viewer with 7 sections | Excel/CSV upload (xlsx) |

### Data-Weaver (DW)
| Feature | Description | Data Source |
|---------|-------------|-------------|
| Dashboard | KPI cards, sentiment charts, timeline, filters | PostgreSQL `mentions` table |
| Overview | Cross-platform activity timeline | Google Sheets / Supabase |
| X/Twitter | Tweet metrics, sentiment, activity trends | Google Sheets / Supabase |
| TikTok | Multi-account analytics, video comments | Apify + PostgreSQL `tiktokComments` |
| Instagram | Multi-account analytics, post comments | Google Sheets / Supabase |
| YouTube | Multi-channel analytics, video comments | Google Sheets / Supabase |
| Explore | Paginated mention filtering & search | PostgreSQL `mentions` |
| Admin | CSV upload, import management, AI analysis queue | PostgreSQL + OpenAI |
| Analytics | Per-platform detailed analytics drill-down | PostgreSQL |

### Overlap Map

| Capability | SLT | DW | Resolution |
|-----------|-----|-----|------------|
| Tweet/X analysis | Apify scrape + OpenRouter AI | Supabase/Sheets + OpenAI AI | **Merge**: Keep both — SLT's real-time search + DW's historical monitoring |
| Sentiment analysis | OpenRouter (per-search) | OpenAI GPT-4o-mini (batch) | **Unify**: Use OpenAI for both, keep OpenRouter as fallback |
| CSV/Report import | Meltwater xlsx import | CSV import pipeline | **Merge**: Unified import system supporting both xlsx and CSV |
| Dashboard | Simple tool hub | Full analytics dashboard | **Replace**: Use DW's analytics dashboard as main dashboard |
| History/storage | Supabase `tweet_analyses` | PostgreSQL `mentions` | **Keep both**: Different purposes (search history vs monitored mentions) |
| TikTok analytics | — | Full TikTok pipeline | **Adopt**: Bring in as-is |
| Instagram analytics | — | Full Instagram pipeline | **Adopt**: Bring in as-is |
| YouTube analytics | — | Full YouTube pipeline | **Adopt**: Bring in as-is |
| Date range filtering | — | Global context provider | **Adopt**: Apply across all pages |
| Comments sidebar | — | Reusable sheet drawer | **Adopt**: Use for all comment views |
| Admin/settings | — | Password-protected admin | **Adopt**: Integrate into unified settings |

---

## 2. Unified Architecture

### 2.1 Tech Stack (Final)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite | Keep SLT's Vite setup |
| Routing | react-router-dom v6 | Keep SLT's router (more feature-rich than wouter) |
| State/Data | TanStack React Query | Already in both tools |
| UI Components | shadcn/ui | Already in both tools |
| Charts | Recharts | Already in both tools |
| Styling | Tailwind CSS + Thmanyah Design System | SLT's brand system (fonts, colors, tokens) |
| Backend | Supabase Edge Functions + Express API | Supabase for tweet analysis, Express for DW features |
| Database | Supabase (PostgreSQL) | Migrate DW's Drizzle schema to Supabase |
| AI | OpenAI GPT-4o-mini (primary) + OpenRouter (fallback) | Unified AI pipeline |
| Scraping | Apify | Tweet search + TikTok comments |
| External Data | Google Sheets API | For Instagram/YouTube/X monitoring data |

### 2.2 Unified Route Structure

```
/                          → Dashboard (analytics overview — replaces simple hub)
/tweet-analysis            → Real-time Tweet Search & Analysis (SLT feature)
/tweet-analysis/history    → Tweet Analysis History (SLT feature)
/monitoring                → Social Monitoring Hub (new unified page)
/monitoring/x              → X/Twitter Monitoring (DW feature)
/monitoring/tiktok         → TikTok Monitoring (DW feature)
/monitoring/tiktok/:user   → TikTok Account Detail (DW feature)
/monitoring/instagram      → Instagram Monitoring (DW feature)
/monitoring/instagram/:user→ Instagram Account Detail (DW feature)
/monitoring/youtube        → YouTube Monitoring (DW feature)
/monitoring/youtube/:id    → YouTube Channel Detail (DW feature)
/explore                   → Data Explore & Search (DW feature)
/reports                   → Reports Hub (new)
/reports/meltwater         → Meltwater Report Viewer (SLT feature)
/settings                  → Admin & Settings (DW feature, expanded)
```

### 2.3 Navigation Design

Replace the current simple Dashboard hub with a **sidebar navigation** layout (matching the Thmanyah design system):

```
┌──────────────────────────────────────────────────┐
│  [Logo]  ثمانية — الرصد الاجتماعي    [Settings] │
├─────────────┬────────────────────────────────────┤
│             │                                    │
│  لوحة       │                                    │
│  المعلومات  │         Main Content Area          │
│             │                                    │
│  ─────────  │                                    │
│             │                                    │
│  تحليل      │                                    │
│  التغريدات  │                                    │
│             │                                    │
│  ─────────  │                                    │
│             │                                    │
│  الرصد      │                                    │
│  ├ تويتر    │                                    │
│  ├ تيك توك  │                                    │
│  ├ إنستغرام │                                    │
│  └ يوتيوب   │                                    │
│             │                                    │
│  ─────────  │                                    │
│             │                                    │
│  استكشاف   │                                    │
│             │                                    │
│  التقارير   │                                    │
│  ├ ميلت     │                                    │
│  │ ووتر     │                                    │
│             │                                    │
│  ─────────  │                                    │
│             │                                    │
│  الإعدادات  │                                    │
│             │                                    │
└─────────────┴────────────────────────────────────┘
```

**Sidebar sections:**
1. **لوحة المعلومات** (Dashboard) — Analytics overview with KPIs
2. **تحليل التغريدات** (Tweet Analysis) — Real-time search tool
3. **الرصد** (Monitoring) — Collapsible sub-menu for 4 platforms
4. **استكشاف** (Explore) — Data exploration & filtering
5. **التقارير** (Reports) — Meltwater and future reports
6. **الإعدادات** (Settings) — Admin, imports, API keys

---

## 3. Implementation Phases

### Phase 1: Foundation & Layout (Estimated: Core Setup)

**Goal**: Establish the unified layout, navigation, and shared infrastructure.

**Tasks**:
1. Create `src/components/layout/Sidebar.tsx` — Collapsible RTL sidebar with Thmanyah styling
2. Create `src/components/layout/AppLayout.tsx` — Main layout wrapper (sidebar + content area)
3. Update `src/App.tsx` — New route structure with nested layouts
4. Create `src/contexts/DateRangeContext.tsx` — Port DW's date range filter context
5. Create `src/components/shared/DateRangeFilter.tsx` — Reusable date picker
6. Create `src/components/shared/CommentsSidebar.tsx` — Port DW's comments drawer
7. Create `src/components/shared/KPICard.tsx` — Reusable metric card component
8. Create `src/lib/accountLogos.ts` — Port DW's account logo mapping

**Design tokens to add to `index.css`**:
- Sidebar variables (already exist from SLT's design system)
- Chart color palette from DW (mapped to Thmanyah brand colors)

---

### Phase 2: Analytics Dashboard (Replace Simple Hub)

**Goal**: Replace the current Dashboard hub with DW's full analytics dashboard.

**Tasks**:
1. Rewrite `src/pages/Dashboard.tsx` — Full analytics dashboard with:
   - 4 KPI cards (mentions, reach, engagement, sentiment)
   - Period comparison (current vs previous)
   - Sentiment distribution pie chart
   - Sentiment trend line chart
   - Platform distribution bar chart
   - Topic distribution bar chart
   - Posts timeline
   - Top authors & hashtags
2. Create `src/services/dashboardApi.ts` — API client for dashboard stats
3. Create `src/hooks/useDashboardData.ts` — React Query hook for dashboard

**Data source**: Will need a backend endpoint. Options:
- **Option A**: Supabase Edge Function (`dashboard-stats`) that queries the mentions table
- **Option B**: Lightweight Express API proxy (preferred for complex aggregations)

---

### Phase 3: Multi-Platform Monitoring

**Goal**: Bring in DW's platform-specific monitoring pages.

**Tasks per platform** (X, TikTok, Instagram, YouTube):

1. Create `src/pages/monitoring/MonitoringHub.tsx` — Platform cards overview
2. Port platform pages with Thmanyah design system:
   - `src/pages/monitoring/XMonitoring.tsx`
   - `src/pages/monitoring/TikTokMonitoring.tsx`
   - `src/pages/monitoring/TikTokAccount.tsx`
   - `src/pages/monitoring/InstagramMonitoring.tsx`
   - `src/pages/monitoring/InstagramAccount.tsx`
   - `src/pages/monitoring/YouTubeMonitoring.tsx`
   - `src/pages/monitoring/YouTubeChannel.tsx`
3. Create API services for each platform:
   - `src/services/sheetsApi.ts` — Google Sheets data fetching
   - `src/services/supabaseData.ts` — Supabase platform data
4. Port DW's backend endpoints to Supabase Edge Functions or keep as Express API

**Styling changes** (DW → Thmanyah):
- Replace IBM Plex Sans Arabic → Thmanyah Sans
- Replace green (#2a9d4e) → Thmanyah Green (#00C17A)
- Replace card backgrounds → `bg-card` with `border-border`
- Apply `rounded-2xl` brand radius
- Use `font-display` for section headings

---

### Phase 4: Data Explore & Search

**Goal**: Port DW's Explore page for filtering and searching all mentions.

**Tasks**:
1. Create `src/pages/Explore.tsx` — Paginated mention browser with:
   - Filter by: platform, sentiment, topic, content vertical, date range
   - Sort by: date, reach, engagement
   - Post cards with sentiment badges
   - Click-through to post detail
2. Create `src/pages/PostDetail.tsx` — Individual mention detail view
3. Create `src/services/exploreApi.ts` — Explore API client

---

### Phase 5: Unified Import & Admin

**Goal**: Merge SLT's Meltwater xlsx import with DW's CSV import pipeline.

**Tasks**:
1. Create `src/pages/Settings.tsx` — Unified admin page with tabs:
   - **Import**: CSV + XLSX upload with progress tracking
   - **Analysis Queue**: AI analysis status and controls
   - **API Keys**: Configure Apify, OpenAI, Supabase tokens
   - **TikTok Accounts**: Manage monitored accounts
2. Create unified import pipeline:
   - `src/services/importApi.ts` — Upload and import management
   - Backend: Supabase Edge Function or Express endpoint for CSV/XLSX processing
3. Migrate Meltwater report to use the unified `mentions` table:
   - Parse Meltwater xlsx → mentions format
   - AI analysis on imported Meltwater data
   - Generate Meltwater report from analyzed mentions

---

### Phase 6: Backend Consolidation

**Goal**: Unify backend services into a coherent API layer.

**Options**:

**Option A: Supabase-First (Recommended)**
- Migrate DW's PostgreSQL schema to Supabase tables
- Convert DW's Express endpoints to Supabase Edge Functions
- Keep existing SLT Edge Functions (`analyze-tweets`)
- Benefits: Single backend, no Express server needed, scales better

**Option B: Hybrid**
- Keep Supabase for auth-less data storage
- Add Express API server for complex operations (CSV parsing, AI batch analysis)
- Benefits: Easier migration, more control over batch processing

**Schema Migration** (DW Drizzle → Supabase):
```sql
-- Core tables to create in Supabase
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT,
  url TEXT,
  platform TEXT,
  author_name TEXT,
  author_handle TEXT,
  text TEXT,
  clean_text TEXT,
  country TEXT,
  language TEXT,
  reach BIGINT,
  engagement BIGINT,
  likes BIGINT,
  replies BIGINT,
  shares BIGINT,
  -- AI analysis fields
  analysis_status TEXT DEFAULT 'pending',
  ai_sentiment TEXT,
  ai_topic TEXT,
  ai_stance TEXT,
  confidence_score REAL,
  short_reason TEXT,
  -- Timestamps
  hit_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE import_jobs (...);
CREATE TABLE tiktok_comments (...);
CREATE TABLE tiktok_accounts (...);
CREATE TABLE tiktok_videos (...);
```

---

## 4. Feature Deduplication Rules

| Duplicate Area | Keep From | Discard From | Rationale |
|---------------|-----------|--------------|-----------|
| Tweet search | SLT | — | SLT has real-time Apify search; DW has no equivalent |
| X monitoring | DW | — | DW has ongoing monitoring; SLT has no equivalent |
| Sentiment AI | Both (unified) | — | Use OpenAI as primary, keep OpenRouter as fallback option |
| Dashboard | DW (analytics) | SLT (hub) | DW's dashboard has real analytics; SLT's is just navigation |
| Navigation | New (sidebar) | Both | Neither current nav is suitable for the merged tool |
| CSV import | DW | — | DW has robust pipeline with progress tracking |
| XLSX import | SLT | — | SLT handles Meltwater xlsx format |
| Report viewer | SLT (Meltwater) | — | Unique to SLT |
| TikTok | DW | — | Unique to DW |
| Instagram | DW | — | Unique to DW |
| YouTube | DW | — | Unique to DW |
| Date filtering | DW | — | DW has context-based global filtering |
| Comments sidebar | DW | — | Reusable component for all platforms |
| Theme toggle | DW (light/dark) | — | Port with Thmanyah color tokens |
| Analysis history | SLT | — | Keep for tweet search results |
| Admin panel | DW | — | CSV upload + AI queue management |

---

## 5. Design System Application

All ported DW components will be restyled to match the Thmanyah design system:

### Typography
- **Headings (h1-h3)**: `Thmanyah Serif Display` (replace IBM Plex Sans Arabic)
- **Body (h4-h6, p, labels)**: `Thmanyah Sans` (replace IBM Plex Sans Arabic)
- **Long-form text**: `Thmanyah Serif Text`

### Colors
| DW Token | Thmanyah Equivalent |
|----------|-------------------|
| Primary green `hsl(152 69% 31%)` | `--thmanyah-green: 155 100% 38%` (#00C17A) |
| Background white | `--background: 36 30% 96%` (#F7F4EE) |
| Card `#FAFAF8` | `--card: 0 0% 100%` (white) |
| Dark bg `#0A0A0A` | `--foreground: 0 0% 0%` (black) |
| Chart blue | `--thmanyah-blue: 213 100% 49%` |
| Chart red | `--thmanyah-red: 8 88% 58%` |
| Chart amber | `--thmanyah-amber: 43 100% 52%` |

### Components
- **Cards**: `rounded-2xl` (brand radius), `bg-card`, `border border-border`
- **Buttons**: `rounded-full` for primary actions, `rounded-xl` for secondary
- **KPI Cards**: Thmanyah brand color at 4% opacity backgrounds
- **Charts**: Thmanyah color palette with brand greens, blues, reds
- **Badges/Tags**: `rounded-full` with brand color backgrounds at 10-15% opacity
- **Sidebar**: Dark theme (`bg-foreground`) with white text

---

## 6. Migration Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DW uses Express server; SLT is Vite-only | Need to add server or convert to Edge Functions | Start with Supabase Edge Functions; add Express only if needed |
| DW's Google Sheets integration relies on Replit Connectors | Won't work outside Replit | Replace with direct Google Sheets API using service account credentials |
| DW's PostgreSQL is separate from SLT's Supabase | Data migration needed | Create Supabase tables matching DW schema; write migration script |
| DW uses wouter routing; SLT uses react-router-dom | Route structure differs | Rewrite all routes using react-router-dom (already planned) |
| DW's TikTok sync uses Apify with memory limits | Could be expensive | Keep safe mode controls; add cost monitoring |
| Large codebase merge could introduce regressions | Feature breakage | Phase the merge; test each phase independently |

---

## 7. Priority Order

1. **Phase 1** — Foundation (sidebar layout, shared components, route structure)
2. **Phase 3** — Multi-Platform Monitoring (highest new value — 4 platforms)
3. **Phase 2** — Analytics Dashboard (replaces simple hub with real analytics)
4. **Phase 4** — Data Explore (search and filter all data)
5. **Phase 5** — Unified Import & Admin
6. **Phase 6** — Backend Consolidation (can happen incrementally)

This order prioritizes visible user value first (new platforms, better dashboard) while deferring complex backend work that can be done incrementally.

---

## 8. Files to Create / Modify

### New Files (~25 files)
```
src/components/layout/Sidebar.tsx
src/components/layout/AppLayout.tsx
src/contexts/DateRangeContext.tsx
src/components/shared/DateRangeFilter.tsx
src/components/shared/CommentsSidebar.tsx
src/components/shared/KPICard.tsx
src/lib/accountLogos.ts
src/pages/monitoring/MonitoringHub.tsx
src/pages/monitoring/XMonitoring.tsx
src/pages/monitoring/TikTokMonitoring.tsx
src/pages/monitoring/TikTokAccount.tsx
src/pages/monitoring/InstagramMonitoring.tsx
src/pages/monitoring/InstagramAccount.tsx
src/pages/monitoring/YouTubeMonitoring.tsx
src/pages/monitoring/YouTubeChannel.tsx
src/pages/Explore.tsx
src/pages/PostDetail.tsx
src/pages/Settings.tsx
src/services/dashboardApi.ts
src/services/sheetsApi.ts
src/services/supabaseData.ts
src/services/exploreApi.ts
src/services/importApi.ts
src/hooks/useDashboardData.ts
```

### Modified Files (~8 files)
```
src/App.tsx                    — New route structure
src/pages/Dashboard.tsx        — Complete rewrite (analytics)
src/pages/Index.tsx            — Minor (wrap in AppLayout)
src/pages/History.tsx          — Minor (wrap in AppLayout)
src/pages/MeltwaterReport.tsx  — Minor (wrap in AppLayout, move to /reports/meltwater)
src/index.css                  — Add chart color tokens, sidebar enhancements
tailwind.config.ts             — Add new color utilities if needed
package.json                   — Add new dependencies (date-fns, etc.)
```

### Files Unchanged
```
src/components/TweetAnalysisForm.tsx
src/components/AnalysisResults.tsx
src/components/AnalysisProgress.tsx
src/components/AnalysisDocumentation.tsx
src/components/ui/*              — All shadcn components
supabase/functions/*             — Existing edge functions
```
