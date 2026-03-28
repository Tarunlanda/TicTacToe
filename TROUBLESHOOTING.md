# Troubleshooting Guide

## Common Issues and Solutions

---

## Deployment Issues

### Issue: "Build failed: npm install error"

**Symptoms:**
```
error: ERR! 404 Not Found - npm install
error: ERR! code E404
```

**Causes:**
- Missing `package.json` in client or server directory
- Corrupted lock file (`package-lock.json` or `pnpm-lock.yaml`)
- Network connectivity issue during build

**Solutions:**

1. **Verify package.json exists:**
   ```bash
   ls -la client/package.json
   ls -la server/package.json
   ```

2. **Delete and regenerate lock file:**
   ```bash
   cd client
   rm package-lock.json pnpm-lock.yaml
   npm install
   ```

3. **Check registry access:**
   ```bash
   npm config get registry
   # Should be: https://registry.npmjs.org/
   ```

4. **Push changes and redeploy:**
   ```bash
   git add package*.json
   git commit -m "Update dependencies"
   git push origin main
   ```

---

### Issue: "Docker build failed"

**Symptoms:**
```
error: failed to build image: build step failed
```

**Common causes:**
- Dockerfile syntax error
- Base image not found
- TypeScript compilation errors

**Solutions:**

1. **Test build locally:**
   ```bash
   cd server
   docker build -t tictactoe-nakama:test .
   ```

2. **Check Dockerfile:**
   ```dockerfile
   FROM node:alpine AS node-builder  # ✓ Correct
   FROM node:14                      # ✓ Correct
   FROM node:latest                  # ⚠️ May cause issues
   ```

3. **Compile TypeScript locally:**
   ```bash
   cd server
   npm install
   npx tsc
   # Check for compilation errors
   ```

4. **View full build logs in DigitalOcean:**
   - App Platform → Your app → Builds → Failed build → **View Logs**

---

### Issue: "Deployment stuck at 'Waiting for deployment'"

**Symptoms:**
- App shows "Building" or "Deploying" for > 20 minutes
- No error messages

**Solutions:**

1. **Check resources:**
   - DigitalOcean → App Platform → Your app → **Resources**
   - Ensure containers have sufficient memory (512MB minimum)

2. **Check build logs:**
   - Click on the deployment in progress
   - View build/deployment logs

3. **Cancel and retry:**
   - Click **Cancel** on the stuck deployment
   - Make a small change (e.g., update README)
   - Push to GitHub to trigger new build

4. **Check GitHub connection:**
   - Settings → GitHub integration
   - Re-authorize if needed

---

## Connectivity Issues

### Issue: Frontend cannot connect to backend

**Symptoms:**
```
WebSocket connection failed
Error: Failed to connect to Nakama
Network error: Connection refused
```

**Causes:**
- Backend not running
- Incorrect API endpoint in environment variables
- Firewall blocking WebSocket connections
- HTTPS/SSL mismatch

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl https://nakama-api-xxx.ondigitalocean.app:7350/
   ```
   Should return a response (not "Connection refused")

2. **Check environment variables in frontend:**
   - DigitalOcean App Platform → frontend service → **Envs**
   - Verify:
     ```
     NEXT_PUBLIC_SERVER_API=nakama-api-xxx.ondigitalocean.app
     NEXT_PUBLIC_SERVER_PORT=443
     NEXT_PUBLIC_USE_SSL=true
     ```

3. **Check backend logs:**
   - App Platform → nakama-api service → **Logs**
   - Look for errors like "listen EACCES" or port binding issues

4. **Verify HTTPS/SSL configuration:**
   ```javascript
   // lib/nakama.ts should use SSL when NEXT_PUBLIC_USE_SSL=true
   const useSSL = process.env.NEXT_PUBLIC_USE_SSL === 'true';
   client = new Client('nakama-api-xxx.ondigitalocean.app', 443, useSSL);
   ```

5. **Test connection directly:**
   ```bash
   # Install wscat: npm install -g wscat
   wscat -c wss://nakama-api-xxx.ondigitalocean.app:7350/
   # Should connect successfully
   ```

---

### Issue: "WebSocket connection timeout"

**Symptoms:**
- Connection established but no messages received
- Game appears frozen

**Causes:**
- Network latency
- Firewall dropping long-lived connections
- Backend overloaded
- Nakama console ports interfering (7351)

**Solutions:**

1. **Increase WebSocket timeout:**
   - In `lib/nakama.ts`:
     ```typescript
     const client = new Client('api', port, ssl, 3000); // 3s timeout
     // Change to:
     const client = new Client('api', port, ssl, 10000); // 10s timeout
     ```

2. **Check Nakama configuration:**
   - `server/data/local.yml`:
     ```yaml
     session:
       token_expiry_sec: 7200
       refresh_token_expiry_sec: 604800
     ```

3. **Monitor backend performance:**
   - Check if CPU/memory usage is high
   - Reduce number of concurrent matches if needed

4. **Test with different network:**
   - Try mobile hotspot instead of WiFi
   - Try different region's WiFi (to test network variability)

---

### Issue: CORS (Cross-Origin) errors

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Causes:**
- Frontend and backend on different domains
- Missing CORS headers in backend

**Solutions:**

1. **Verify backend CORS configuration:**
   - Check `server/src/main.ts` for CORS setup
   - Should allow frontend origin:
     ```typescript
     app.use(cors({
       origin: 'https://frontend-xxx.ondigitalocean.app',
       credentials: true
     }));
     ```

2. **For development, allow all origins:**
   ```typescript
   app.use(cors({ origin: '*' }));
   ```

3. **Check Nakama HTTP configuration:**
   - `server/data/local.yml`:
     ```yaml
     http:
       address: "0.0.0.0"
       port: 7350
       ssl_certificate: ""
       ssl_private_key: ""
     ```

---

## Database Issues

### Issue: "Database connection refused"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
database connection failed
```

