# Blog Post Tracking System

This document explains the blog post tracking system that tracks views and clicks for each blog post.

## Overview

The tracking system consists of two main tables and several analytics views:

1. **`blog_post_views`** - Tracks each view/visit to a blog post
2. **`blog_post_clicks`** - Tracks clicks on links and interactions within blog posts
3. **Analytics Views** - Pre-built views for easy reporting and analytics

**Note**: This system uses **UUID** for post IDs to match the existing `posts.id` column type.

## Database Schema

### Installation

To set up the tracking system, run the SQL in `blog-tracking-schema.sql`:

```bash
# Using Supabase CLI
supabase db reset  # If you want to reset the entire database

# Or using psql
psql -h your-host -U your-user -d your-database -f blog-tracking-schema.sql
```

Or copy and paste the SQL into your Supabase SQL Editor.

## Tables

### 1. `blog_post_views`

Tracks every view of a blog post with detailed metrics.

**Columns:**
- `id` - Primary key (UUID, auto-generated)
- `post_id` - Foreign key to `posts.id` (UUID)
- `post_slug` - Denormalized slug for faster queries
- `fingerprint` - Browser fingerprint for anonymous session tracking
- `ip_address` - Optional IP address (can be anonymized)
- `user_agent` - Browser user agent string
- `referrer` - Where the user came from (HTTP referer)
- `view_duration_seconds` - How long they stayed on the page
- `scroll_depth_percent` - How far they scrolled (0-100)
- `created_at` - When the view started
- `updated_at` - For updating duration/scroll depth

**Example Insert:**
```sql
INSERT INTO blog_post_views (post_id, post_slug, fingerprint, user_agent, referrer)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'my-first-post', 'fp_abc123', 'Mozilla/5.0...', 'https://google.com');
```

### 2. `blog_post_clicks`

Tracks clicks on links and interactions within blog posts.

**Columns:**
- `id` - Primary key (UUID, auto-generated)
- `post_id` - Foreign key to `posts.id` (UUID)
- `post_slug` - Denormalized slug for faster queries
- `fingerprint` - Same fingerprint as views for session correlation
- `click_type` - Type of click: `'external_link'`, `'tag'`, `'share'`, `'like'`, etc.
- `click_target` - URL or identifier of what was clicked
- `click_text` - Link text or button label
- `created_at` - When the click occurred

**Example Insert:**
```sql
INSERT INTO blog_post_clicks (post_id, post_slug, fingerprint, click_type, click_target, click_text)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'my-first-post', 'fp_abc123', 'external_link', 'https://example.com', 'Learn More');
```

## Analytics Views

### 1. `blog_post_analytics`

Get aggregated statistics for each blog post.

**Columns:**
- Post info: `id`, `slug`, `title`, `created_at`, `likes_count`
- View metrics: `total_views`, `unique_visitors`, `avg_duration_seconds`, `avg_scroll_depth_percent`, `last_viewed_at`
- Click metrics: `total_clicks`, `external_link_clicks`, `tag_clicks`, `share_clicks`
- Engagement: `clicks_per_view`, `like_rate_percent`

**Example Query:**
```sql
-- Get top 10 posts by views
SELECT * FROM blog_post_analytics
ORDER BY total_views DESC
LIMIT 10;

-- Get posts with best engagement
SELECT * FROM blog_post_analytics
WHERE total_views > 10
ORDER BY clicks_per_view DESC
LIMIT 10;
```

### 2. `blog_post_analytics_by_date`

Get daily analytics for trending analysis.

**Columns:**
- `post_id`, `slug`, `title`
- `view_date` - The date of views
- `views_count` - Number of views on that date
- `unique_visitors_count` - Unique visitors on that date
- `avg_duration_seconds` - Average view duration
- `clicks_count` - Number of clicks on that date

**Example Query:**
```sql
-- Get recent view activity (last 7 days)
SELECT * FROM blog_post_analytics_by_date
WHERE view_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY view_date DESC, views_count DESC;
```

### 3. `blog_post_referrers`

See where traffic is coming from.

