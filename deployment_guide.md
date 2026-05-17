# 🚀 Professional Deployment Guide: AI Interview System

This guide provides step-by-step instructions for deploying your high-performance, AI-powered mock interview system to production for free!

---

## 🏗️ Deployment Architecture

Your project is composed of three primary components:
1. **Database & Auth (Supabase)**: Already hosted on the cloud. No server setup is needed!
2. **Backend Server (Node.js/Express)**: Host on **Render** or **Railway** (free tiers available).
3. **Frontend Client (HTML/CSS/JS)**: Host on **Vercel** or **Netlify** (super-fast global static CDN, 100% free).

---

## 📦 Step 1: Push Your Project to GitHub

Before deploying, upload your code to GitHub.
1. Create a free account on [GitHub](https://github.com).
2. Install [Git](https://git-scm.com) on your system.
3. Open your terminal in the `ai web` folder and run:
   ```bash
   git init
   git add .
   git commit -m "feat: complete production-ready AI interview platform"
   ```
4. Create a new repository on GitHub (name it `ai-interview-platform` and keep it private or public).
5. Link your local project to GitHub and push your code:
   ```bash
   git remote add origin https://github.com/your-username/ai-interview-platform.git
   git branch -M main
   git push -u origin main
   ```

---

## 🎛️ Step 2: Deploy the Backend to Render

[Render](https://render.com) is the easiest platform to deploy Node.js servers for free.

1. Sign up on [Render.com](https://render.com) (you can log in using GitHub).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`ai-interview-platform`).
4. Configure the Web Service settings:
   * **Name**: `ai-interview-backend`
   * **Region**: Select the closest region to you.
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
   * **Instance Type**: `Free`
5. Click **Advanced** and add your production **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `GROQ_API_KEY` | `gsk_...` | Your Groq API cloud key |
   | `SUPABASE_URL` | `https://...supabase.co` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | `sb_...` | Your service role key for database security |
6. Click **Deploy Web Service**.
7. Once deployed, Render will provide you with a production live URL (e.g., `https://ai-interview-backend.onrender.com`). **Copy this URL!**

---

## 🌐 Step 3: Link Your Frontend to Your Production Backend

Currently, your frontend files query `http://localhost:8888` for API calls. We need to point them to your live Render URL.

1. Open VS Code in your `ai web` workspace.
2. In the following files, find the constant `const BACKEND = 'http://localhost:8888';` (typically near the top of `<script>` tags) and update it to your new live backend URL:
   * `interview-room.html`
   * `training.html`
   * `communication.html`
   * `topic-practice.html`
   
   *Example:*
   ```javascript
   const BACKEND = 'https://ai-interview-backend.onrender.com';
   ```
3. Commit and push these updates to GitHub:
   ```bash
   git add .
   git commit -m "config: point frontend to production backend"
   git push origin main
   ```

---

## ⚡ Step 4: Deploy the Frontend to Vercel

[Vercel](https://vercel.com) provides lightning-fast global hosting for static frontend files.

1. Sign up on [Vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New** and select **Project**.
3. Import your GitHub repository (`ai-interview-platform`).
4. In the configuration settings:
   * **Framework Preset**: Select `Other` (since this is standard Vanilla HTML/CSS/JS).
   * **Root Directory**: `./` (default)
5. Click **Deploy**!
6. Within 15 seconds, Vercel will build and launch your application globally! It will give you a beautiful domain link (e.g., `https://ai-interview-platform.vercel.app`).

---

## 🔑 Step 5: Configure Supabase Redirects (Crucial for OAuth)

If you are using Google Login (OAuth), you must update your Supabase settings to allow redirects to your new live Vercel domain.

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** -> **URL Configuration**.
3. Under **Redirect URLs**, add your new live Vercel URL:
   `https://ai-interview-platform.vercel.app/home.html`
4. Click **Save**.

---

🎉 **Congratulations! Your enterprise-grade Mock Interview Platform is now globally deployed and live for anyone to use!**
