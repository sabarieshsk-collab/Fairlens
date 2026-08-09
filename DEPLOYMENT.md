# FairLens Cloud Deployment & Local Setup Guide

This guide provides step-by-step instructions to deploy FairLens with a working Frontend and Backend on Cloud platforms (Render for Backend, Vercel/Netlify for Frontend) as well as running locally.

---

## Architecture Overview

```
 ┌────────────────────────┐         ┌────────────────────────┐
 │   Frontend (React/Vite)│ ──────> │  Backend (Node/Express)│
 │ Deployed on Vercel/    │  HTTPS  │  Deployed on Render    │
 │ Netlify / Firebase     │         │                        │
 └────────────────────────┘         └───────────┬────────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │     MongoDB Atlas      │
                                    │    Cloud Database      │
                                    └────────────────────────┘
```

---

## 🚀 Option 1: Full Cloud Deployment (Recommended)

### Step 1: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Fairlens`).
3. Configure the following settings:
   - **Name**: `fairlens-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add **Environment Variables** under the Environment tab:
   - `PORT`: `5000`
   - `MONGODB_URI`: `mongodb+srv://spidysabo_db_user:Sabariesh%402007@sabariesh.t3z4yyy.mongodb.net/fairlens?appName=SABARIESH`
   - `JWT_SECRET`: `fairlens-super-secret-jwt-key-change-in-production-2026`
   - `FIREBASE_PROJECT_ID`: `fairlens-36622`
   - `GEMINI_API_KEY`: `AIzaSyCYOh5Tadt3Bj15rRkzcK2YiEMtx_Lde_s`
5. Click **Create Web Service**. Render will deploy your backend API (e.g. `https://fairlens-backend.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Import your GitHub repository (`Fairlens`).
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://fairlens-backend.onrender.com` (Your Render backend URL)
   - `VITE_FIREBASE_API_KEY`: `AIzaSyCjlg9OrfgxH-8IYqEFaoPSfSxzxBk72Wo`
   - `VITE_FIREBASE_AUTH_DOMAIN`: `fairlens-36622.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `fairlens-36622`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `fairlens-36622.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `110531577383`
   - `VITE_FIREBASE_APP_ID`: `1:110531577383:web:2bfaf403568ef7e1f17002`
   - `VITE_GEMINI_API_KEY`: `AIzaSyCYOh5Tadt3Bj15rRkzcK2YiEMtx_Lde_s`
5. Click **Deploy**. Vercel will build and provide a live production URL (e.g. `https://fairlens.vercel.app`).

---

### Step 3: Verify Deployment Health

Check backend health endpoint:
```bash
curl https://fairlens-backend.onrender.com/api/health
```
Response:
```json
{
  "status": "ok",
  "database": "connected",
  "server": "FairLens Render Backend"
}
```

---

## 💻 Option 2: Run Full Application Locally

You can also run both frontend and backend on your local machine simultaneously:

```bash
# In project root:
npm install
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
