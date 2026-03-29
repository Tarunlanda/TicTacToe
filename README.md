# nextjs-nakama

A simple Tic-Tac-Toe multiplayer online game build with nextjs and nakama



##  Url for front end

Link of the front end : https://tic-tac-toe-xi-red-68.vercel.app/



- document
  - [nakama server](https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/)

# Usage

## client

template from https://github.com/shadcn-ui/next-template

```
cd clien && cp .env.example .env.local
cd client && pnpm install
cd client && pnpm run dev
```

## server

template from https://github.com/heroiclabs/nakama-project-template

```
# if you want to yarn or pnpm, you should also change Dockerfile
cd server && npm install
cd server && docker-compose up

# when change source code, rebuild docker
cd server && docker-compose up --build
```

### port

- "7349": gRPC API server
- "7350": HTTP API server
- "7351": http://127.0.0.1:7351 : nakama console (web ui)
  - username and password can set in `/data/my-config.yml`

## Local Development

### Client
```bash
cd client && cp .env.example .env.local
cd client && pnpm install
cd client && pnpm run dev
# Runs on http://localhost:3000
```

### Server
```bash
cd server && npm install
cd server && docker-compose up

# When code changes:
cd server && docker-compose up --build
```

### Ports
- **7349**: gRPC API server
- **7350**: HTTP API server (WebSocket)
- **7351**: Nakama console (http://localhost:7351)
  - Username: `admin`
  - Password: `password`

---

## Manual Deployment (Advanced)

For custom hosting, VPS, or Kubernetes:

```bash
# Build frontend
cd client && npm run build && npm run start

# Build and run server
cd server && npm install
cd server && docker build -t tictactoe-nakama:latest .
docker run -d -p 7349:7349 -p 7350:7350 -p 7351:7351 \
  -e DATABASE_HOST=your_db_host \
  -e DATABASE_USER=your_user \
  -e DATABASE_PASSWORD=your_password \
  tictactoe-nakama:latest
```
