# Design Guidelines: Arabic-First Social Listening Platform

## Design Approach
**Selected System:** Material Design with data-dense application patterns
**Justification:** Internal analytics tool requiring clarity, efficiency, and support for RTL (Arabic-first). Material Design provides robust data visualization patterns and native RTL support.

## Core Design Principles
1. **Data Clarity First:** Information hierarchy prioritizes actionable insights
2. **Efficiency:** Minimal clicks to access critical data and actions
3. **RTL-Ready:** All layouts must work seamlessly in both LTR and RTL
4. **Scan-friendly:** Dense information presented with clear visual separation

## Typography

**Font Stack:**
- Primary: 'IBM Plex Sans Arabic' (supports Latin + Arabic) - 400, 500, 600 weights
- Monospace: 'IBM Plex Mono' for metrics and IDs

**Hierarchy:**
- Page titles: 2xl (30px), semibold
- Section headers: xl (24px), medium
- Card titles: lg (18px), medium
- Body/table text: base (16px), regular
- Labels/meta: sm (14px), regular
- Metrics (large): 3xl (36px), semibold

## Layout System

**Spacing Units:** Tailwind 2, 3, 4, 6, 8, 12, 16 units only
**Container:** max-w-7xl with px-4 md:px-6 lg:px-8
**Grid System:** 12-column grid for dashboard, single column for detail views

## Component Library

### Navigation
- **Top Bar:** Full-width sticky header (h-16) with logo left, navigation center, user menu right
- **Navigation Items:** Horizontal tabs with active underline indicator (border-b-2)
- **Admin Badge:** Distinct visual treatment for admin-only sections

### Dashboard Components

**KPI Cards:**
- Compact cards in 4-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Each card: padding p-6, rounded-lg border
- Large metric display (text-3xl) with label below (text-sm text-muted)
- Period comparison: small indicator showing +/- percentage with directional arrow
- Clickable: entire card is interactive with subtle hover state (no background color change)
- Analysis badge: top-right corner shows "Analyzed: X / Pending: Y" count

**Date Range Selector:**
- Prominent position: top of dashboard, mb-8
- Two date inputs side-by-side with "to" separator
- "Apply" button with loading state

**Charts:**
- Bar charts for sentiment distribution (horizontal bars, full width)
- Line charts for timeline trends (full width, h-64)
- Pie/donut for categorical breakdowns (centered, max-w-md)
- Clickable segments route to filtered explore view

### Data Table (Explore)

**Table Structure:**
- Full-width responsive table with horizontal scroll on mobile
- Sticky header row (position-sticky top-0)
- Alternating row backgrounds for scannability
- Row hover: subtle background change, entire row clickable
- Compact padding (px-3 py-2) for data density

**Columns:**
- Platform icon + name (w-32)
- Text preview (flex-1, truncate with ellipsis)
- Sentiment badge (w-24, colored pill)
- Reach/Engagement metrics (w-28, right-aligned)
- Date (w-32)
- Analysis status indicator (w-20, icon only)

**Filtering Panel:**
- Left sidebar (w-64) on desktop, collapsible on mobile
- Stacked filter groups with clear labels
- Multi-select dropdowns for platform, vertical, sentiment, topic
- Date range inputs at top
- "Clear All" and "Apply" buttons at bottom (sticky)

**Pagination:**
- Bottom of table: prev/next buttons + page numbers
- Rows per page selector (25, 50, 100)
- Total count display: "Showing 1-25 of 1,234"

### Admin Page

**Upload Zone:**
- Large drop zone (h-48) with dashed border
- Icon + instructional text centered
- File name display after selection
- Progress bar during upload (h-2, full width, animated)
- Success/error states with clear messaging

**Import Job Status:**
- Card-based layout showing active imports
- Progress indicator: processed/total rows with percentage bar
- Status badges: uploaded (blue), importing (yellow), done (green), failed (red)
- Action buttons: "Import" (primary), "Start AI Analysis" (secondary)
- Timestamp and duration display (text-sm, text-muted)

### Post Detail Page

**Layout:**
- Two-column on desktop (2/3 + 1/3 split)
- Main content: post text, full metrics, all metadata
- Sidebar: source info, analysis results, thread context

**Thread View:**
- Original post highlighted (border-l-4, bg-subtle)
- Replies listed chronologically below (pl-8 for indent)
- Each reply: compact card with text + basic metrics
- Visual connector line between posts

**Analysis Display:**
- Structured cards for each AI field
- Confidence score: progress bar visualization
- Sentiment: large colored badge
- Topics/verticals: tag-style chips
- Status indicator: "Analysis pending" banner for unanalyzed posts

### UI Elements

**Buttons:**
- Primary: solid background, medium height (h-10), px-6
- Secondary: outline style, same dimensions
- Icon buttons: square (h-10 w-10), centered icon
- Loading state: spinner replaces text/icon

**Badges/Pills:**
- Rounded-full, px-3, py-1, text-sm
- Sentiment colors: Positive (green tint), Negative (red tint), Neutral (gray)
- Platform badges: icon + text in brand color

**Form Inputs:**
- Consistent height (h-10)
- Border with focus ring
- Labels above inputs (text-sm, mb-1)
- Error states: red border + error text below

**Loading States:**
- Skeleton screens for tables (pulse animation)
- Spinner for async actions
- Progress bars for upload/import operations

## Images
This is an internal data tool - no hero images or marketing imagery needed. All visuals are data-driven (charts, icons, platform logos).

## Accessibility
- WCAG AA contrast ratios throughout
- Keyboard navigation for all interactive elements
- Screen reader labels for icon-only buttons
- Focus indicators on all focusable elements
- Arabic text rendered properly with RTL support