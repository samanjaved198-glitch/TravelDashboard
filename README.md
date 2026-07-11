# Wanderly — Travel Booking Dashboard

A responsive travel booking platform built with **vanilla HTML, CSS and JavaScript** — no frameworks, no build step. Just open `index.html` in a browser.

## ✨ Features

**Landing Page (`index.html`)**
- Sticky navbar with mobile hamburger menu
- Hero section with animated flight-path SVG and a destination search box
- Popular Destinations grid with live search + filters (country / price / rating)
- Wishlist (❤️) — saved instantly to `localStorage`
- Why Choose Us, Customer Reviews (auto + manual slider), FAQ accordion
- Newsletter signup with validation
- Animated stat counters, scroll progress bar, back-to-top button
- Toast notifications for every user action
- Full dark mode, persisted across visits

**Dashboard (`dashboard.html`)**
- Sidebar navigation across 6 views: Dashboard, Bookings, Wishlist, Notifications, Payments, Settings
- Stat cards (Total / Upcoming / Cancelled Trips, Wishlist, Total Spending) — computed live from your bookings
- Booking table with full **CRUD** (add, edit, delete with confirm modal) + search/status filter
- Recent Activity feed, auto-logged from booking actions
- Weather widget, Currency Converter, and a random Travel Tip generator
- Destination gallery reused from the landing page dataset
- Settings panel (profile fields, dark mode, notification toggle)

## 🗂️ Folder Structure

```
Travel-Booking-Dashboard/
├── index.html
├── dashboard.html
├── css/
│   ├── style.css        → design system, components, layout
│   └── responsive.css   → mobile / tablet / laptop breakpoints
├── js/
│   ├── app.js            → loader, navbar, scroll fx, counters, FAQ, slider, toasts, widgets, view switching
│   ├── search.js          → destinations dataset + search/filter + card rendering
│   ├── booking.js        → booking CRUD, stats, activity log, payments
│   ├── wishlist.js        → wishlist state (localStorage)
│   ├── darkmode.js        → theme toggle + persistence
│   └── validation.js      → form validation helpers
├── assets/
│   ├── images/ icons/ videos/   → empty, ready for your own media
└── README.md
```

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#2563EB` |
| Secondary | `#06B6D4` |
| Accent | `#F59E0B` |
| Background | `#F8FAFC` |
| Dark background | `#0F172A` |
| Display font | Poppins |
| Body font | Inter |

All colors, radii, shadows and transitions live in CSS custom properties at the top of `css/style.css` — change them once and the whole app updates.

## 💾 Data & Storage

Everything is stored client-side in `localStorage`, so it survives page refreshes with no backend:

| Key | Holds |
|---|---|
| `wanderly_theme` | `'light'` / `'dark'` |
| `wanderly_wishlist` | array of saved destination IDs |
| `wanderly_bookings` | array of booking records |
| `wanderly_activity` | recent activity feed (capped at 8) |

Destination data (Dubai, Cappadocia, Interlaken, Kuala Lumpur, Kyoto, Paris) lives in `js/search.js` as a plain array — add or edit entries there to change what appears on both the landing page and the dashboard gallery.

## 🚀 Running it

No build tools needed. Either:
1. Double-click `index.html`, or
2. Serve the folder locally for the best experience with relative paths:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```

## 🔧 Notes for further work

- Weather and currency-conversion figures are simulated (fixed sample rates) — swap in a real API call inside `initWeatherWidget()` / `initCurrencyConverter()` in `js/app.js` when ready.
- Destination card artwork is generated inline as SVG gradients + skyline silhouettes (`skylineSVG()` in `js/search.js`) so the project needs zero external images to look complete — drop real photos into `assets/images/` and swap the markup whenever you're ready.
