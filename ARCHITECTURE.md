# System Architecture

## Overview

TicTacToe-Nakama is a real-time multiplayer game application with a modern frontend and authoritative game server backend. This document describes the architecture, components, and data flow.

---

## High-Level Architecture

### DigitalOcean Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                     Internet / Players                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS + WSS (WebSocket Secure)
             │
     ┌───────▼──────────────────────────────────────────────────┐
     │         DigitalOcean App Platform (Managed)              │
     │                                                           │
     │  ┌──────────────────────┐   ┌──────────────────────────┐ │
     │  │   FRONTEND (Port 3000)│   │  BACKEND (Port 7350)    │ │
     │  │                      │   │                         │ │
     │  │   Next.js App        │   │  Nakama Game Server     │ │
     │  │   ├─ Home Page       │   │  ├─ Match Handler      │ │
     │  │   ├─ Game Board      │   │  ├─ RPC Endpoints      │ │
     │  │   ├─ Modals          │   │  ├─ WebSocket Server   │ │
     │  │   └─ Theme Provider  │   │  └─ Console (7351)     │ │
     │  │                      │   │                         │ │
     │  └──────────┬───────────┘   └────────────┬────────────┘ │
     │             │                            │               │
     │             │     REST + WebSocket       │               │
     │             └────────────────┬───────────┘               │
     │                              │                           │
     │                    ┌─────────▼────────────┐              │
     │                    │  PostgreSQL Database  │              │
     │                    │  ├─ User Accounts    │              │
     │                    │  ├─ Game History    │              │
     │                    │  ├─ Match States    │              │
     │                    │  └─ Leaderboards    │              │
     │                    └──────────────────────┘              │
     └─────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend (Next.js React Application)

**Location:** `/client`

**Technology Stack:**
- **Framework:** Next.js 13.4 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** React Hooks + Context
- **Real-time Client:** @heroiclabs/nakama-js
- **Language:** TypeScript

**Components:**

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── tictactoe/
│       └── page.tsx        # Game page
├── components/
│   ├── board.tsx           # Game board grid
│   ├── square.tsx          # Individual board square
│   ├── game-controller.tsx # Game state logic
│   ├── nickname-modal.tsx  # Player name input
│   ├── waiting-screen.tsx  # Opponent waiting UI
│   ├── winner-screen.tsx   # Game result screen
│   ├── site-header.tsx     # Navigation header
│   ├── theme-provider.tsx  # Dark/light mode
│   ├── theme-toggle.tsx    # Theme switcher button
│   └── ui/                 # Radix UI wrapper components
├── lib/
│   ├── nakama.ts          # Nakama client wrapper
│   ├── messages.ts        # Type definitions
│   └── utils.ts           # Utility functions
└── styles/
    └── globals.css        # Global styles
```

**Key Features:**
- Real-time game updates via WebSocket
- Responsive design (mobile-friendly)
- Dark/light mode toggle
- Player nickname customization
- Match finding and queuing
- Win/loss tracking

**Environment Variables:**
```
NEXT_PUBLIC_SERVER_API=nakama-api.ondigitalocean.app
NEXT_PUBLIC_SERVER_PORT=443
NEXT_PUBLIC_USE_SSL=true
```

### 2. Backend (Nakama Game Server)

**Location:** `/server`

**Technology Stack:**
- **Runtime:** Nakama 3.17.0 (Open-source game server)
- **Language:** TypeScript compiled to JavaScript
- **Node.js Runtime:** Nakama's built-in V8 engine
- **Protocol:** gRPC + HTTP REST + WebSocket
- **Database:** PostgreSQL 12

**Modules:**

```
src/
├── main.ts              # Module initialization & RPC registration
├── match_handler.ts     # Game match logic
├── match_rpc.ts         # Match finding/creation RPC
├── messages.ts          # Protocol buffer message types
└── daily_rewards.ts     # Optional reward system
```

**Match Handler Logic:**

```
match_handler.ts:
  ├── match_init()       # Initialize match state
  │   ├── Create game board (3x3)
  │   ├── Assign players (X and O)
  │   └── Set turn to player 1
  │
  ├── match_join()       # Handle player joining
  │   ├── Store player session
  │   └── Send initial game state
  │
  ├── match_loop()       # Game loop (every frame/message)
  │   ├── Receive player move
  │   ├── Validate move (empty square, valid turn)
  │   ├── Update board state
  │   ├── Check win condition (8 patterns)
  │   ├── Check draw condition
  │   ├── Toggle turn or end game
  │   └── Broadcast state to players
  │
  ├── match_leave()      # Handle player disconnect
  │   ├── Mark player as left
  │   └── End match if both left
  │
  └── match_terminate()  # Cleanup
      └── Save game history to database
```

**OpCodes (Message Types):**
- `START` (0): Game started
- `UPDATE` (1): Board state update
- `DONE` (2): Game finished
- `MOVE` (3): Player made a move
- `REJECTED` (4): Invalid move

**RPC Endpoints:**
```
find_match_js(label)
  ├── Query for available matches with label
  ├── If found: Join existing match
  └── If not: Create new match
```

### 3. Database (PostgreSQL)

**Location:** DigitalOcean Managed PostgreSQL

**Schema:**

```sql
-- Users/Accounts
users
├── id (UUID)
├── username (VARCHAR)
├── email (VARCHAR, optional)
└── created_at (TIMESTAMP)

-- Match History
match_history
├── id (UUID)
├── player_1_id (FK → users.id)
├── player_2_id (FK → users.id)
├── winner_id (FK → users.id, nullable)
├── board_state (JSON)
├── moves (JSON array)
├── duration (INTERVAL)
├── created_at (TIMESTAMP)
└── ended_at (TIMESTAMP)

