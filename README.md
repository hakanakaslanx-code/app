# Project Setup

This repo has a React frontend and a FastAPI backend. If you see an Apache “Not Found” at `http://localhost:8080`, that means Apache is running on your machine, not this app. Use the ports below instead.

## Frontend (React)

```bash
cd frontend
npm install
npm start
```

Open: `http://localhost:3000`

## Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

API base URL: `http://localhost:8000/api`

## Common Issues

- If you are opening `http://localhost:8080` and getting “Not Found,” that is Apache, not this app. Use `http://localhost:3000` for the UI and `http://localhost:8000/api` for the API instead.
