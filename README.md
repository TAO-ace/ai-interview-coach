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
