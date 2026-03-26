-- ============================================================
-- Timeline RPCs: Hourly, Weekly, Monthly granularity
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── TikTok ──

CREATE OR REPLACE FUNCTION get_tiktok_comments_per_hour(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('hour', comment_create_time_iso), 'YYYY-MM-DD HH24:00') AS date,
    COUNT(*) AS count
  FROM tiktok_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_create_time_iso >= p_date_from)
    AND (p_date_to IS NULL OR comment_create_time_iso <= p_date_to)
  GROUP BY date_trunc('hour', comment_create_time_iso)
  ORDER BY date_trunc('hour', comment_create_time_iso);
$$;

CREATE OR REPLACE FUNCTION get_tiktok_comments_per_week(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('week', comment_create_time_iso), 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM tiktok_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_create_time_iso >= p_date_from)
    AND (p_date_to IS NULL OR comment_create_time_iso <= p_date_to)
  GROUP BY date_trunc('week', comment_create_time_iso)
  ORDER BY date_trunc('week', comment_create_time_iso);
$$;

CREATE OR REPLACE FUNCTION get_tiktok_comments_per_month(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('month', comment_create_time_iso), 'YYYY-MM') AS date,
    COUNT(*) AS count
  FROM tiktok_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_create_time_iso >= p_date_from)
    AND (p_date_to IS NULL OR comment_create_time_iso <= p_date_to)
  GROUP BY date_trunc('month', comment_create_time_iso)
  ORDER BY date_trunc('month', comment_create_time_iso);
$$;

-- ── Instagram ──

CREATE OR REPLACE FUNCTION get_instagram_comments_per_hour(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('hour', comment_timestamp), 'YYYY-MM-DD HH24:00') AS date,
    COUNT(*) AS count
  FROM instagram_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR comment_timestamp <= p_date_to)
  GROUP BY date_trunc('hour', comment_timestamp)
  ORDER BY date_trunc('hour', comment_timestamp);
$$;

CREATE OR REPLACE FUNCTION get_instagram_comments_per_week(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('week', comment_timestamp), 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM instagram_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR comment_timestamp <= p_date_to)
  GROUP BY date_trunc('week', comment_timestamp)
  ORDER BY date_trunc('week', comment_timestamp);
$$;

CREATE OR REPLACE FUNCTION get_instagram_comments_per_month(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('month', comment_timestamp), 'YYYY-MM') AS date,
    COUNT(*) AS count
  FROM instagram_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR comment_timestamp <= p_date_to)
  GROUP BY date_trunc('month', comment_timestamp)
  ORDER BY date_trunc('month', comment_timestamp);
$$;

-- ── YouTube ──

CREATE OR REPLACE FUNCTION get_youtube_comments_per_hour(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('hour', comment_published_at::timestamptz), 'YYYY-MM-DD HH24:00') AS date,
    COUNT(*) AS count
  FROM youtube_data
  WHERE (p_account IS NULL OR account_name = p_account)
    AND (p_date_from IS NULL OR comment_published_at::timestamptz >= p_date_from)
    AND (p_date_to IS NULL OR comment_published_at::timestamptz <= p_date_to)
  GROUP BY date_trunc('hour', comment_published_at::timestamptz)
  ORDER BY date_trunc('hour', comment_published_at::timestamptz);
$$;

CREATE OR REPLACE FUNCTION get_youtube_comments_per_week(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('week', comment_published_at::timestamptz), 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM youtube_data
  WHERE (p_account IS NULL OR account_name = p_account)
    AND (p_date_from IS NULL OR comment_published_at::timestamptz >= p_date_from)
    AND (p_date_to IS NULL OR comment_published_at::timestamptz <= p_date_to)
  GROUP BY date_trunc('week', comment_published_at::timestamptz)
  ORDER BY date_trunc('week', comment_published_at::timestamptz);
$$;

CREATE OR REPLACE FUNCTION get_youtube_comments_per_month(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    to_char(date_trunc('month', comment_published_at::timestamptz), 'YYYY-MM') AS date,
    COUNT(*) AS count
  FROM youtube_data
  WHERE (p_account IS NULL OR account_name = p_account)
    AND (p_date_from IS NULL OR comment_published_at::timestamptz >= p_date_from)
    AND (p_date_to IS NULL OR comment_published_at::timestamptz <= p_date_to)
  GROUP BY date_trunc('month', comment_published_at::timestamptz)
  ORDER BY date_trunc('month', comment_published_at::timestamptz);
$$;
