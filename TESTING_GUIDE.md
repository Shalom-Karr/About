# Testing Guide for Blog Analytics Implementation

This guide helps you test the new blog analytics features.

## Prerequisites

Before testing, ensure you have:

1. **Run the SQL schema** from `blog-tracking-schema.sql` in your Supabase SQL Editor
   - This creates the `blog_post_views`, `blog_post_clicks` tables
   - And the analytics views: `blog_post_analytics`, `blog_post_analytics_by_date`, `blog_post_referrers`

2. **Some test data** (optional, but recommended):
   - Add some sample views and clicks to the tracking tables
   - Or visit some blog posts to generate real tracking data

## Testing Blog Listing View Counts

### 1. View the Blog Listing Page

Navigate to `/blog/index.html` or `/blog/`

### 2. Check for View Counts

Each blog post card should now display:
- **Date** - When the post was created
- **Reading time** - Calculated from word count (clock icon)
- **View count** - NEW! Shows with an eye icon in blue (👁️)
- **Like count** - Shows with a heart icon in pink (❤️)
- **Tags** - If the post has tags

### 3. Verify View Count Display

The view count should:
- Appear between "Reading time" and "Likes"
- Show with a blue eye icon
- Display "0" if no views yet (not hide or show error)
- Update when you refresh the page after adding test data

### Expected HTML Structure:
```html
<span class="flex items-center gap-1 text-blue-500">
  <svg class="w-3.5 h-3.5" ...><!-- eye icon --></svg>
  123 <!-- view count -->
</span>
```

## Testing Admin Analytics Dashboard

### 1. Login to Admin Panel

Navigate to `/admin.html` and login with admin credentials.

### 2. Click the "Blog Analytics" Tab

You should see three tabs:
- Visitor Logs
- Manage Projects
- **Blog Analytics** ← Click this one

### 3. Verify Summary Statistics

At the top, you should see 3 cards:
- **Total Views** (blue) - Sum of all blog post views
- **Total Clicks** (green) - Sum of all blog post clicks
- **Avg. Engagement** (purple) - Clicks/Views ratio as percentage

### 4. Verify Daily Activity Table

The "Daily Activity (Last 30 Days)" table should show:
- **Date** - Each date with activity
- **Views** - Total views that day (blue)
- **Unique Visitors** - Unique fingerprints (purple)
- **Clicks** - Total clicks that day (green)
- **Avg. Duration (s)** - Average time spent on posts

**Note**: This table only shows dates with actual activity. If no views yet, you'll see "No data available yet."

### 5. Verify Post Performance Table

The "Post Performance" table should show each blog post with:
- **Post Title** - Title and slug
- **Total Views** (blue)
- **Unique Visitors** (purple)
- **Total Clicks** (green)
- **Likes** (pink)
- **Avg. Duration (s)** - Average viewing time

Posts are sorted by view count (highest first).

### 6. Test Refresh Button

Click the "Refresh" button in the top right to reload analytics data.

## Adding Test Data

If you don't have real tracking data yet, you can add test data:

### Test Views
```sql
-- Insert test views for a blog post
INSERT INTO blog_post_views (post_id, post_slug, fingerprint, view_duration_seconds, scroll_depth_percent)
SELECT
    id,
    slug,
    'fp_test_' || generate_series(1, 100),
    floor(random() * 300 + 30),
    floor(random() * 75 + 25)
FROM posts
WHERE is_published = true
LIMIT 1;
```

### Test Clicks
```sql
-- Insert test clicks for a blog post
INSERT INTO blog_post_clicks (post_id, post_slug, fingerprint, click_type, click_target)
SELECT
    id,
    slug,
    'fp_test_' || generate_series(1, 30),
    'external_link',
    'https://example.com'
FROM posts
WHERE is_published = true
LIMIT 1;
```

After adding test data, refresh the blog listing and admin dashboard to see the updated counts.

## Troubleshooting

### "No data available yet" in Admin

**Cause**: The analytics views haven't been created or there's no tracking data.

**Solution**:
1. Run `blog-tracking-schema.sql` in Supabase SQL Editor
2. Add some test data (see above)
3. Click "Refresh" in the admin panel

### View counts show "0" on blog listing

**Cause**: Either no views tracked yet, or the `blog_post_analytics` view doesn't exist.

**Solution**:
1. Check if the view exists: `SELECT * FROM blog_post_analytics LIMIT 1;`
2. If error, run `blog-tracking-schema.sql`
3. Add test data if needed

### Error: "relation 'blog_post_analytics' does not exist"

**Cause**: The SQL schema hasn't been run yet.

**Solution**: Run the SQL from `blog-tracking-schema.sql` in your Supabase SQL Editor.

### Blog listing loads slowly

**Cause**: Fetching analytics for many posts can take time.

**Solution**:
- The analytics view is already optimized with indexes
- Consider adding pagination to the blog listing if you have 50+ posts
- The view counts are cached in the page until refresh

## Expected Behavior Summary

✅ **Blog Listing**:
- Shows view count (blue eye icon) for each post
- Gracefully handles 0 views
- Doesn't break if analytics tables don't exist (shows 0)

✅ **Admin Dashboard**:
- Shows 3 summary stat cards
- Shows daily activity for last 30 days
- Shows all posts with their analytics
- Updates on refresh
- Shows clear error messages if data can't be loaded

## Client-Side Tracking (Future Enhancement)

The current implementation shows view/click counts, but doesn't yet track them client-side. To enable tracking, you'll need to:

1. Add tracking JavaScript to `blog/post.html` (see `BLOG_TRACKING_README.md`)
2. Implement fingerprint generation
3. Track views on page load
4. Track clicks on links

This can be added as a follow-up task!