**Causes:**
- Database not running
- Incorrect credentials
- Database host/port wrong
- Network access not allowed

**Solutions:**

1. **Verify database is running:**
   - DigitalOcean → Databases → Your cluster → Status
   - Should show "Available" (green)

2. **Check environment variables:**
   - Backend service → **Envs** tab
   - Verify all database variables:
     ```
     DATABASE_HOST=cluster-xyz.db.ondigitalocean.com
     DATABASE_PORT=25060
     DATABASE_USER=doadmin
     DATABASE_PASSWORD=***
     DATABASE_NAME=nakama
     ```

3. **Test connection from backend logs:**
   - App Platform → nakama-api → **Logs**
   - Look for database connection messages

4. **Check database firewall:**
   - Databases → Your cluster → **Settings** → **Trusted sources**
   - Should include "App Platform" or allow access

5. **Reset database password:**
   - Databases → Your cluster → **Settings**
   - Click "Reset password" for doadmin user
   - Update environment variables with new password

---

### Issue: "Database timeout"

**Symptoms:**
```
Error: query timeout after 30000ms
```

**Causes:**
- Database under heavy load
- Slow queries
- Too many concurrent connections

**Solutions:**

1. **Check database logs:**
   - Databases → Your cluster → **Logs**
   - Look for slow queries

2. **Optimize queries:**
   - Ensure indexes exist on frequently queried columns
   - Example for match_history:
     ```sql
     CREATE INDEX idx_player_matches ON match_history(player_1_id, created_at);
     CREATE INDEX idx_player_wins ON leaderboard(elo_rating);
     ```

3. **Increase database resources:**
   - If cluster is at capacity, upgrade to larger plan
   - Databases → Your cluster → **Resize**

4. **Limit concurrent connections:**
   - In Nakama config, set max connection pool size

---

### Issue: "Disk space full"

**Symptoms:**
```
Error: no space left on device
database write error
```

**Solutions:**

1. **Check database storage:**
   - Databases → Your cluster → **Metrics**
   - View storage usage

2. **Increase storage:**
   - Databases → Your cluster → **Resize**
   - Increase disk size (can only increase, not decrease)

3. **Clean up old data:**
   - Delete old match history (if not needed for analytics)
   - Truncate tables with large data

---

## Game Logic Issues

### Issue: "Game move rejected with no error message"

**Symptoms:**
- Click square, nothing happens
- Board doesn't update
- No error shown in console

**Causes:**
- Invalid move (square already taken)
- Wrong player's turn
- Server-side validation failure
- Network desync

**Solutions:**

1. **Check browser console (F12):**
   - Look for error messages
   - Check network tab for failed requests

2. **Verify game state:**
   - In frontend, log current board state when move is made
   - Compare with server state

3. **Check Nakama logs:**
   - App Platform → nakama-api → **Logs**
   - Look for move validation errors

