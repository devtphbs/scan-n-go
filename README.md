# Scan & Go - Grocery Scanner Web App

A full-stack grocery scanning application similar to Willys Scan & Go, built with vanilla JavaScript and Supabase.

## Features

- 📱 **Mobile-friendly** barcode scanning using phone camera
- 🛒 **Shopping cart** with real-time inventory updates
- 🔐 **Authentication** system with admin access
- 📊 **Admin panel** for product management
- 🏷️ **Automatic barcode generation** (EAN-13 format)
- 💰 **Discount system** (percentage-based)
- ⚡ **Real-time updates** using Supabase subscriptions
- 🔊 **Sound feedback** on successful scans

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Barcode Scanning**: html5-qrcode
- **Barcode Generation**: JsBarcode
- **Styling**: Modern CSS with mobile-first design

## Project Structure

```
ScanNGo/
├── public/
│   ├── index.html          # Main scanner page
│   ├── login.html          # Login page
│   ├── admin.html          # Admin panel
│   ├── app.js              # Main app logic
│   ├── admin.js            # Admin panel logic
│   └── style.css           # Mobile-friendly styles
├── lib/
│   ├── supabaseClient.js   # Supabase configuration
│   └── barcode.js          # Barcode utilities
├── SUPABASE_SETUP.md       # Database setup guide
└── README.md              # This file
```

## Quick Start

### 1. Setup Supabase

Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Create a Supabase project
2. Get your API credentials
3. Create the products table
4. Set up Row Level Security policies
5. Enable Realtime subscriptions
6. Configure authentication

### 2. Configure the App

Edit `lib/supabaseClient.js` and add your Supabase credentials:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Run Locally

#### Option A: Simple File Opening (Easiest)
1. Open `public/index.html` in your browser
2. Note: Some features may not work due to CORS restrictions

#### Option B: Local Server (Recommended)
Using Node.js:
```bash
# Install http-server globally
npm install -g http-server

# Navigate to project directory
cd ScanNGo

# Start server
http-server public -p 3000

# Open http://localhost:3000 in your browser
```

Using Python:
```bash
# Python 3
python -m http.server 3000 --directory public

# Python 2
python -m SimpleHTTPServer 3000 --directory public
```

Using VS Code Live Server extension:
1. Install "Live Server" extension
2. Right-click `public/index.html`
3. Select "Open with Live Server"

## Usage Guide

### For Customers

1. **Scan Products**: Point your camera at product barcodes
2. **View Cart**: See scanned items with prices and stock
3. **Manage Cart**: Adjust quantities or remove items
4. **Checkout**: View total and complete purchase (demo mode)

### For Admins

1. **Login**: Use `hildingws2013@gmail.com` (or your configured admin email)
2. **Add Products**: Fill the form to add new products
3. **Auto-Generated Barcodes**: Each product gets a unique EAN-13 barcode
4. **Manage Inventory**: Edit product details, stock, and discounts
5. **Print Barcodes**: Generated barcodes can be printed for physical products

## Core Features Explained

### Barcode System

- **EAN-13 Format**: 13-digit barcodes with checksum validation
- **Auto-Generation**: Unique barcodes created automatically for new products
- **Validation**: Ensures barcode format is correct before processing
- **Scanning**: Uses html5-qrcode library for camera-based scanning

### Real-Time Inventory

- **Live Updates**: Stock levels update instantly across all connected clients
- **Stock Protection**: Prevents adding out-of-stock items to cart
- **Automatic Deduction**: Stock decreases when items are scanned
- **Visual Feedback**: Shows current stock levels and warnings

### Authentication & Security

- **Email Login**: Simple email/password authentication via Supabase Auth
- **Admin Access**: Only specified admin email can access product management
- **Row Level Security**: Database-level protection for product data
- **Public Read Access**: Anyone can view products (for scanning)

### Discount System

- **Percentage Discounts**: Configurable percentage-based discounts
- **Real-Time Calculation**: Prices update instantly with discounts applied
- **Flexible Configuration**: Easy to add more discount types in future

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd ScanNGo
   vercel --prod
   ```

3. **Configure Environment Variables**:
   - Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel dashboard
   - Update your Supabase project settings to include your Vercel domain

### Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   cd ScanNGo
   netlify deploy --prod --dir=public
   ```

3. **Configure Environment Variables** in Netlify dashboard

### GitHub Pages

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Select source branch and `/public` folder
4. Note: You'll need to handle Supabase credentials differently for static hosting

## Development

### Adding New Features

1. **Database Changes**: Update Supabase schema and RLS policies
2. **Frontend Changes**: Modify HTML, CSS, or JavaScript files
3. **Testing**: Test thoroughly on mobile devices
4. **Deployment**: Deploy changes to your hosting platform

### Customization

- **Admin Email**: Change in `app.js`, `admin.js`, and Supabase RLS policies
- **Styling**: Modify `style.css` for different themes
- **Barcode Format**: Update `barcode.js` for different barcode types
- **Discount Types**: Extend discount system in database and frontend

## Troubleshooting

### Common Issues

**Camera not working:**
- Check browser permissions for camera access
- Use HTTPS in production (required for camera access)
- Try different browsers (Chrome, Firefox, Safari)

**Barcode not scanning:**
- Ensure good lighting and focus
- Hold camera steady at appropriate distance
- Check if barcode is EAN-13 format

**Real-time not updating:**
- Verify Supabase Realtime is enabled
- Check browser console for WebSocket errors
- Ensure user has proper permissions

**Admin access denied:**
- Verify email matches exactly (including case)
- Check RLS policies in Supabase
- Ensure user is properly authenticated

### Getting Help

1. Check browser console for error messages
2. Review Supabase dashboard logs
3. Verify all setup steps were completed
4. Test with sample data first

## License

This project is for educational purposes. Feel free to modify and use it for your own grocery scanning needs.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Built with ❤️ using modern web technologies**
