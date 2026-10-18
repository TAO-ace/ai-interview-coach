# AI Interview Coach

An AI-powered technical interview simulator. Type a topic, pick a difficulty, and get interviewed by an AI one question at a time. Receive a scored report with Pass/Fail at the end.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript |
| Backend | Python FastAPI |
| AI | Groq — `llama-3.3-70b-versatile` |
| Deployment | Vercel (frontend) · Render (backend) |

## Project Structure

```
ai-interview-coach/
├── frontend/          # Next.js TypeScript app
├── backend/           # Python FastAPI app
├── .env.example       # Template — copy to backend/.env and fill in values
├── .gitignore
└── README.md
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env   # then add your real GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:8000  
API docs: http://localhost:8000/docs

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `GROQ_API_KEY` | `backend/.env` | Your Groq API key (never commit) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend URL (default: `http://localhost:8000`) |
| `ALLOWED_ORIGINS` | `backend/.env` | Comma-separated allowed frontend origins |

## Deployment

### 1. Backend (Render)

1. Go to [dashboard.render.com](https://dashboard.render.com) -> **New +** -> **Web Service**.
2. Select your GitHub repository: `ai-interview-coach`.
3. Configure the service:
   - **Name**: `ai-interview-coach-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: Your real Groq API key
   - `ALLOWED_ORIGINS`: `http://localhost:3000` (update with your Vercel URL once deployed)
5. Click **Deploy Web Service** and note your public Render URL (e.g. `https://ai-interview-coach-backend.onrender.com`).

### 2. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) -> **Add New...** -> **Project**.
2. Import your GitHub repository: `ai-interview-coach`.
3. In the project configuration:
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Framework Preset**: `Next.js` (automatically detected).
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g. `https://ai-interview-coach-backend.onrender.com`).
5. Click **Deploy**.
6. Once deployed, copy your Vercel domain and add it to the `ALLOWED_ORIGINS` on Render if you want strict origin validation.
