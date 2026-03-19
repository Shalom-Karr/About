# Scripts Documentation

## generate-sitemap.js

Generates a sitemap.xml file with static pages and optionally includes dynamic blog posts from Supabase.

### Usage

**Basic usage (static pages only):**
```bash
npm run generate-sitemap
```

**With blog posts (requires Supabase credentials):**
```bash
SUPABASE_URL=your_url SUPABASE_ANON_KEY=your_key npm run generate-sitemap
```

### What it does

1. Creates a valid XML sitemap with proper declaration at the start
2. Includes all static pages (home, blog index, contact)
3. Optionally fetches published blog posts from Supabase and adds them to the sitemap
4. Writes the result to `sitemap.xml` in the root directory

### Requirements

- Node.js
- `@supabase/supabase-js` package (only if fetching blog posts)

### Notes

- The current `sitemap.xml` contains static pages only
- Run this script whenever you publish new blog posts to update the sitemap
- The script will work without Supabase credentials, generating a static-only sitemap