**Columns:**
- `post_id`, `slug`, `title`
- `referrer` - The referrer URL
- `referral_count` - Total referrals from this source
- `unique_visitors` - Unique visitors from this source

**Example Query:**
```sql
-- Get top referrers for a specific post
SELECT * FROM blog_post_referrers
WHERE slug = 'my-first-post'
ORDER BY referral_count DESC
LIMIT 10;
```

## JavaScript Implementation

### Client-Side Tracking (blog/post.html)

Add this JavaScript to track views and clicks:

```javascript
// Initialize tracking on page load
async function trackBlogView(postId, postSlug) {
    try {
        // Get or generate fingerprint (use a library like FingerprintJS)
        const fingerprint = await generateFingerprint();

        // Get referrer
        const referrer = document.referrer || '';

        // Get user agent
        const userAgent = navigator.userAgent;

        // Track the view
        const { data: viewData, error } = await supabase
            .from('blog_post_views')
            .insert({
                post_id: postId,
                post_slug: postSlug,
                fingerprint: fingerprint,
                referrer: referrer,
                user_agent: userAgent,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Store view ID to update duration and scroll depth later
        const viewId = viewData.id;

        // Track scroll depth
        let maxScrollDepth = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
        });

        // Track time on page
        const startTime = Date.now();

        // Update view stats before leaving
        window.addEventListener('beforeunload', async () => {
            const duration = Math.floor((Date.now() - startTime) / 1000);

            // Use sendBeacon for reliable data sending on page unload
            const payload = {
                view_duration_seconds: duration,
                scroll_depth_percent: maxScrollDepth,
                updated_at: new Date().toISOString()
            };

            // Update the view record
            await supabase
                .from('blog_post_views')
                .update(payload)
                .eq('id', viewId);
        });

    } catch (error) {
        console.error('Error tracking blog view:', error);
    }
}

// Track clicks on links
function trackBlogClick(postId, postSlug, clickType, clickTarget, clickText) {
    const fingerprint = getStoredFingerprint(); // Use the same fingerprint

    supabase
        .from('blog_post_clicks')
        .insert({
            post_id: postId,
            post_slug: postSlug,
            fingerprint: fingerprint,
            click_type: clickType,
            click_target: clickTarget,
            click_text: clickText,
            created_at: new Date().toISOString()
        })
        .then(({ error }) => {
            if (error) console.error('Error tracking click:', error);
        });
}

// Example: Track external link clicks
document.addEventListener('DOMContentLoaded', () => {
    // Get post info from page
    const postId = /* get from page */;
    const postSlug = /* get from page */;

    // Track view
    trackBlogView(postId, postSlug);

    // Track external links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.addEventListener('click', (e) => {
            trackBlogClick(
                postId,
                postSlug,
                'external_link',
                link.href,
                link.textContent
            );
        });
    });

    // Track tag clicks
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            trackBlogClick(
                postId,
                postSlug,
                'tag',
                tag.textContent,
                tag.textContent
            );
        });
    });

    // Track share button clicks
    document.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', (e) => {
            trackBlogClick(
                postId,
                postSlug,
                'share',
                button.dataset.shareType || 'unknown',
                'Share'
            );
        });
    });
});

// Simple fingerprint function (use FingerprintJS for production)
async function generateFingerprint() {
    const data = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
    ].join('|');

    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    const fingerprint = 'fp_' + Math.abs(hash).toString(36);

    // Store in localStorage for consistency
    localStorage.setItem('blog_fingerprint', fingerprint);

    return fingerprint;
}

function getStoredFingerprint() {
    return localStorage.getItem('blog_fingerprint') || 'fp_unknown';
}
```

## Useful Queries

### Top Performing Posts

```sql
-- By views
SELECT slug, title, total_views, unique_visitors, avg_duration_seconds
FROM blog_post_analytics
ORDER BY total_views DESC
LIMIT 10;

-- By engagement (clicks per view)
SELECT slug, title, total_views, total_clicks, clicks_per_view
FROM blog_post_analytics
WHERE total_views > 10
ORDER BY clicks_per_view DESC
LIMIT 10;

-- By likes
SELECT slug, title, likes_count, total_views, like_rate_percent
FROM blog_post_analytics
ORDER BY likes_count DESC
LIMIT 10;
```

