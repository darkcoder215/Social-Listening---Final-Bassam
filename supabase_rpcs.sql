-- ═══════════════════════════════════════════════════════════════
-- Supabase RPC Functions for Social Listening Tool
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── TikTok Stats ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_tiktok_stats(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS json
LANGUAGE sql STABLE
AS $$
  SELECT json_build_object(
    'total_posts', COUNT(*)::int,
    'total_likes', COALESCE(SUM(post_like_count), 0)::bigint,
    'total_comments', COALESCE(SUM(post_comment_count), 0)::bigint,
    'total_shares', COALESCE(SUM(post_share_count), 0)::bigint,
    'total_views', COALESCE(SUM(post_play_count), 0)::bigint
  )
  FROM tiktok_posts
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR post_create_time >= p_date_from)
    AND (p_date_to IS NULL OR post_create_time <= p_date_to);
$$;

-- ─── TikTok Comments Per Day ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_tiktok_comments_per_day(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(comment_create_time_iso::date, 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM tiktok_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_create_time_iso >= p_date_from)
    AND (p_date_to IS NULL OR comment_create_time_iso <= p_date_to)
  GROUP BY comment_create_time_iso::date
  ORDER BY comment_create_time_iso::date;
$$;

-- ─── TikTok Top Posts ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_tiktok_top_posts(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
) RETURNS TABLE(
  post_id text,
  post_url text,
  post_description text,
  post_create_time timestamptz,
  post_like_count bigint,
  post_comment_count bigint,
  post_share_count bigint,
  post_play_count bigint,
  account_username text,
  account_name_ar text,
  engagement bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    tp.post_id,
    tp.post_url,
    tp.post_description,
    tp.post_create_time,
    tp.post_like_count,
    tp.post_comment_count,
    tp.post_share_count,
    tp.post_play_count,
    tp.account_username,
    tp.account_name_ar,
    (COALESCE(tp.post_like_count, 0) + COALESCE(tp.post_comment_count, 0) + COALESCE(tp.post_share_count, 0)) AS engagement
  FROM tiktok_posts tp
  WHERE (p_account IS NULL OR tp.account_username = p_account)
    AND (p_date_from IS NULL OR tp.post_create_time >= p_date_from)
    AND (p_date_to IS NULL OR tp.post_create_time <= p_date_to)
  ORDER BY engagement DESC
  LIMIT p_limit;
$$;

-- ─── TikTok Posts Per Day ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_tiktok_posts_per_day(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(post_create_time::date, 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM tiktok_posts
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR post_create_time >= p_date_from)
    AND (p_date_to IS NULL OR post_create_time <= p_date_to)
  GROUP BY post_create_time::date
  ORDER BY post_create_time::date;
$$;

-- ─── TikTok Comments Per Account ──────────────────────────────
CREATE OR REPLACE FUNCTION get_tiktok_comments_per_account(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(account_username text, account_name_ar text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    tc.account_username,
    tc.account_name_ar,
    COUNT(*) AS count
  FROM tiktok_comments tc
  WHERE (p_date_from IS NULL OR tc.comment_create_time_iso >= p_date_from)
    AND (p_date_to IS NULL OR tc.comment_create_time_iso <= p_date_to)
  GROUP BY tc.account_username, tc.account_name_ar
  ORDER BY count DESC;
$$;


-- ═══════════════════════════════════════════════════════════════
-- Instagram
-- ═══════════════════════════════════════════════════════════════

-- ─── Instagram Stats ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_instagram_stats(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS json
LANGUAGE sql STABLE
AS $$
  SELECT json_build_object(
    'total_posts', COUNT(*)::int,
    'total_likes', COALESCE(SUM(post_likes_count), 0)::bigint,
    'total_comments', COALESCE(SUM(post_comments_count), 0)::bigint,
    'total_shares', 0::bigint,
    'total_views', COALESCE(SUM(post_views_count), 0)::bigint
  )
  FROM instagram_posts
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR post_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR post_timestamp <= p_date_to);
$$;

-- ─── Instagram Comments Per Day ───────────────────────────────
CREATE OR REPLACE FUNCTION get_instagram_comments_per_day(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(comment_timestamp::date, 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM instagram_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR comment_timestamp <= p_date_to)
  GROUP BY comment_timestamp::date
  ORDER BY comment_timestamp::date;
$$;

-- ─── Instagram Top Posts ──────────────────────────────────────
CREATE OR REPLACE FUNCTION get_instagram_top_posts(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
) RETURNS TABLE(
  post_id text,
  post_url text,
  post_caption text,
  post_timestamp timestamptz,
  post_likes_count bigint,
  post_comments_count bigint,
  post_views_count bigint,
  post_type text,
  post_image_url text,
  account_username text,
  account_name_ar text,
  engagement bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ip.post_id,
    ip.post_url,
    ip.post_caption,
    ip.post_timestamp,
    ip.post_likes_count,
    ip.post_comments_count,
    ip.post_views_count,
    ip.post_type,
    ip.post_image_url,
    ip.account_username,
    ip.account_name_ar,
    (COALESCE(ip.post_likes_count, 0) + COALESCE(ip.post_comments_count, 0)) AS engagement
  FROM instagram_posts ip
  WHERE (p_account IS NULL OR ip.account_username = p_account)
    AND (p_date_from IS NULL OR ip.post_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR ip.post_timestamp <= p_date_to)
  ORDER BY engagement DESC
  LIMIT p_limit;
$$;

-- ─── Instagram Posts Per Day ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_instagram_posts_per_day(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(post_timestamp::date, 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM instagram_posts
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR post_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR post_timestamp <= p_date_to)
  GROUP BY post_timestamp::date
  ORDER BY post_timestamp::date;
$$;

-- ─── Instagram Comments Per Account ───────────────────────────
CREATE OR REPLACE FUNCTION get_instagram_comments_per_account(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(account_username text, account_name_ar text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    ic.account_username,
    ic.account_name_ar,
    COUNT(*) AS count
  FROM instagram_comments ic
  WHERE (p_date_from IS NULL OR ic.comment_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR ic.comment_timestamp <= p_date_to)
  GROUP BY ic.account_username, ic.account_name_ar
  ORDER BY count DESC;
$$;


-- ═══════════════════════════════════════════════════════════════
-- YouTube
-- ═══════════════════════════════════════════════════════════════

-- ─── YouTube Stats ────────────────────────────────────────────
-- Deduplicates by video_id for accurate video/like/view counts
CREATE OR REPLACE FUNCTION get_youtube_stats(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS json
LANGUAGE sql STABLE
AS $$
  WITH filtered_comments AS (
    SELECT *
    FROM youtube_data
    WHERE (p_account IS NULL OR account_name = p_account)
      AND (p_date_from IS NULL OR comment_published_at >= p_date_from)
      AND (p_date_to IS NULL OR comment_published_at <= p_date_to)
  ),
  unique_videos AS (
    SELECT DISTINCT ON (video_id)
      video_id,
      video_view_count,
      video_like_count,
      video_comment_count
    FROM filtered_comments
    WHERE video_id IS NOT NULL
  )
  SELECT json_build_object(
    'total_posts', (SELECT COUNT(*) FROM unique_videos)::int,
    'total_likes', (SELECT COALESCE(SUM(video_like_count), 0) FROM unique_videos)::bigint,
    'total_comments', (SELECT COUNT(*) FROM filtered_comments)::bigint,
    'total_shares', 0::bigint,
    'total_views', (SELECT COALESCE(SUM(video_view_count), 0) FROM unique_videos)::bigint
  );
$$;

-- ─── YouTube Comments Per Day ─────────────────────────────────
CREATE OR REPLACE FUNCTION get_youtube_comments_per_day(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(comment_published_at::date, 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM youtube_data
  WHERE (p_account IS NULL OR account_name = p_account)
    AND (p_date_from IS NULL OR comment_published_at >= p_date_from)
    AND (p_date_to IS NULL OR comment_published_at <= p_date_to)
  GROUP BY comment_published_at::date
  ORDER BY comment_published_at::date;
$$;

-- ─── YouTube Top Videos ───────────────────────────────────────
CREATE OR REPLACE FUNCTION get_youtube_top_posts(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
) RETURNS TABLE(
  video_id text,
  video_title text,
  video_url text,
  video_thumbnail_url text,
  video_view_count bigint,
  video_like_count bigint,
  video_comment_count bigint,
  account_name text,
  engagement bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (yd.video_id)
    yd.video_id,
    yd.video_title,
    yd.video_url,
    yd.video_thumbnail_url,
    yd.video_view_count,
    yd.video_like_count,
    yd.video_comment_count,
    yd.account_name,
    (COALESCE(yd.video_like_count, 0) + COALESCE(yd.video_comment_count, 0)) AS engagement
  FROM youtube_data yd
  WHERE yd.video_id IS NOT NULL
    AND (p_account IS NULL OR yd.account_name = p_account)
    AND (p_date_from IS NULL OR yd.comment_published_at >= p_date_from)
    AND (p_date_to IS NULL OR yd.comment_published_at <= p_date_to)
  ORDER BY yd.video_id, engagement DESC;
$$;

-- Wrap the DISTINCT ON result to apply proper ordering and limit
CREATE OR REPLACE FUNCTION get_youtube_top_posts_sorted(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 10
) RETURNS TABLE(
  video_id text,
  video_title text,
  video_url text,
  video_thumbnail_url text,
  video_view_count bigint,
  video_like_count bigint,
  video_comment_count bigint,
  account_name text,
  engagement bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT * FROM get_youtube_top_posts(p_account, p_date_from, p_date_to, 10000)
  ORDER BY engagement DESC
  LIMIT p_limit;
$$;

-- ─── YouTube Comments Per Account ─────────────────────────────
CREATE OR REPLACE FUNCTION get_youtube_comments_per_account(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS TABLE(account_name text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    yd.account_name,
    COUNT(*) AS count
  FROM youtube_data yd
  WHERE (p_date_from IS NULL OR yd.comment_published_at >= p_date_from)
    AND (p_date_to IS NULL OR yd.comment_published_at <= p_date_to)
  GROUP BY yd.account_name
  ORDER BY count DESC;
$$;


-- ═══════════════════════════════════════════════════════════════
-- X / Twitter (Meltwater)
-- ═══════════════════════════════════════════════════════════════

-- ─── X Stats ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_x_stats(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
) RETURNS json
LANGUAGE sql STABLE
AS $$
  SELECT json_build_object(
    'total_posts', COUNT(*)::int,
    'total_likes', COALESCE(SUM(likes), 0)::bigint,
    'total_comments', COALESCE(SUM(comments), 0)::bigint,
    'total_shares', COALESCE(SUM(reposts), 0)::bigint,
    'total_views', COALESCE(SUM(views), 0)::bigint,
    'total_reach', COALESCE(SUM(reach), 0)::bigint,
    'total_engagement', COALESCE(SUM(engagement), 0)::bigint
  )
  FROM x_data
  WHERE (p_date_from IS NULL OR date >= p_date_from)
    AND (p_date_to IS NULL OR date <= p_date_to);
$$;

-- ─── X Sentiment Distribution ─────────────────────────────────
CREATE OR REPLACE FUNCTION get_x_sentiment(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
) RETURNS json
LANGUAGE sql STABLE
AS $$
  SELECT json_build_object(
    'positive', COUNT(*) FILTER (WHERE LOWER(sentiment) IN ('positive', 'إيجابي')),
    'negative', COUNT(*) FILTER (WHERE LOWER(sentiment) IN ('negative', 'سلبي')),
    'neutral', COUNT(*) FILTER (WHERE LOWER(sentiment) NOT IN ('positive', 'إيجابي', 'negative', 'سلبي')),
    'total', COUNT(*)
  )
  FROM x_data
  WHERE (p_date_from IS NULL OR date >= p_date_from)
    AND (p_date_to IS NULL OR date <= p_date_to);
$$;

-- ─── X Posts Per Day ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_x_posts_per_day(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
) RETURNS TABLE(date text, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    to_char(xd.date, 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM x_data xd
  WHERE (p_date_from IS NULL OR xd.date >= p_date_from)
    AND (p_date_to IS NULL OR xd.date <= p_date_to)
  GROUP BY xd.date
  ORDER BY xd.date;
$$;

-- ─── X Top Posts ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_x_top_posts(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_limit int DEFAULT 10
) RETURNS TABLE(
  document_id text,
  hit_sentence text,
  sentiment text,
  author_name text,
  author_handle text,
  date date,
  likes bigint,
  comments bigint,
  reposts bigint,
  views bigint,
  reach bigint,
  engagement bigint,
  url text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    xd.document_id,
    xd.hit_sentence,
    xd.sentiment,
    xd.author_name,
    xd.author_handle,
    xd.date,
    xd.likes,
    xd.comments,
    xd.reposts,
    xd.views,
    xd.reach,
    xd.engagement,
    xd.url
  FROM x_data xd
  WHERE (p_date_from IS NULL OR xd.date >= p_date_from)
    AND (p_date_to IS NULL OR xd.date <= p_date_to)
  ORDER BY COALESCE(xd.engagement, 0) DESC
  LIMIT p_limit;
$$;

-- ─── X Top Authors ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_x_top_authors(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_limit int DEFAULT 10
) RETURNS TABLE(author_name text, author_handle text, post_count bigint, total_engagement bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    xd.author_name,
    xd.author_handle,
    COUNT(*) AS post_count,
    COALESCE(SUM(xd.engagement), 0) AS total_engagement
  FROM x_data xd
  WHERE (p_date_from IS NULL OR xd.date >= p_date_from)
    AND (p_date_to IS NULL OR xd.date <= p_date_to)
  GROUP BY xd.author_name, xd.author_handle
  ORDER BY total_engagement DESC
  LIMIT p_limit;
$$;


-- ═══════════════════════════════════════════════════════════════
-- Cross-Platform Overview
-- ═══════════════════════════════════════════════════════════════

-- ─── Overview Stats (all platforms combined) ──────────────────
CREATE OR REPLACE FUNCTION get_overview_stats(
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_date_from_ts timestamptz;
  v_date_to_ts timestamptz;
  v_date_from_d date;
  v_date_to_d date;
  v_tiktok json;
  v_instagram json;
  v_youtube json;
  v_x json;
  v_x_sentiment json;
BEGIN
  -- Parse dates
  IF p_date_from IS NOT NULL THEN
    v_date_from_ts := p_date_from::timestamptz;
    v_date_from_d := p_date_from::date;
  END IF;
  IF p_date_to IS NOT NULL THEN
    v_date_to_ts := p_date_to::timestamptz;
    v_date_to_d := p_date_to::date;
  END IF;

  -- Get per-platform stats
  v_tiktok := get_tiktok_stats(NULL, v_date_from_ts, v_date_to_ts);
  v_instagram := get_instagram_stats(NULL, v_date_from_ts, v_date_to_ts);
  v_youtube := get_youtube_stats(NULL, v_date_from_ts, v_date_to_ts);
  v_x := get_x_stats(v_date_from_d, v_date_to_d);
  v_x_sentiment := get_x_sentiment(v_date_from_d, v_date_to_d);

  RETURN json_build_object(
    'tiktok', v_tiktok,
    'instagram', v_instagram,
    'youtube', v_youtube,
    'x', v_x,
    'x_sentiment', v_x_sentiment,
    'totals', json_build_object(
      'total_posts',
        (v_tiktok->>'total_posts')::int + (v_instagram->>'total_posts')::int +
        (v_youtube->>'total_posts')::int + (v_x->>'total_posts')::int,
      'total_likes',
        (v_tiktok->>'total_likes')::bigint + (v_instagram->>'total_likes')::bigint +
        (v_youtube->>'total_likes')::bigint + (v_x->>'total_likes')::bigint,
      'total_comments',
        (v_tiktok->>'total_comments')::bigint + (v_instagram->>'total_comments')::bigint +
        (v_youtube->>'total_comments')::bigint + (v_x->>'total_comments')::bigint,
      'total_views',
        (v_tiktok->>'total_views')::bigint + (v_instagram->>'total_views')::bigint +
        (v_youtube->>'total_views')::bigint + (v_x->>'total_views')::bigint
    )
  );
END;
$$;

-- ─── Activity Timeline (posts per day per platform) ───────────
CREATE OR REPLACE FUNCTION get_activity_timeline(
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL
) RETURNS TABLE(date text, tiktok bigint, instagram bigint, youtube bigint, x bigint)
LANGUAGE sql STABLE
AS $$
  WITH all_dates AS (
    -- TikTok posts per day
    SELECT to_char(post_create_time::date, 'YYYY-MM-DD') AS d, 'tiktok' AS platform
    FROM tiktok_posts
    WHERE (p_date_from IS NULL OR post_create_time >= p_date_from::timestamptz)
      AND (p_date_to IS NULL OR post_create_time <= p_date_to::timestamptz)
    UNION ALL
    -- Instagram posts per day
    SELECT to_char(post_timestamp::date, 'YYYY-MM-DD') AS d, 'instagram' AS platform
    FROM instagram_posts
    WHERE (p_date_from IS NULL OR post_timestamp >= p_date_from::timestamptz)
      AND (p_date_to IS NULL OR post_timestamp <= p_date_to::timestamptz)
    UNION ALL
    -- YouTube: count distinct videos per day (approximate by comment date)
    SELECT DISTINCT ON (yd.video_id, to_char(yd.comment_published_at::date, 'YYYY-MM-DD'))
      to_char(yd.comment_published_at::date, 'YYYY-MM-DD') AS d, 'youtube' AS platform
    FROM youtube_data yd
    WHERE yd.video_id IS NOT NULL
      AND (p_date_from IS NULL OR yd.comment_published_at >= p_date_from::timestamptz)
      AND (p_date_to IS NULL OR yd.comment_published_at <= p_date_to::timestamptz)
    UNION ALL
    -- X posts per day
    SELECT to_char(xd.date, 'YYYY-MM-DD') AS d, 'x' AS platform
    FROM x_data xd
    WHERE (p_date_from IS NULL OR xd.date >= p_date_from::date)
      AND (p_date_to IS NULL OR xd.date <= p_date_to::date)
  )
  SELECT
    d AS date,
    COUNT(*) FILTER (WHERE platform = 'tiktok') AS tiktok,
    COUNT(*) FILTER (WHERE platform = 'instagram') AS instagram,
    COUNT(*) FILTER (WHERE platform = 'youtube') AS youtube,
    COUNT(*) FILTER (WHERE platform = 'x') AS x
  FROM all_dates
  GROUP BY d
  ORDER BY d;
$$;


-- ═══════════════════════════════════════════════════════════════
-- Comment Count RPCs (for badge display)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_tiktok_comment_count(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)
  FROM tiktok_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_create_time_iso >= p_date_from)
    AND (p_date_to IS NULL OR comment_create_time_iso <= p_date_to);
$$;

CREATE OR REPLACE FUNCTION get_instagram_comment_count(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)
  FROM instagram_comments
  WHERE (p_account IS NULL OR account_username = p_account)
    AND (p_date_from IS NULL OR comment_timestamp >= p_date_from)
    AND (p_date_to IS NULL OR comment_timestamp <= p_date_to);
$$;

CREATE OR REPLACE FUNCTION get_youtube_comment_count(
  p_account text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
) RETURNS bigint
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)
  FROM youtube_data
  WHERE (p_account IS NULL OR account_name = p_account)
    AND (p_date_from IS NULL OR comment_published_at >= p_date_from)
    AND (p_date_to IS NULL OR comment_published_at <= p_date_to);
$$;


-- ═══════════════════════════════════════════════════════════════
-- Done! All RPCs created successfully.
-- ═══════════════════════════════════════════════════════════════
