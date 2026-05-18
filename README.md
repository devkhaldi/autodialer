# Lynxia Auto Dialer

A modern, production-ready auto dialer application designed for outbound sales and cold outreach agencies. Built with Next.js, Tailwind CSS, Zustand, and `sip.js` for WebRTC communication directly in the browser via Zadarma.

## Features

- **XLSX Prospect Upload**: Drag and drop `.xlsx` or `.csv` files to import your massive lead databases.
- **WebRTC Auto-Dialing**: Directly connects to Zadarma SIP trunk to execute calls from within the browser. 
- **Queue & Modals**: After a call concludes, a disposition modal lets you update lead status and notes safely before continuing.
- **Configurable Delays**: Configure dialer delays locally to abide by compliance or workflow preferences.
- **Live Metrics**: Dashboard and complete call history filtering out interested leads vs DNC lists.
- **Fully Local & State Managed**: Built securely; everything uses the client browser ensuring no data leakage outside of the frontend unless specified.

## Prerequisites

- Node.js (v18+)
- A Zadarma account with SIP numbers configured

## Setup Instructions

1. Install all dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill out your SIP account details:
```bash
NEXT_PUBLIC_ZADARMA_SIP_LOGIN=your_sip_login
NEXT_PUBLIC_ZADARMA_SIP_PASSWORD=your_sip_password
```

3. Run the development server:
```bash
npm run dev
```

4. Go to `http://localhost:3000`.

## Architecture Details

- **Stores**: Two main Zustand stores encapsulate the entire logic. `useLeadStore` acts as a normalized database tracker, whereas `useDialerStore` behaves as a finite state machine orchestrating the queue, timers, and WebRTC delays. 
- **SIP Client**: Utilizes `sip.js` wrapped inside `src/lib/sipClient.ts`. It securely communicates to Zadarma WebRTC gateways utilizing `navigator.mediaDevices`.

## Template XLSX

To test, simply upload any `.xlsx` with the following column headers:
- `First Name`
- `Last Name`
- `Phone Number` (Ensure numbers contain the dial code, depending on your Zadarma route set up, usually E.164 format)
- `Company`
- `Email`
