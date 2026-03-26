# مرئيات جمهور «ثمانية» (Social Listening Platform)

## Overview

"وش يقولون عن ثمانية؟" is an internal social listening platform designed for Arabic-first analysis of social media mentions. It aggregates and analyzes data from major platforms like X (Twitter), TikTok, Instagram, and YouTube. The platform's core purpose is to provide insights into public sentiment and topics related to Thmanyah, enabling comprehensive monitoring and strategic decision-making. It supports both manual and semi-automated data ingestion and offers AI-powered sentiment and topic analysis tailored for Arabic content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter.
- **State Management**: TanStack React Query.
- **UI Components**: shadcn/ui built on Radix UI with Tailwind CSS.
- **Design System**: Material Design, optimized for data-dense, RTL (Arabic) applications.
- **Typography**: IBM Plex Sans Arabic.
- **UI/UX**: Green accent (hue 152) with dark/light mode support.

### Backend
- **Runtime**: Node.js with Express.
- **API Pattern**: RESTful API under `/api/*`.
- **File Handling**: Formidable for multipart file uploads.
- **CSV Processing**: `csv-parse` for streaming.
- **Build System**: esbuild for server, Vite for client.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Schema**: `shared/schema.ts`.
- **Migrations**: Drizzle Kit in `/migrations`.
- **Key Tables**: `mentions` (social media mentions, AI analysis), `importJobs` (CSV import tracking), `conversations`, and `messages` (AI chat).
- **Data Source**: Primarily PostgreSQL. Supabase can be used as an optional cloud database.

### Authentication
- Simple password-based admin authentication with in-memory session management.

### AI Integration
- **Provider**: OpenAI API (via Replit AI Integrations).
- **Model**: gpt-4o-mini for sentiment and topic analysis.
- **Features**: Sentiment analysis, topic extraction, key points, context-aware analysis.
- **Analysis Version**: `ar_v2` (Arabic-first outputs, Thmanyah-focused).
- **Output Language**: All AI outputs are in Arabic (e.g., `ai_sentiment`: إيجابي | سلبي | محايد; `ai_topic`: جودة النقل | التطبيق والاشتراك | مشكلة تقنية | التعليق والمراسلين | الحياد والتحيز | التغطية والمحتوى | إشادة | شكوى | سخرية | اقتراح | غير متعلق بثمانية).
- **Batch Processing**: Custom utility for rate limiting and retries.
- **Text Cleaning**: Removes URLs, RT/QT prefixes, reply mentions, normalizes whitespace.
- **Context Handling**: Extracts original URLs for replies/quotes, uses tweet IDs for context lookup.

### Key Design Decisions
- **Server-side Pagination**: For all data tables.
- **Streaming CSV Import**: Row-by-row processing.
- **Batch AI Analysis**: With concurrency controls.
- **Monorepo Structure**: Client, server, and shared code.
- **Cost Control**: All automatic cost-generating features (e.g., TikTok auto-sync, automatic data refresh) are disabled by default, requiring manual triggers.
- **Server-side Date Filtering**: Date parameters pushed to database queries.
- **Server-side Pagination**: Comments paginated (default 500 per page).
- **Timeline Computation**: `channelTimeline`/`accountTimeline` computed server-side.
- **Caching**: 5-minute TTL date-range aware cache.
- **Supabase Query Optimization**: `ORDER BY` uses primary keys for stable pagination, then sorted in memory by date.

### Multi-Platform Architecture
- **Platform Support**: X (Twitter) via Meltwater CSV, TikTok via Apify.
- **Navigation**: Two-tier (Overview | X | TikTok) with platform-specific sub-navigation.
- **Account Display**: Predefined Thmanyah accounts are always visible on platform pages, even with zero activity.
- **Multi-Line Charts**: Displays per-account/channel activity with custom colors for Thmanyah brands.

## External Dependencies

### Databases
- **PostgreSQL**: Primary database.
- **Supabase**: Optional for cloud database features.

### AI Services
- **OpenAI API**: For AI analysis.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `ADMIN_PASSWORD`: Admin login password.
- `SESSION_SECRET`: Session signing secret.
- `APIFY_API_TOKEN`: Apify API token (for TikTok sync).
- `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API credentials.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase credentials (optional).

### Key NPM Packages
- `drizzle-orm`, `drizzle-kit`: ORM and migrations.
- `formidable`: File uploads.
- `csv-parse`: CSV parsing.
- `openai`: OpenAI API client.
- `p-limit`, `p-retry`: Batch processing.
- `recharts`: Data visualization.
- `date-fns`: Date manipulation.