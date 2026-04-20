# FlashType

FlashType is a minimal real-time multiplayer typing battle app built as a monorepo.

## Tech Stack

- Client: React + Vite + React Router + plain CSS
- Server: Node.js + Express + Socket.io
- State: in-memory room manager (no database)

## Run Instructions

### One-command setup (from repo root)

```bash
npm install
npm run install:all
```

### Start both client and server together (from repo root)

```bash
npm run dev
```

### Manual run (separate terminals)

#### 1) Start server (port 3001)

```bash
cd server
npm install
node index.js
```

#### 2) Start client (port 5173)

```bash
cd client
npm install
npm run dev
```

## Notes

- Socket.io CORS is configured for `http://localhost:5173`
- No authentication is used (username only)
- Rooms and race state are in-memory and reset when server restarts