### Recent Activity

```sql
-- Last 7 days
SELECT * FROM blog_post_analytics_by_date
WHERE view_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY view_date DESC, views_count DESC;

-- Today's activity
SELECT * FROM blog_post_analytics_by_date
WHERE view_date = CURRENT_DATE
ORDER BY views_count DESC;
```

### Click Analysis

```sql
-- Click breakdown by type for a specific post
SELECT
    click_type,
    COUNT(*) as click_count,
    COUNT(DISTINCT fingerprint) as unique_users
FROM blog_post_clicks
WHERE post_slug = 'my-post-slug'
GROUP BY click_type
ORDER BY click_count DESC;

-- Most clicked external links
SELECT
    post_slug,
    click_target,
    COUNT(*) as click_count
FROM blog_post_clicks
WHERE click_type = 'external_link'
GROUP BY post_slug, click_target
ORDER BY click_count DESC
LIMIT 20;
```

### Bounce Rate Analysis

```sql
-- Calculate bounce rate (views with duration < 10 seconds or scroll < 25%)
SELECT
    p.slug,
    p.title,
    COUNT(*) as total_views,
    COUNT(CASE
        WHEN v.view_duration_seconds < 10 OR v.scroll_depth_percent < 25
        THEN 1
    END) as bounces,
    (COUNT(CASE
        WHEN v.view_duration_seconds < 10 OR v.scroll_depth_percent < 25
        THEN 1
    END)::FLOAT / COUNT(*)::FLOAT * 100)::NUMERIC(5,2) as bounce_rate_percent
FROM posts p
JOIN blog_post_views v ON p.id = v.post_id
WHERE p.is_published = true
GROUP BY p.id, p.slug, p.title
HAVING COUNT(*) > 5
ORDER BY bounce_rate_percent ASC;
```

### Traffic Sources

```sql
-- Top referrers
SELECT referrer, COUNT(*) as visits, COUNT(DISTINCT fingerprint) as unique_visitors
FROM blog_post_views
WHERE referrer IS NOT NULL AND referrer != ''
GROUP BY referrer
ORDER BY visits DESC
LIMIT 20;

-- Referrers by post
SELECT * FROM blog_post_referrers
ORDER BY referral_count DESC
LIMIT 50;
```

### Viewing Patterns

```sql
-- Hourly distribution (last 30 days)
SELECT
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    COUNT(*) as views,
    COUNT(DISTINCT fingerprint) as unique_visitors
FROM blog_post_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- Day of week distribution
SELECT
    TO_CHAR(created_at, 'Day') as day_of_week,
    COUNT(*) as views,
    COUNT(DISTINCT fingerprint) as unique_visitors
FROM blog_post_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);
```

## Performance Considerations

1. **Indexes**: All necessary indexes are created automatically to ensure fast queries
2. **Denormalization**: `post_slug` is denormalized in tracking tables for faster queries without joins
3. **Cascade Deletes**: When a post is deleted, all associated views and clicks are automatically deleted
4. **Fingerprint Consistency**: Use the same fingerprint generation method across the site
5. **Batch Updates**: Consider batching scroll depth and duration updates to reduce database writes

## Privacy Considerations

1. **IP Anonymization**: Consider anonymizing IP addresses (e.g., last octet to 0)
2. **Fingerprinting**: Use privacy-friendly fingerprinting that doesn't track across sites
3. **GDPR Compliance**: Add privacy policy explaining data collection
4. **Data Retention**: Consider implementing automatic cleanup of old tracking data

## Future Enhancements

- Add geographic location tracking (country/city)
- Track device type (mobile/desktop/tablet)
- Add A/B testing support
- Track search terms (if implementing search)
- Add conversion tracking
- Export analytics to CSV/JSON
- Build admin dashboard for analytics visualization
