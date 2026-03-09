# SIF TPA Dashboard

UCLA Anderson Student Investment Fund — Total Portfolio Approach Dashboard.

Live data updates every week via PDF upload. No code changes needed.

---

## Deploy in 5 Steps

### 1. Create GitHub repo
- Go to github.com → New repository
- Name it `sif-dashboard`, set to Public
- Don't initialize with README

### 2. Push this code
```bash
cd sif-dashboard
git init
git add .
git commit -m "Initial SIF TPA Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sif-dashboard.git
git push -u origin main
```

### 3. Connect to Vercel
- Go to vercel.com → New Project
- Import your `sif-dashboard` GitHub repo
- Click Deploy (default settings work)

### 4. Add environment variables in Vercel
Go to: Project → Settings → Environment Variables

Add these two:
```
UPLOAD_SECRET    →  choose any secret password (e.g. "sif-aarya-2026")
KV_REST_API_URL  →  (from step 5)
KV_REST_API_TOKEN →  (from step 5)
```

### 5. Set up Vercel KV (free database)
- In Vercel dashboard → Storage → Create KV Database
- Name it `sif-data`
- Click "Connect to Project" → it auto-fills the KV env vars above

### 6. Redeploy
- Go to Vercel → Deployments → Redeploy latest

Your dashboard is now live at `https://sif-dashboard.vercel.app` 🎉

---

## Weekly Update Workflow (takes 30 seconds)

1. Go to `https://your-app.vercel.app/upload`
2. Enter your `UPLOAD_SECRET` password
3. Drop in the new weekly PDF
4. Click Upload — dashboard auto-refreshes with new data

---

## Project Structure

```
sif-dashboard/
├── api/
│   ├── upload.js      # PDF upload endpoint (auth protected)
│   └── data.js        # Serves latest data to dashboard
├── public/
│   ├── index.html     # Main dashboard
│   └── upload.html    # Upload UI (password protected)
├── vercel.json        # Routing config
└── package.json
```

---

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS + Chart.js
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Vercel KV (Redis)
- **PDF Parsing**: pdf-parse
- **Hosting**: Vercel (free tier)
- **Cost**: $0
