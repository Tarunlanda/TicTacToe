# Quick Start - DigitalOcean Deployment

Deploy TicTacToe-Nakama to DigitalOcean in 15 minutes.

---

## Prerequisites

- ✅ DigitalOcean account (free $200 credit for new users)
- ✅ GitHub account with repository
- ✅ Git installed locally

---

## 5-Step Deployment

### Step 1: Create PostgreSQL Database (2 min)

1. Log in to **DigitalOcean Dashboard**
2. Click **Databases** → **Create Database Cluster**
3. Select:
   - **Engine:** PostgreSQL
   - **Version:** 12
   - **Cluster size:** Basic (1 node)
   - **Region:** Closest to you
4. Click **Create**
5. **Wait 5-10 minutes** for database to be ready
6. Copy connection details (you'll need them):
   ```
   Host: db-xxx.db.ondigitalocean.com
   Port: 25060
   User: doadmin
   Password: xxxxxxxxx
   Database: nakama
   ```

---

### Step 2: Push Code to GitHub (2 min)

```bash
cd TicTacToe-Nakama

# Initialize Git
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Push to GitHub (create repo first at github.com/new)
git remote add origin https://github.com/YOUR_USERNAME/TicTacToe-Nakama.git
git push -u origin main
```

---

### Step 3: Deploy to DigitalOcean App Platform (3 min)

1. In DigitalOcean Dashboard → **Apps** → **Create App**
2. **Source:** GitHub → Select `TicTacToe-Nakama` repository
3. **Branch:** main
4. Click **Next**

**App Platform will auto-detect `app.yaml` configuration**

5. If not auto-detected, manually add services:

   **Service 1: Frontend**
   - Name: `frontend`
   - Source directory: `client`
   - Build: `npm run build`
   - Start: `npm run start`
   - Port: 3000

   **Service 2: Backend**
   - Name: `nakama-api`
   - Source directory: `server`
   - Build: `docker build .`
   - Port: 7350

6. Click **Next**

---

### Step 4: Configure Environment Variables (2 min)

**Frontend (frontend service):**
```
NEXT_PUBLIC_SERVER_API=nakama-api.ondigitalocean.app
NEXT_PUBLIC_SERVER_PORT=443
NEXT_PUBLIC_USE_SSL=true
```

**Backend (nakama-api service):**
```
DATABASE_HOST=db-xxx.db.ondigitalocean.com
DATABASE_PORT=25060
DATABASE_USER=doadmin
DATABASE_PASSWORD=your_password_from_step1
DATABASE_NAME=nakama
```

Click **Next**

---

### Step 5: Connect Database & Deploy (2 min)

1. **Resources** section → Click **Connect a Database**
2. Select PostgreSQL cluster from Step 1
3. Click **Create Resources**
4. **Wait 10-15 minutes** for deployment

---

## ✅ Success!

Once deployment completes, you'll have:

- **Frontend URL:** `https://frontend-xxxxx.ondigitalocean.app`
- **Backend URL:** `https://nakama-api-xxxxx.ondigitalocean.app:7350`

### Test it:

```bash
# Test frontend
open https://frontend-xxxxx.ondigitalocean.app

# Test backend
curl https://nakama-api-xxxxx.ondigitalocean.app:7350/
```

---

## 🎮 Play the Game

1. Open frontend URL in browser
2. Enter your nickname
3. Wait for opponent (or open in another browser window)
4. Play Tic-Tac-Toe!

---

## Next Steps

- [ ] Update `NEXT_PUBLIC_SERVER_API` in frontend service if using custom domain
- [ ] Change Nakama console password (admin/password)
- [ ] Set up monitoring alerts
- [ ] Configure custom domain (optional)

---

## Troubleshooting

**Frontend shows "Cannot connect to server"?**
- Check backend deployment completed successfully
- Verify `NEXT_PUBLIC_SERVER_API` matches your backend URL
- Check browser console (F12) for errors

**Backend not starting?**
- Check deployment logs: Apps → nakama-api → Logs
- Verify database variables are correct
- Ensure database is in "Available" state

**Game moves not working?**
- Refresh browser
- Open browser console (F12) for errors
- Check if WebSocket connection succeeded

---

## Cost (Monthly)

- **App Platform (2 containers):** ~$12
- **PostgreSQL 12 (1 node):** ~$15
- **Total:** ~$27/month
- **Free tier:** $200 credit for new users

---

## Support

- **Docs:** [digitalocean.com/docs](https://docs.digitalocean.com/)
- **Help:** Dashboard → Support → Create Ticket
- **Community:** [digitalocean.com/community](https://www.digitalocean.com/community/)

---

## Full Documentation

For advanced configuration, see:
- `DEPLOYMENT.md` - Detailed step-by-step guide
- `ARCHITECTURE.md` - System architecture & data flow
- `TROUBLESHOOTING.md` - Common issues & solutions
