# MyTrips - Itinerary & Travel Assistant

MyTrips is a browser extension for Google Chrome & Mozilla Firefox designed to organize your trip itineraries, track flights and hotels, manage travel budgets, and auto-apply travel discount codes.

---

## Features

- **Automatic Travel Extraction**: Automatically detects and extracts booking details from top travel sites like Booking.com, Airbnb, Agoda, Trip.com, Cheapoair, Vrbo, and more.
- **Itinerary & Travel Hub**: Keeps track of all your upcoming flights, hotels, and trip schedules in one organized dashboard.
- **Budget Manager**: Track travel expenses, set budgets, and stay on top of costs per trip.
- **Discount & Coupon Finder**: Auto-applies travel discount codes to help you save on flights and accommodation.
- **Cross-Browser Support**: Native support for Manifest V3 (Google Chrome & Mozilla Firefox).

---

## Technology Stack

- **Framework**: React 19, TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

---

## Local Development & Build

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build extension for Chrome & Firefox
npm run build
```

The compiled browser extension bundle will be generated in the `dist/` directory.

### Loading into Browsers

#### Google Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked**.
4. Select the `dist/` folder.

#### Mozilla Firefox:
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` inside the `dist/` folder (or build `.zip` release).

---

## License

MIT License
