# autodialer

A modern, production-ready WebRTC power dialer designed for outbound sales and cold outreach. Built with Next.js, Tailwind CSS, and Zustand.

## Features

- **Light Mode UI**: High-density, clean dashboard optimized for sales productivity.
- **XLSX Prospect Upload**: Drag and drop `.xlsx` files. Smart mapping handles various headers for Name, Phone, Google Maps URL, hasWebsite, etc.
- **Smart Phone Normalization**: Automatically detects the dominant phone format in a batch and normalizes all entries (e.g., converting `(212) 812-9200` to `+1 212-812-9200` if the batch is mostly +1).
- **WebRTC Calling**: Directly connects to Zadarma SIP trunk for browser-based calling.
- **Queue Control**: Start auto-dialing, pause, skip, or stop the session anytime.
- **Manual Lead Entry**: Add single or multiple leads manually with fields for **Timezone** and **Niche**.
- **LocalStorage Persistence**: All leads and call history survive page refreshes with zero setup required.
- **CRM Integration Ready**: Supabase integration is pre-architected; just add environment variables.

## Prerequisites

- Node.js (v18+)
- Zadarma account with SIP number and WebRTC login/password.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configuration (`.env`):
Create a `.env` file in the root based on `.env.example`:
```bash
NEXT_PUBLIC_ZADARMA_SIP_LOGIN=12345
NEXT_PUBLIC_ZADARMA_SIP_PASSWORD=your_password
```

3. Run:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Lead Data Schema

The dialer works best with these column headers in your XLSX:
- **Name** (or First Name / Company)
- **Phone Number**
- **Timezone**
- **Niche**
- **Google Maps URL**
- **Has Website**

## Persistence

Currently, the application uses **LocalStorage** via Zustand `persist` middleware. This means your data is stored securely in your own browser. To use Supabase for team-wide persistence, see `src/store/leadStore.ts` and provide the following variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
