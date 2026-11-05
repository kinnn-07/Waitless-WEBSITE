# WaitLess — Skip the queue, not your turn

A mobile-first virtual queue and appointment-booking demo built with React, Vite, React Router, and Tailwind CSS.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Validate the app with `npm test` and `npm run build`.

## Demo mode

Three sample businesses are seeded on first run: City College Admin Office, CarePlus Clinic, and Glow Salon. Join queues as a guest with a name and 10-digit phone number, or open **Business login** with:

- Email: `admin@waitless.demo`
- Password: `waitless123`

All persistence is behind `src/demoService.js`. It stores demo data in browser `localStorage` and broadcasts updates to open tabs with `BroadcastChannel` (with the browser storage event as a fallback). The data stays in this browser profile and device; it is not uploaded to a server. Open the dashboard and customer token in separate tabs to demonstrate live queue changes.

The dashboard can simulate customers, edit services and hours, pause or resume the queue, and add walk-ins. A called customer becomes a no-show after two minutes. Browser notifications require explicit permission and a secure context such as localhost or HTTPS; the in-app turn-approaching banner appears at two people ahead.

This is a demo, not production authentication. Do not enter real customer information.

## Adding Firebase later

Keep the public operations in `src/demoService.js` as the persistence boundary and replace its implementation with Firebase:

1. Add Firebase configuration through environment variables; never commit credentials.
2. Implement business, service, hours, queue, and appointment operations with Firestore. Use transactions for token numbering and appointment-slot uniqueness.
3. Use Firebase Auth for business-admin identity and authorization; keep guest customer data limited to name and phone.
4. Replace `BroadcastChannel` and storage updates with Firestore snapshot listeners.
5. Add Firebase Cloud Messaging with explicit notification permission and a trusted server-side sender for turn alerts.
6. Add Firestore security rules, emulator tests, and required indexes before production use.

## Localization and PWA

English labels are currently in `src/i18n.js`, with Hindi and Marathi dictionaries started. The web app includes an installable manifest, icon, and a small offline app-shell service worker.
