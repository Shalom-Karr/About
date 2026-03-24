# Database Migration Guide

## Applying Schema Changes to Supabase

If you're encountering a **400 Bad Request** error related to `sitesettings`, it means the `sitesettings` table doesn't exist in your Supabase database yet.

### Steps to Fix

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
   - Navigate to the **SQL Editor** in the left sidebar

2. **Run the Site Settings Migration**

   Copy and paste the following SQL into the editor and click **Run**:

   ```sql
   -- ============================================
   -- Site Settings
   -- ============================================
   CREATE TABLE IF NOT EXISTS sitesettings (
       id INTEGER PRIMARY KEY,
       name TEXT NOT NULL,
       bio TEXT,
       avatar_url TEXT,
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- Enable RLS
   ALTER TABLE sitesettings ENABLE ROW LEVEL SECURITY;

   -- Allow public read access (for displaying on the site)
   CREATE POLICY "Allow public read access" ON sitesettings
       FOR SELECT
       USING (true);

   -- Only authenticated users (admin) can update settings
   CREATE POLICY "Only admin can update" ON sitesettings
       FOR UPDATE
       USING (auth.role() = 'authenticated');

   -- Only authenticated users (admin) can insert settings
   CREATE POLICY "Only admin can insert" ON sitesettings
       FOR INSERT
       WITH CHECK (auth.role() = 'authenticated');

   -- Insert default settings row
   INSERT INTO sitesettings (id, name, bio, avatar_url)
   VALUES (
       1,
       'Shalom Karr',
       'Full-stack developer passionate about creating elegant solutions to complex problems.',
       ''
   )
   ON CONFLICT (id) DO NOTHING;
   ```

3. **Verify the Table Was Created**

   Run this query to confirm:
   ```sql
   SELECT * FROM sitesettings;
   ```

   You should see one row with id=1 and your default settings.

4. **Test the Admin Panel**
   - Open your admin panel at `/blog/admin/`
   - Log in with your credentials
   - The **400 Bad Request** error should now be resolved
   - You should be able to view and edit site settings

### What This Does

- **Creates the `sitesettings` table** with columns for name, bio, and avatar URL
- **Sets up Row Level Security (RLS)** to ensure only admins can modify settings
- **Allows public read access** so the settings can be displayed on your site
- **Inserts a default row** with id=1 containing initial settings

### Full Schema Reset (Optional)

If you want to recreate your entire database from scratch, you can run the complete `schema.sql` file:

1. **Backup your data first!**
2. In Supabase SQL Editor, copy the entire contents of `schema.sql`
3. Run the script

This will create all tables including projects, blog posts, contact messages, and site settings.

---

**Note:** The site settings table is required for the admin panel to function properly. Without it, you'll see 400 errors when trying to load or save settings.
