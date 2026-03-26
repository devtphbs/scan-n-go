# Setting Up Real Stripe Payments

## 1. Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_live_` for production or `sk_test_` for testing)

## 2. Deploy the Edge Function to Supabase

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard → Edge Functions
2. Click "New Function"
3. Function name: `create-checkout`
4. Paste the code from `supabase/functions/create-checkout/index.ts`
5. Add environment variable:
   - Key: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (sk_live_... or sk_test_...)
6. Click Deploy

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (get project ref from dashboard URL)
supabase link --project-ref zsnzfbphhomncutpbegw

# Set your Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_secret_key_here

# Deploy the function
supabase functions deploy create-checkout
```

## 3. Test the Payment Flow

1. Add a product to your cart
2. Click Checkout
3. You should be redirected to Stripe's checkout page
4. Complete the payment with test card: `4242 4242 4242 4242`, any future date, any CVC
5. You should be redirected back to the success page

## 4. Going Live (Production)

1. Switch to live Stripe keys in both frontend and Supabase
2. Update your Stripe account settings:
   - Add your domain to allowed domains
   - Configure webhook endpoints if needed
3. Test with a small real transaction

## Troubleshooting

**"Edge Function not available" error:**
- The function hasn't been deployed yet. Follow steps above.

**"No authorization header" error:**
- JWT verification is disabled in `config.toml` - this is correct for client-side apps

**Stripe payment fails:**
- Check that `STRIPE_SECRET_KEY` is set correctly in Supabase secrets
- Ensure you're using the right key format (sk_live_ for production, sk_test_ for testing)

## Important Notes

- **Never** commit your Stripe secret key to git
- The frontend uses `pk_live_` (publishable key) - safe to expose
- The backend uses `sk_live_` (secret key) - never expose this
- Test thoroughly with test keys before going live