-- Leaderboard
leaderboard
├── user_id (PK, FK → users.id)
├── wins (INT)
├── losses (INT)
├── draws (INT)
├── elo_rating (FLOAT)
└── updated_at (TIMESTAMP)
```

---

## Data Flow

### Game Initialization

```
1. Player A launches frontend app
2. Frontend connects to Nakama WebSocket
   └─ NEXT_PUBLIC_SERVER_API + NEXT_PUBLIC_SERVER_PORT
3. Player enters nickname
4. Frontend calls: find_match_js RPC
5. Nakama creates new match
   ├─ Initialize empty board (3x3)
   ├─ Wait for opponent
   └─ Send MATCH_ID to player A
```

### Game In Progress

```
Player A (X)                          Server (Nakama)                   Player B (O)
    │                                      │                                │
    │──── MOVE opcode (row, col) ─────────>│                               │
    │                                      │ Validate move                 │
    │                                      ├─ Check if square empty        │
    │                                      ├─ Check if correct player turn │
    │                                      ├─ Update board state           │
    │                                      ├─ Check win condition          │
    │                                      └─ Toggle turn                  │
    │                                      │                               │
    │                                      │──── UPDATE opcode ────────────>│
    │<───────── UPDATE opcode ────────────-│ (board, next_player)          │
    │ (board, next_player)                │                               │
    │                                      │ Broadcast new state           │
    │                                      │                               │
    │ Player B makes move                 │<── MOVE opcode (row, col) ────│
    │<───────── UPDATE opcode ────────────-│                               │
    │                                      └──> Validate and broadcast
```

### Game Completion

```
1. Player makes winning move
2. Server detects three-in-a-row
3. Server sends DONE opcode with:
   ├─ winner_id
   ├─ final_board
   └─ game_duration
4. Both players receive result
5. Server saves to database:
   ├─ Match history
   └─ Update leaderboard
6. UI shows winner screen
7. Players can start new match or leave
```

---

## Communication Protocol

### WebSocket Messages

**Format:** Binary protobuf or JSON

**Message Structure:**
```protobuf
message Envelope {
  int64 cid = 1;              // Correlation ID
  string type = 2;            // "match", "rpc", "auth"
  int32 opcode = 3;           // Game opcode (0-4)
  bytes data = 4;             // Payload
  string error = 5;           // Error message (if any)
}

message Move {
  int32 row = 1;              // Board row (0-2)
  int32 col = 2;              // Board column (0-2)
  string player_id = 3;       // Player ID
}

message BoardState {
  repeated int32 board = 1;   // 9 elements: 0=empty, 1=X, 2=O
  int32 current_player = 2;   // Whose turn (1 or 2)
  repeated Move moves = 3;    // Move history
}
```

---

## Server Deployment on DigitalOcean

### Container Architecture

```
DigitalOcean App Platform
├── Service: frontend (Node.js Next.js)
│   └── Port 3000
├── Service: nakama-api (Docker container)
│   ├── Nakama Runtime (JavaScript modules)
│   ├── Port 7349 (gRPC)
│   ├── Port 7350 (HTTP REST + WebSocket)
│   └── Port 7351 (Web Console)
└── Database: PostgreSQL 12 (Managed)
    └── Port 5432 (private to app platform)
```

### Environment Configuration

**Backend Environment Variables:**
```
DATABASE_HOST=cluster.db.ondigitalocean.com
DATABASE_PORT=25060
DATABASE_USER=doadmin
DATABASE_PASSWORD=***
DATABASE_NAME=nakama
```

**Frontend Environment Variables:**
```
NEXT_PUBLIC_SERVER_API=nakama-api.ondigitalocean.app
NEXT_PUBLIC_SERVER_PORT=443
NEXT_PUBLIC_USE_SSL=true
```

---

## Performance Characteristics

### Latency

- **Frontend load time:** < 2 seconds (with CDN)
- **Match finding:** 1-5 seconds (depends on player queue)
- **Move validation:** < 50ms
- **Game state broadcast:** < 100ms to all players

### Scalability

**Current deployment (1 container):**
- Handles ~100 concurrent matches
- ~1,000 monthly active players

**For 10x growth:**
- Horizontal scaling: Add more Nakama instances
- Use DigitalOcean Load Balancer
- Add database read replicas

---

## Security Architecture

### Authentication Flow

```
1. Device connects to Nakama
2. Nakama auto-creates device account
3. Device gets auth token (valid 2 hours)
4. Token used for all subsequent requests
5. WebSocket authenticated via token
```

### Data Protection

- **In Transit:** HTTPS + WSS (TLS 1.3)
- **At Rest:** PostgreSQL encryption (optional via DigitalOcean)
- **Database Access:** Private network only (no public IP)
- **Console Access:** Username + password (should be changed)

### Access Control

```
Frontend (Public)
    ↓
Nakama API (Rate-limited, requires auth)
    ↓
PostgreSQL (Private network only)
    ↓
Backups (Encrypted, daily)
```

---

## Monitoring & Observability

### Key Metrics

- **Frontend:** Page load time, errors, user sessions
- **Backend:** Request latency, match count, player count
- **Database:** Connection pool, query performance, storage

### Logging

- **Frontend:** Browser console logs
- **Backend:** Nakama logs (INFO/DEBUG level)
- **Database:** Query logs, connection logs

### Alerts

Recommended alerts:
- Backend CPU > 80%
- Database connections > 80 of max pool
- Deployment failures
- High error rates (> 1%)

---

## Future Enhancements

- [ ] ELO rating system
- [ ] Ranked leaderboard
- [ ] Daily rewards
- [ ] Tournament system
- [ ] Mobile app (React Native)
- [ ] Social features (friends, chat)
- [ ] Spectator mode
- [ ] AI opponent (difficulty levels)
