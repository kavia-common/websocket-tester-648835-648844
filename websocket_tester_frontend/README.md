# WebSocket Tester Frontend

A modern, minimalistic React UI to test WebSocket connections:
- Enter a WebSocket URL and connect/disconnect
- Send messages and see incoming messages in real time
- View logs (info/warn/error) and messages
- Save frequently used endpoints in the sidebar
- Copy and clear logs/messages

## Quick Start

1. Install dependencies:
   npm install

2. (Optional) Configure a default URL by creating an `.env` file from `.env.example`:
   cp .env.example .env
   # edit .env and set REACT_APP_DEFAULT_WS_URL

3. Run the app:
   npm start

Open http://localhost:3000 to view it.

## UI Layout

- Top navigation: app name and connection status
- Left sidebar: saved endpoints (add, use, delete)
- Main: connection controls (URL, connect/disconnect, send) and a real-time log area

## Notes

- This app interacts directly with WebSocket servers from the browser; no backend is required.
- Clipboard copy uses the standard Clipboard API.

## Scripts

- npm start - start dev server
- npm run build - production build
- npm test - run tests (CI-friendly)

## Environment Variables

- REACT_APP_DEFAULT_WS_URL - initial WebSocket URL shown in the input field
