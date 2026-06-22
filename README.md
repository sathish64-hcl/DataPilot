# DataPilot

DataPilot is a local FastAPI + React studio for exploring Snowflake data with:

- AI chat over selected database/schema/table context
- SQL explanation and optimization
- Metadata extraction and data dictionary generation
- Governance, cost, lineage, quality, RAG, and incident views

## Prerequisites

- Python 3.10+ or Anaconda Python
- Node.js 20+
- Access to the configured Snowflake account

## Install

Backend:

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe -m pip install -r requirements.txt
```

Frontend:

```powershell
cd frontend
npm install
```

## Run

From the project root, double-click or run:

```powershell
.\run_studio.bat
```

Or run the services manually in separate terminals:

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown by the frontend, usually `http://localhost:5173`.

## Verify

```powershell
cd frontend
npm run lint
npm run build
```

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe -m compileall .
```

The backend attempts to connect to Snowflake on startup. If Snowflake is unreachable, it falls back to the bundled SQLite mock database so the UI remains usable.
