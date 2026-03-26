# Scan & Go - Deployment Guide

## Vercel Deployment

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy
```bash
# From the project root (ScanNGo folder)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name? scanngo-app (or your preferred name)
```

### Step 3: Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

**Required:**
- `SUPABASE_URL`: `https://zsnzfbphhomncutpbegw.supabase.co`
- `SUPABASE_ANON_KEY`: Your Supabase anon key

**For Stripe Payments (optional):**
- `STRIPE_PUBLIC_KEY`: Your Stripe publishable key (pk_test_...)

## Stripe Setup (Optional - for real payments)

### 1. Create Stripe Account
- Sign up at https://stripe.com
- Get your API keys from Dashboard → Developers → API keys

### 2. Update app.js
Replace this line in `public/app.js`:
```javascript
const STRIPE_PUBLIC_KEY = 'pk_test_your_stripe_public_key_here';
```

With your actual Stripe public key:
```javascript
const STRIPE_PUBLIC_KEY = 'pk_test_your_actual_key_here';
```

### 3. Create Supabase Edge Function
For real payments, you need a backend function to create checkout sessions:

1. In Supabase Dashboard → Functions → New Function
2. Function name: `create-checkout`
3. Add this code:

```javascript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { items, success_url, cancel_url } = await req.json()
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url,
      cancel_url,
    })

    return new Response(JSON.stringify({ id: session.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

4. Add `STRIPE_SECRET_KEY` to your Supabase secrets (Dashboard → Settings → API)

### 4. Enable Functions in Supabase
Make sure your Supabase project is on a plan that supports Edge Functions (free tier includes 500K invocations/month)

## Domain & Custom URL

### Option 1: Vercel Subdomain (Free)
Your app will be at `https://scanngo-app.vercel.app` (or your chosen name)

### Option 2: Custom Domain
1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Vercel Dashboard → Domains → Add Domain
3. Follow DNS configuration instructions

## Testing Before Deploy

1. Test locally:
```bash
# Using Python
python -m http.server 3000 --directory public

# Or Node.js
npx serve public
```

2. Test scanning with real barcodes
3. Test checkout flow (demo mode works without Stripe)

## Post-Deployment Checklist

- [ ] App loads without console errors
- [ ] Camera permission works
- [ ] Can scan products and add to cart
- [ ] Cart shows correct total
- [ ] Checkout works (demo mode or Stripe)
- [ ] Admin panel accessible with login
- [ ] Can add/edit products with images
- [ ] Real-time stock updates work

## Troubleshooting

### Camera not working
- Ensure site is served over HTTPS (required for camera)
- Check browser permissions

### 406 errors on scan
- Product with that barcode doesn't exist in database
- Add product in admin panel first

### Stripe not working
- Check that STRIPE_PUBLIC_KEY is set correctly
- Ensure Supabase Edge Function is deployed
- Check browser console for errors

## Support

- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