4. **Restart game:**
   - If state is corrupted, abandon match and start new one

---

### Issue: "Game state inconsistency between players"

**Symptoms:**
- One player sees different board state than other
- One player thinks they won, other doesn't
- Moves appear out of order

**Causes:**
- Network packet loss
- Nakama state not persisted correctly
- Desynchronized game loop

**Solutions:**

1. **Verify game state persistence:**
   - Check Nakama match state storage:
     ```typescript
     // In match_handler.ts
     state.board = [...];
     return state; // Must be returned to persist
     ```

2. **Add state reconciliation:**
   - Client requests full board state from server periodically
   - Validate against local state

3. **Check network latency:**
   - Use browser DevTools → Network tab
   - Monitor latency to WebSocket endpoint
   - If > 500ms, may cause sync issues

4. **Review match_loop implementation:**
   - Ensure deterministic (same input = same output)
   - No randomness in move validation
   - Timestamps should not affect move logic

---

## Performance Issues

### Issue: "Game is lagging or slow to respond"

**Symptoms:**
- Moves take several seconds to show on screen
- Frequent timeouts
- High latency in console

**Causes:**
- High server load
- Network latency > 300ms
- Frontend rendering performance issue
- Database queries too slow

**Solutions:**

1. **Check server load:**
   - DigitalOcean → App Platform → nakama-api → **Metrics**
   - Monitor CPU and memory usage
   - If consistently high (> 80%), upgrade instance size

2. **Monitor network latency:**
   ```bash
   # Ping the backend
   ping nakama-api-xxx.ondigitalocean.app
   # Should be < 100ms
   ```

3. **Profile frontend performance:**
   - Chrome DevTools → Performance tab
   - Record and analyze rendering
   - Look for slow components

4. **Optimize database queries:**
   - Check slow query logs
   - Add indexes if necessary
   - Use EXPLAIN ANALYZE to optimize queries

5. **Scale horizontally:**
   - Add more Nakama instances (requires load balancer)
   - Distribute matches across multiple servers

---

### Issue: "Frontend takes too long to load"

**Symptoms:**
- Blank page for > 5 seconds
- Slow first interaction

**Causes:**
- Large bundle size
- Slow API calls during load
- Network issues

**Solutions:**

1. **Check bundle size:**
   ```bash
   cd client
   npm run build
   # Check .next/static/chunks for large files
   ```

2. **Optimize images:**
   - Use WebP format
   - Compress with ImageOptim or similar

3. **Enable caching:**
   - Verify CDN is enabled (DigitalOcean provides this)
   - Set proper cache headers in Next.js config

4. **Lazy load components:**
   ```typescript
   const GameBoard = dynamic(() => import('./board'), {
     loading: () => <p>Loading...</p>
   });
   ```

---

## Monitoring and Alerts

### Setup Health Checks

**Frontend:** Check every 60 seconds
```
Endpoint: https://frontend-xxx.ondigitalocean.app/
Expected: 200 OK, response time < 2s
```

**Backend:** Check every 30 seconds
```
Endpoint: https://nakama-api-xxx.ondigitalocean.app:7350/
Expected: 200 OK, response time < 500ms
```

### Key Metrics to Monitor

- **Latency (p50, p95, p99)**
- **Error rate (errors/requests)**
- **Concurrent players**
- **Database connections**
- **CPU and memory usage**
- **Disk I/O**

---

## Getting Help

If you encounter issues not listed here:

1. **Check DigitalOcean Docs:** https://docs.digitalocean.com/
2. **Check Nakama Docs:** https://heroiclabs.com/docs/
3. **View application logs:**
   - App Platform → Your app → Logs
   - Filter by service (frontend/backend)
   - Sort by newest first
4. **Check build logs:**
   - App Platform → Deployments → Failed deployment → Logs
5. **Contact DigitalOcean Support:**
   - Dashboard → Support → Create Ticket

---

## Useful Commands

### SSH into Droplet (if using Droplet instead of App Platform)

```bash
ssh root@your_droplet_ip
```

### View Docker logs locally

```bash
docker-compose logs -f nakama
docker-compose logs -f postgres
```

### Test Nakama connection

```bash
# Health check
curl http://localhost:7350/

# gRPC endpoint
grpcurl -plaintext localhost:7349 list
```

### Database connection test

```bash
psql -h localhost -U doadmin -d nakama
# Password: (your password)
```
