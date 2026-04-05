# Vi-Notes

Vi-Notes is a small project built to experiment with writing-authenticity signals, starting with keystroke timing.

The goal of this version is simple: track how someone types in a writing session without storing what they actually type.

## What This Version Includes

- A React + TypeScript writing interface
- A Node.js + Express API (TypeScript)
- In-memory session storage (no database)
- Session lifecycle: start, collect keystrokes, end, inspect

## What Gets Captured

For each keyboard event during an active session, the app stores:

- `timestamp`
- `eventType` (`keydown` or `keyup`)
- `keyClass` (printable, whitespace, modifier, navigation, editing, system, other)
- `interKeyIntervalMs` (time between consecutive keydown events)
- `holdDurationMs` (time between keydown and keyup for a key)
- `isRepeat`
- `cursorPosition`
- `selectionLength`

Privacy note:

- Raw typed characters are not sent as keystroke data.

## Project Structure

- `client` - React frontend
- `server` - Express backend

## API Endpoints

- `POST /api/sessions/start` start a session
- `POST /api/sessions/:sessionId/keystrokes` send a batch of keystroke events
- `POST /api/sessions/:sessionId/end` end a session
- `GET /api/sessions` list session summaries
- `GET /api/sessions/:sessionId` get full session data
- `GET /api/health` health check

## Run Locally (Windows)

1. Install Node.js 20+
2. Install dependencies:

```powershell
npm install
```

3. Start both frontend and backend:

```powershell
npm run dev
```

4. Open the app in your browser:

- `http://localhost:5173`

5. Typical flow in the app:

- Click **Start Session**
- Type in the editor
- Click **End Session**

6. Check stored session data from API:

```powershell
curl http://localhost:4000/api/sessions
```

## Fixed Local URLs

- API server runs on `http://localhost:4000`
- Frontend runs on `http://localhost:5173`
- Frontend API base is `http://localhost:4000/api`

## Build

```powershell
npm run build
```

## Current Limitation

Session data is stored in memory, so it resets when the server restarts.

## Why It Is Kept Simple

This is intentionally lightweight for easy review and submission:

- no database setup
- no desktop runtime setup
- direct, readable code paths

## License

MIT
