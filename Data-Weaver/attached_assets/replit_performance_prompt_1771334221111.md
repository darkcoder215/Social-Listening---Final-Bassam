## Task: Fix slow performance across the platform — DO NOT change any UI, design, layout, or functionality.

## Context
The platform displays data from Supabase tables: `instagram_data`, `instagram_posts`, `tiktok_data`, `tiktok_posts`, and `youtube_data`. Pages are extremely slow because queries timeout on large tables (300K-500K+ rows).

I've already added composite database indexes on all tables to speed up filtered queries:
- `instagram_data (account_name_ar, comment_timestamp)`
- `instagram_posts (account_name_ar, post_timestamp)`
- `tiktok_data (account_name_ar, comment_create_time_iso)`
- `tiktok_posts (account_name_ar, post_create_time)`
- `youtube_data (channel_name_ar, comment_published_at)`

Now I need you to optimize the frontend code to take advantage of these indexes and eliminate unnecessary data fetching.

---

## What to fix (in priority order):

### 1. Stop fetching all columns
Replace every `.select("*")` with only the columns actually used on that page. This alone dramatically reduces response size and query time.

### 2. Stop counting in JavaScript
Wherever the code does something like:
```javascript
const { data } = await supabase.from('table').select('*').eq(...)
const count = data.length  // ❌ pulls all rows just to count them
```
Replace with:
```javascript
const { count } = await supabase.from('table').select('*', { count: 'exact', head: true }).eq(...)  // ✅ returns only the count, zero data transfer
```

### 3. Always filter by date
Every query that touches these tables MUST include a date range filter using `.gte()` and `.lte()` on the timestamp column. Never query without a date filter — it forces a full table scan even with indexes.

### 4. Use 60-second cache
Set cache TTL to 60 seconds for all Supabase queries. Do NOT set cache to 0 — that kills performance. Only invalidate cache when the user changes a filter (date range or account).

### 5. Load data in parallel, not sequentially
On the Overview page and any page that shows multiple stats, fire all queries simultaneously with `Promise.all()` instead of awaiting them one by one. Show loading skeletons while data arrives.

### 6. Paginate all tables
Any table showing comments or posts must use server-side pagination:
- 25-50 rows per page max
- Use `.range(from, to)` from Supabase
- Do NOT fetch all rows and paginate in the frontend

### 7. Do NOT split one query into multiple daily queries
If a user selects a 7-day range, send ONE query with `.gte(startDate).lte(endDate)`. Do NOT loop day-by-day — the composite indexes handle date ranges efficiently in a single query.

---

## Critical rules — DO NOT:
- Change any UI, design, colors, layout, or component structure
- Change how data is displayed or what data is shown
- Remove or rename any tables or columns
- Delete or modify any data in the database
- Add new tables or columns
- Break any existing functionality
- Truncate or skip results to make queries faster — ALL matching data must still be returned

## Column reference (use these exact names):

| Table | Timestamp column | Filter column |
|-------|-----------------|---------------|
| instagram_data | comment_timestamp | account_name_ar |
| instagram_posts | post_timestamp | account_name_ar |
| tiktok_data | comment_create_time_iso | account_name_ar |
| tiktok_posts | post_create_time | account_name_ar |
| youtube_data | comment_published_at | channel_name_ar |

## After making changes:
1. Test every page (Overview, Instagram, TikTok, YouTube)
2. Verify the numbers shown are identical to before — no missing data
3. Confirm no page takes more than 3 seconds to load
4. Check browser console for any errors
