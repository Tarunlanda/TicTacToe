# TicTacToe-Nakama: Vercel Frontend Deployment Guide

A complete step-by-step guide to deploy the TicTacToe-Nakama Next.js frontend to Vercel with your AWS-hosted Nakama backend.

---

## Table of Contents

1. [Why Vercel?](#why-vercel)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Variables](#environment-variables)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Cost & Performance](#cost--performance)

---

## Why Vercel?

**Vercel** is the ideal hosting platform for Next.js applications because:

- ✅ **Built by Vercel** (creators of Next.js) - Optimized for Next.js
- ✅ **Fast Global CDN** - Automatic worldwide distribution
- ✅ **Zero-Config Deployment** - Automatic builds and deploys
- ✅ **Free Tier** - Perfect for small projects (up to 6GB bandwidth)
- ✅ **Preview Deployments** - Test PRs before merging
- ✅ **Serverless Functions** - Scale automatically
- ✅ **Git Integration** - Auto-deploy on push
- ✅ **HTTPS Included** - Free SSL certificate
- ✅ **Analytics Dashboard** - Monitor performance
- ✅ **Easy Rollback** - Revert to any previous deployment

---

## Prerequisites

### 1. GitHub Account with Repository

Ensure your TicTacToe-Nakama repository is pushed to GitHub:

```bash
cd TicTacToe-Nakama

# Initialize if not already done
git init
git add .
git commit -m "Initial commit: TicTacToe-Nakama"
git branch -M main

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/TicTacToe-Nakama.git
git push -u origin main
```

### 2. Vercel Account (Free)

Create a free Vercel account:
- Go to: https://vercel.com/signup
- Click "Continue with GitHub"
- Authorize Vercel to access your GitHub account

### 3. AWS Backend Deployed

Your Nakama backend should be running on AWS. You need:
- **Backend IP Address** or **Domain Name**
- **Backend Port**: 7350 (default)
- **Protocol**: HTTP or HTTPS (depending on your SSL setup)

Example: `http://ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com:7350`

### 4. Project Structure

Verify your repository structure:

```
TicTacToe-Nakama/
├── client/                 ← Next.js frontend
│   ├── src/
│   ├── pages/
│   ├── components/
│   ├── package.json
│   ├── .env.example
│   └── tsconfig.json
├── server/                 ← Nakama backend (AWS)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── .git/
├── README.md
└── app.yaml
```

---

# STEP-BY-STEP DEPLOYMENT

## Step 1: Import Project to Vercel (2 minutes)

### 1.1: Go to Vercel Dashboard

1. Log in to https://vercel.com
2. Click **"Add New"** button in top-left
3. Select **"Project"**

### 1.2: Import GitHub Repository

1. In the **"Import Git Repository"** section, search for:
   ```
   TicTacToe-Nakama
   ```

2. Click the repository when it appears
3. Click **"Import"**

### Expected Result

Vercel shows your repository structure with:
- **Root Directory:** (auto-detected as root)
- **Framework Preset:** Next.js ✓ (auto-detected)
- **Build Output Directory:** `.next` ✓ (auto-detected)

---

## Step 2: Configure Project Settings (3 minutes)

### 2.1: Set Project Name

Change the default name (if desired):

```
Project Name: tictactoe-nakama
```

### 2.2: Set Root Directory

**IMPORTANT:** Set the root directory to the `client` folder:

1. Click **"Edit"** next to **"Root Directory"**
2. Select **`client`** from the dropdown
3. Click **"Continue"**

### 2.3: Configure Build Settings

Vercel auto-detects Next.js, but verify:

- **Framework:** Next.js ✓
- **Build Command:** `npm run build` or `pnpm build`
- **Output Directory:** `.next` ✓
- **Install Command:** `npm install` or `pnpm install`

#### If using pnpm (Recommended)

```bash
# In Vercel UI, set:
Build Command: pnpm install && pnpm run build
Install Command: pnpm install --frozen-lockfile
```

---

## Step 3: Add Environment Variables (5 minutes)

### 3.1: Access Environment Variables Section

After configuring build settings, you'll see the **"Environment Variables"** section.

### 3.2: Add Variables

Click **"Add Environment Variable"** and add the following:

#### Variable 1: Backend API Host

- **Name:** `NEXT_PUBLIC_SERVER_API`
- **Value:** Your AWS backend IP or domain
  ```
  ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
  ```
  (without `http://` or port)

#### Variable 2: Backend Port

- **Name:** `NEXT_PUBLIC_SERVER_PORT`
- **Value:** `7350` (Nakama HTTP/WebSocket port)

#### Variable 3: Use SSL

- **Name:** `NEXT_PUBLIC_USE_SSL`
- **Value:** `false` (or `true` if your backend has HTTPS)

### Example Environment Variables Configuration

```
NEXT_PUBLIC_SERVER_API = ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
NEXT_PUBLIC_SERVER_PORT = 7350
NEXT_PUBLIC_USE_SSL = false
```

### 3.3: Set Environment for Different Deployments

**Production Environment** (main branch):
```
NEXT_PUBLIC_SERVER_API = ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
NEXT_PUBLIC_SERVER_PORT = 7350
NEXT_PUBLIC_USE_SSL = false
```

**Preview Environment** (pull requests):
```
NEXT_PUBLIC_SERVER_API = ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
NEXT_PUBLIC_SERVER_PORT = 7350
NEXT_PUBLIC_USE_SSL = false
```

> **Note:** You can set different environments if you have a dev and prod backend

---

## Step 4: Deploy (2 minutes)

### 4.1: Click Deploy

Click the **"Deploy"** button at the bottom of the configuration page.

### Expected Output

```
✓ Preparing files...
✓ Building...
✓ Analyzing...
✓ Optimizing...
✓ Creating deployment...
✓ Finalizing...

Deployment complete!
```

### 4.2: Wait for Deployment

Vercel will:
1. Clone your repository
2. Install dependencies
3. Run build command
4. Optimize assets
5. Deploy to global CDN

⏱️ **Time:** 2-5 minutes for first deployment

### 4.3: Get Your Frontend URL

Once deployment completes, you'll see:

```
✓ Production
  https://tictactoe-nakama.vercel.app
```

Copy this URL - you'll need it for testing!

---

## Step 5: Verify Deployment (3 minutes)

### 5.1: Test Frontend

Open your frontend URL in browser:

```
https://tictactoe-nakama.vercel.app
```

You should see:
- ✅ Game UI loads
- ✅ Input field for player name
- ✅ No errors in browser console

### 5.2: Check Browser Console for Errors

Press **F12** to open Developer Tools:
- Go to **Console** tab
- Check for red error messages
- Look for connection errors to backend

### 5.3: Test Backend Connection

In the game:

1. Enter your player name
2. Click "Join Game"
3. Check if it connects to your backend

**Success indicators:**
- ✅ "Waiting for opponent..." message appears
- ✅ No "Cannot connect to server" error
- ✅ Network tab shows WebSocket connection to backend

### 5.4: Test in Multiple Browsers

1. Open the frontend URL in Browser 1
2. Open in a different browser (or incognito window)
3. Both should connect to the same game

---

## Step 6: Configure Auto-Deployments (2 minutes)

### 6.1: Automatic Deployments from GitHub

Vercel automatically deploys when you:

- **Push to `main` branch** → Production deployment
- **Create a Pull Request** → Preview deployment
- **Push to any branch** → Preview deployment

### 6.2: Trigger Manual Deployment

From Vercel Dashboard:

1. Go to your project: https://vercel.com/dashboard
2. Select **"tictactoe-nakama"**
3. Click **"Deployments"** tab
4. Click **"Redeploy"** button next to any deployment



## Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/dashboard/project/tictactoe-nakama/settings
- **Deployments:** https://vercel.com/dashboard/project/tictactoe-nakama/deployments
- **Domains:** https://vercel.com/dashboard/project/tictactoe-nakama/settings/domains
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **GitHub Integration:** https://github.com/vercel/next.js/wiki

---

## Support & Resources

- **Vercel Support:** https://vercel.com/support
- **Vercel Community:** https://github.com/vercel/discussions
- **Next.js Discord:** https://discord.gg/nextjs
- **Stack Overflow:** Tag `vercel` or `next.js`

---

# Integration with AWS Backend

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Global CDN (Vercel)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (TicTacToe Game UI)               │   │
│  │  - Deployed on Vercel Serverless Functions         │   │
│  │  - Auto-scaled globally                            │   │
│  │  - Free HTTPS/SSL                                  │   │
│  │  URL: https://tictactoe-nakama.vercel.app         │   │
│  └──────────────────────────────┬───────────────────────┘   │
│                                 │                             │
│                                 │ WebSocket Connection       │
│                                 │ (NEXT_PUBLIC_SERVER_*)    │
│                                 ▼                             │
│          ┌─────────────────────────────────────┐             │
│          │                                       │             │
└──────────┼───────────────────────────────────────┼─────────────
           │                                       │
           ▼                                       ▼
  ┌─────────────────────┐              ┌──────────────────────┐
  │   AWS EC2           │              │  AWS RDS PostgreSQL  │
  │  (Nakama Backend)   │◄────────────►│  (Game Database)     │
  │  Port: 7350         │              │  Port: 5432          │
  │  IP: X.X.X.X        │              │  Data: Game state    │
  └─────────────────────┘              └──────────────────────┘
        (gRPC on 7349)
```

## Environment Variables Summary

```bash
# Frontend (Vercel)
NEXT_PUBLIC_SERVER_API=ec2-xxx.amazonaws.com
NEXT_PUBLIC_SERVER_PORT=7350
NEXT_PUBLIC_USE_SSL=false

# Backend (AWS EC2 - not needed for Vercel)
DATABASE_HOST=rds-xxx.amazonaws.com
DATABASE_USER=nakama
DATABASE_PASSWORD=YourPassword
DATABASE_NAME=nakama
```

---

**Last Updated:** 2026-03-29

**Version:** 1.0

**Maintainer:** TicTacToe-Nakama Team
