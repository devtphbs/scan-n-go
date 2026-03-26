# Supabase Setup Guide

This guide will help you set up Supabase for the Scan & Go grocery web app.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/login with your GitHub account
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Project Name**: `ScanNGo` (or your preferred name)
   - **Database Password**: Create a strong password and save it
   - **Region**: Choose the closest region to your users
7. Click "Create new project"
8. Wait for the project to be created (2-3 minutes)

## 2. Get Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon)
2. Go to **API** section
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Update Configuration

Edit `lib/supabaseClient.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://zsnzfbphhomncutpbegw.supabase.co'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbnpmYnBoaG9tbmN1dHBiZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk2MDAsImV4cCI6MjA4OTI0NTYwMH0.P6biybUkJ1apbzi8KoRjeN4jbkyxIGQmEBhge25XIK8'; // Replace with your anon key
```

## 4. Create Database Table

Go to the **SQL Editor** in your Supabase dashboard and run the following SQL:

```sql
-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT,
  discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'percent')),
  discount_value REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster barcode lookups
CREATE INDEX idx_products_barcode ON products(barcode);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

## 5. Set Up Row Level Security (RLS) Policies

In the **SQL Editor**, run these policies:

```sql
-- Policy 1: Allow public read access to products
CREATE POLICY "Public can read products" ON products
  FOR SELECT USING (true);

-- Policy 2: Only admin can insert products
CREATE POLICY "Admin can insert products" ON products
  FOR INSERT WITH CHECK (
    auth.email() = 'hildingws2013@gmail.com'
  );

-- Policy 3: Only admin can update products  
CREATE POLICY "Admin can update products" ON products
  FOR UPDATE USING (
    auth.email() = 'hildingws2013@gmail.com'
  );

-- Policy 4: Only admin can delete products
CREATE POLICY "Admin can delete products" ON products
  FOR DELETE USING (
    auth.email() = 'hildingws2013@gmail.com'
  );
```

## 6. Enable Realtime

1. Go to **Database** in your Supabase dashboard
2. Click on **Replication** in the sidebar
3. Find the `products` table
4. Toggle the **Realtime** switch to enable it
5. Click **Save**

## 7. Set Up Authentication

1. Go to **Authentication** in the sidebar
2. Click on **Settings**
3. Under **Site URL**, enter: `http://localhost:3000` (for development)
4. Add additional URLs for production:
   - `https://yourdomain.com`
   - `https://vercel.app` (if using Vercel)

## 8. Create Admin User

You'll need to create the admin user account. You have two options:

### Option A: Use Supabase Auth (Recommended)
1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Enter email: `hildingws2013@gmail.com`
4. Click "Send magic link" (the user can set their own password)

### Option B: Use SQL (For testing)
Run this SQL in the **SQL Editor**:

```sql
-- Insert admin user (you'll need to get the actual user ID from auth.users)
-- This is optional - better to use the UI method above
```

## 9. Add Sample Data (Optional)

To test the app immediately, add some sample products:

```sql
-- Insert sample products
INSERT INTO products (barcode, name, price, image, stock, discount_type, discount_value) VALUES
('4006381333931', 'Organic Milk', 3.99, 'https://picsum.photos/seed/milk/300/150.jpg', 50, 'none', 0),
('4006381333948', 'Whole Wheat Bread', 2.49, 'https://picsum.photos/seed/bread/300/150.jpg', 30, 'percent', 0.1),
('4006381333955', 'Fresh Apples', 4.99, 'https://picsum.photos/seed/apples/300/150.jpg', 100, 'none', 0),
('4006381333962', 'Greek Yogurt', 5.49, 'https://picsum.photos/seed/yogurt/300/150.jpg', 25, 'percent', 0.15),
('4006381333979', 'Orange Juice', 3.29, 'https://picsum.photos/seed/juice/300/150.jpg', 40, 'none', 0);
```

## 10. Test the Setup

1. Open the app in your browser
2. Try logging in with your admin account
3. Go to the admin panel
4. Add a new product to verify barcode generation works
5. Test scanning functionality

## Troubleshooting

### Common Issues

**"Invalid barcode format" error:**
- Make sure you're using EAN-13 format (13 digits)
- The app generates valid EAN-13 barcodes automatically

**"Access denied" errors:**
- Check that RLS policies are correctly set up
- Verify you're logged in as `hildingws2013@gmail.com`

**Realtime not working:**
- Ensure Realtime is enabled for the products table
- Check your browser console for WebSocket errors

**CORS errors:**
- Make sure your site URL is added to Authentication settings
- For local development, use `http://localhost:3000`

### Getting Help

- Check the Supabase documentation: https://supabase.com/docs
- Review the browser console for specific error messages
- Ensure all SQL policies were applied successfully

## Security Notes

- The admin email is hardcoded for demo purposes
- In production, consider using a more sophisticated admin system
- Always keep your Supabase keys secure and never commit them to git
- Consider using environment variables for sensitive configuration
