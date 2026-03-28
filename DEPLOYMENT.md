# DigitalOcean Deployment Guide

This guide walks you through deploying the TicTacToe-Nakama application to DigitalOcean.

## Prerequisites

1. **DigitalOcean Account** - Sign up at [digitalocean.com](https://www.digitalocean.com)
2. **Docker Hub or DigitalOcean Container Registry (DOCR)** account
3. **GitHub account** with repository access
4. **DigitalOcean CLI** (optional, but recommended)
5. **Docker** installed locally

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│   DigitalOcean App Platform (Managed Platform)     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────┐         ┌──────────────────┐  │
│  │   Frontend App   │         │  Backend App     │  │
│  │  (Next.js)       │ ────┐   │ (Nakama/Docker)  │  │
│  │  Port: 3000      │     │   │ Port: 7350       │  │
│  └──────────────────┘     │   └────────┬─────────┘  │
│         │                 │            │             │
│         │                 └────────┐   │             │
│         │                          │   │             │
│         ▼                          ▼   ▼             │
│   ┌──────────────────────────────────────────────┐  │
│   │   PostgreSQL Managed Database (Private)     │  │
│   │   Port: 5432                                │  │
│   └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         ▼
   Public Internet (HTTPS)
```

## Step 1: Prepare DigitalOcean Resources

### 1.1 Create a Managed PostgreSQL Database

1. Go to **DigitalOcean Dashboard** → **Databases**
2. Click **Create a Database Cluster**
3. Configure:
   - **Engine:** PostgreSQL
   - **Version:** 12
   - **Cluster size:** Basic (1 node) for development, 3 nodes for production
   - **Region:** Choose closest to your users
   - **Database name:** `nakama`
   - **User:** `doadmin` (default)
4. Click **Create Database Cluster**
5. **Wait for cluster to be ready** (5-10 minutes)

### 1.2 Get Database Connection Details

1. In **Database** details page, find the **Connection Details** section
2. Note down:
   - **Host:** `your-db-cluster-do-user-...db.ondigitalocean.com`
   - **Port:** `25060`
   - **User:** `doadmin`
   - **Password:** (shown in Connection Details)
   - **Database:** `nakama`
3. Save these for later configuration

### 1.3 Configure Database Firewall

1. In Database details → **Settings** → **Trusted sources**
2. Add **App Platform** as a trusted source (will be done automatically when linking)
3. Note: Default allows access from DigitalOcean App Platform

---

## Step 2: Prepare GitHub Repository

### 2.1 Push Code to GitHub

```bash
# Initialize Git (if not already done)
cd TicTacToe-Nakama
git init
git add .
git commit -m "Initial commit: TicTacToe-Nakama game"
git branch -M main

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/TicTacToe-Nakama.git
git push -u origin main
```

### 2.2 Verify Repository Structure

Ensure your repository has:
```
TicTacToe-Nakama/
├── client/               (Next.js frontend)
├── server/               (Nakama backend)
├── app.yaml             (App Platform config - included)
└── README.md
```

---

## Step 3: Deploy with DigitalOcean App Platform

### 3.1 Create App via Dashboard

1. Go to **DigitalOcean Dashboard** → **Apps** (or **App Platform**)
2. Click **Create App**
3. **Select source:** GitHub
4. Authorize DigitalOcean with GitHub (first time only)
5. Select repository: `TicTacToe-Nakama`
6. Branch: `main`
7. Click **Next**

### 3.2 Configure Services

The `app.yaml` file in your repository will be auto-detected. If not:

**For Frontend:**
```
Name: frontend
Source: GitHub (client directory)
Build Command: npm run build
Run Command: npm run start
Port: 3000
```

**For Backend (Nakama):**
```
Name: nakama-api
Source: GitHub (server directory)
Build Command: npm run build && docker build .
Run Command: [via Dockerfile]
Port: 7350
```

### 3.3 Configure Environment Variables

**Frontend Environment Variables:**
```
NEXT_PUBLIC_SERVER_API=nakama-api.ondigitalocean.app
NEXT_PUBLIC_SERVER_PORT=443
NEXT_PUBLIC_USE_SSL=true
```

**Backend Environment Variables:**
```
DATABASE_HOST=your-db-cluster.db.ondigitalocean.com
DATABASE_PORT=25060
DATABASE_USER=doadmin
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=nakama
```

4. Click **Next**

### 3.4 Connect Database

1. In the **Resources** section, click **Connect a Database**
2. Select the PostgreSQL cluster you created
3. Choose database: `nakama`
4. Confirm connection
5. Click **Next**

### 3.5 Review and Deploy

1. Review the configuration
2. Give your app a name: `tictactoe-nakama`
3. Click **Create Resources**
4. **Wait for deployment** (5-15 minutes)

---

## Step 4: Access Your Deployed App

Once deployment completes:

1. **Frontend URL:** `https://frontend-your-app-id.ondigitalocean.app`
2. **Backend API:** `https://nakama-api-your-app-id.ondigitalocean.app:7350`
3. **Nakama Console:** `https://nakama-api-your-app-id.ondigitalocean.app:7351`
   - Username: `admin`
   - Password: `password` (change in production!)

### 4.1 Test the Deployment

```bash
# Test backend API
curl https://nakama-api-your-app-id.ondigitalocean.app:7350/

# Expected response: Nakama health check OK
```

---

## Step 5: Configure Custom Domain (Optional)

1. Go to App details → **Settings** → **App Domain**
2. Click **Edit Domain**
3. Add custom domain (e.g., `tictactoe.yourdomain.com`)
4. Update DNS records with DigitalOcean nameservers
5. SSL certificate auto-issued

---

## Troubleshooting

### Backend not connecting to database

**Error:** `database connection failed`

**Solutions:**
1. Verify database credentials in environment variables
2. Check database firewall settings (allow App Platform)
3. Ensure database cluster is in same region or has public access
4. Check logs: **App Details** → **Logs**

### Frontend cannot reach backend

**Error:** WebSocket connection refused

**Solutions:**
1. Verify `NEXT_PUBLIC_SERVER_API` matches backend URL
2. Ensure `NEXT_PUBLIC_USE_SSL=true` for HTTPS
3. Check CORS configuration in backend
4. Verify backend is running: `curl https://backend-url/`

### Database password issues

**Error:** `invalid user/password`

**Solutions:**
1. Copy password from Database details page (beware special characters)
2. Use DigitalOcean Dashboard → **Settings** to reset password
3. Update environment variables after password change

### Deploy fails with build errors

**Solutions:**
1. Check **Build Logs** in App Platform
2. Common issues:
   - Missing `package.json` dependencies
   - TypeScript compilation errors
   - Docker build issues
3. Run locally: `npm install && npm run build` to debug

### WebSocket issues

**Error:** WebSocket connection stuck or timing out

**Solutions:**
1. Ensure backend is using WSS (secure WebSocket)
2. Check firewall rules allow port 7350
3. Verify app logs for connection errors
4. Test with: `wscat -c wss://backend-url:7350`

---

## Monitoring and Logs

### View Application Logs

1. **App Platform** → App name → **Logs**
2. Filter by service (Frontend or Backend)
3. Real-time streaming of logs

### Monitor Database

1. **Databases** → Your cluster → **Logs**
2. Monitor connections, queries, and errors

### Set Up Alerts (Optional)

1. **Monitoring** → **Alerts**
2. Set thresholds for CPU, RAM, disk usage
3. Configure email or Slack notifications

---

## Maintenance

### Update Application

```bash
# Make changes locally
git add .
git commit -m "Update: new features"
git push origin main

# App Platform auto-deploys on push (if enabled)
```

### Database Backups

DigitalOcean Managed Database includes:
- **Daily automated backups** (retained for 7 days)
- **Point-in-time recovery**

To restore:
1. **Databases** → Cluster → **Backups**
2. Click **Restore from Backup**
3. Select backup date
4. Create new cluster from backup

### Update Nakama Version

1. Edit `server/Dockerfile`
2. Change base image: `FROM registry.heroiclabs.com/heroiclabs/nakama:3.18.0`
3. Push to GitHub
4. App Platform auto-redeploys

---

## Cost Estimation

**DigitalOcean (monthly):**
- App Platform (Starter - 2 containers): ~$12/month
- PostgreSQL 12 (Basic - 1 node): ~$15/month
- Data transfer: ~$0.01/GB (first 1TB free)
- **Total:** ~$27/month for development

**Upgrade to production (3-node database, larger containers): ~$50-100/month**

---

## Security Checklist

- [ ] Change Nakama console password (`admin`/`password`)
- [ ] Enable database firewall (restrict to App Platform only)
- [ ] Use HTTPS everywhere (DigitalOcean handles auto-renewal)
- [ ] Store secrets in environment variables (never in code)
- [ ] Enable database backups
- [ ] Monitor logs for suspicious activity
- [ ] Use strong database password (20+ characters)
- [ ] Enable 2FA on DigitalOcean account

---

## Rollback to Previous Version

1. **App Platform** → App → **Settings** → **Deployment history**
2. Find previous working deployment
3. Click **Rollback**
4. Confirm rollback
5. App redeploys from previous build

---

## Support & Resources

- **DigitalOcean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Nakama Docs:** https://heroiclabs.com/docs/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **DigitalOcean Community:** https://www.digitalocean.com/community/

---

## Next Steps

1. ✅ Create PostgreSQL database
2. ✅ Push code to GitHub
3. ✅ Deploy to DigitalOcean App Platform
4. ✅ Test connectivity
5. Configure custom domain (optional)
6. Set up monitoring
7. Configure backups
