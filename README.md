# Data Pilot Studio

Data Pilot Studio is a local FastAPI + React application for exploring, profiling, and analyzing Snowflake data with optional LLM assistance.

It is designed as an **LLM-agnostic AI data platform copilot**: the same application can run in native Python/Snowflake mode, AI-assisted mode, or side-by-side Compare mode.

## Highlights

- Snowflake connection and shared role / warehouse session context
- AI Analyst Studio with chat, Ask Dataset, and natural-language report builder
- Native vs AI Compare mode with generated SQL, result preview, explanation, and recommendation summary
- SQL Explainer and Performance Tuning with cost-aware query advisor
- Table Intelligence Studio with metadata, profiling, volume analysis, DDL, quick queries, and insight generation
- Column / Table Search with separate table and column results
- Anomaly Detector with statistical scans, plots, and custom executable rules
- Data Freshness checks using user-selected date fields
- Snowflake Cost Analyzer
- Snowflake-backed Incident Command Center using `KAGGLE.INCIDENT_MGMT`
- Document Hub for RAG-style Q&A over web pages, pasted content, and files
- Persistent Query Log
- Persistent Execution Footprint with accumulated LLM prompts, tokens, estimated cost, and recent usage events

## Execution Modes

Data Pilot Studio supports three execution modes from the left sidebar.

| Mode | Behavior |
| --- | --- |
| Native | Uses Python rules, metadata queries, and Snowflake SQL. No LLM calls. |
| AI | Uses the configured AI provider for supported generation, explanation, summarization, and recommendations. |
| Compare | Runs native and AI pipelines side by side so users can compare SQL, results, explanations, timing, and business fit. |

AI is optional and disabled unless configured. Native mode remains available even without an API key.

## AI Providers

The AI configuration layer is provider-agnostic and currently supports:

- OpenAI
- Azure OpenAI
- Anthropic Claude
- Google Gemini
- Snowflake Cortex
- Ollama
- Custom OpenAI-compatible endpoints

The API key field expects a provider API key. It is not the same thing as a Codex login session. The Base URL field is optional and is mainly for enterprise or custom-compatible endpoints.

## Main Applications

### AI Analyst Studio

Use natural language to work with selected Snowflake tables.

- Chat with selected DB / schema / table
- Ask Dataset: generate SQL, execute it, show chart and explanation
- Report Builder: create visual reports from natural language
- Compare mode: Native vs AI result dashboard

### SQL Explainer / Tuning

Paste SQL and click **Analyze & Optimize SQL** to get:

- SQL explanation
- Cost-aware query advice
- Optimization suggestions
- Optimized SQL with copy and execute actions

### Table Intelligence Studio

Select a table or view and inspect it through:

- Overview
- Table Details
- Table Profiler
- Volume Analyzer
- Insight Generator
- Generated DDL
- Quick Queries

Volume Analyzer lets the user choose the date field and whether the data behaves like batch or event data.

### Column / Table Search

Search table and column names separately.

- Filter column results by data type
- Narrow column results by table keyword
- Generate SELECT statements for matching tables

### Anomaly Detector

Run anomaly checks on selected columns.

- Numeric outliers
- Date/time volume spikes and drops
- Rare text values
- Custom business rules with generated SQL and executable previews

### Data Freshness

Select DB, schema, optional table, and date field to calculate freshness.

The app shows:

- Fresh / warning / stale status
- Age hours
- Latest rows
- Previous rows
- Trend chart

### Cost Analyzer

Analyze Snowflake cost and query activity.

- Daily credit trends
- Warehouse cost
- User cost
- Expensive query scatter
- Optimization recommendations

### Incident Command Center

A Snowflake-backed enterprise incident management demo.

Expected Snowflake location:

```text
KAGGLE.INCIDENT_MGMT
```

Expected tables:

- `APPLICATIONS`
- `EMPLOYEES`
- `CHANGE_REQUESTS`
- `INCIDENTS`

The app reads from Snowflake and no longer exposes a UI button to load demo data. A one-off admin loader remains available at:

```text
backend/load_incident_snowflake.py
```

### Document Hub

Ingest and ask questions over unstructured or semi-structured sources.

Supported source patterns include:

- Web page URL
- Pasted text
- JSON / CSV-style content
- File content
- Batch ingest
- Crawl depth for child pages

Source snippets are available for verification and can be expanded when needed.

### Query Log

Persists executed SQL so users can review and rerun previous queries.

### Execution Footprint

Shows which applications use native logic and which use optional LLM calls.

Tracks cumulative usage until the user resets it:

- Prompt count
- Prompt tokens
- Completion tokens
- Total tokens
- Estimated API cost
- Average response time
- Recent usage events

On Windows, persistent runtime files are stored under:

```text
C:\Users\<user>\AppData\Local\DataPilotStudio
```

Examples:

- `ai_usage.json`
- `query_log.jsonl`
- `data_pilot_mock.db`

You can override this location with:

```powershell
$env:DATA_PILOT_DATA_DIR = "C:\path\to\data"
```

## Prerequisites

- Windows, macOS, or Linux for source mode
- Python 3.10+ or Anaconda Python
- Node.js 20+
- Snowflake account access
- Optional provider API key for AI or Compare mode

## Install From Source

Install backend dependencies:

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe -m pip install -r requirements.txt
```

Install frontend dependencies:

```powershell
cd frontend
npm install
```

## Run From Source

From the project root, run:

```powershell
.\run_studio.bat
```

Or run backend and frontend manually in separate terminals.

Backend:

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown by the frontend, commonly:

```text
http://127.0.0.1:5175/
```

The backend API runs on:

```text
http://127.0.0.1:8000/
```

## Snowflake Setup

Connect from the app sidebar using your Snowflake account details.

Recommended demo context:

```text
Database: KAGGLE
Schema: INCIDENT_MGMT
Table: INCIDENTS
Date field: CREATED_DATE
```

The Incident Command Center expects incident demo tables to already exist in Snowflake. If the tables must be loaded again, run the admin loader from the backend environment:

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe load_incident_snowflake.py
```

## Verify

Frontend build:

```powershell
cd frontend
npm run build
```

Backend compile:

```powershell
cd backend
C:\Users\mvmen\anaconda3\python.exe -m compileall .
```

Useful API checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/ai/usage
Invoke-RestMethod http://127.0.0.1:8000/api/incident-command/status
Invoke-RestMethod http://127.0.0.1:8000/api/incident-command/dashboard
```

## Portable Windows Build

If a target laptop cannot run `pip install` or `npm install`, build the portable executable on a Windows machine where installs are allowed:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_windows_portable.ps1
```

Copy this generated folder to the target laptop:

```text
dist\DataPilotStudio
```

Run:

```text
dist\DataPilotStudio\DataPilotStudio.exe
```

Then open:

```text
http://127.0.0.1:8000/
```

The portable app does not require Python packages or Node packages on the target laptop.

## Demo Walkthrough

A recording-ready 5 to 6 minute product demo script is included:

```text
DEMO_WALKTHROUGH.md
```

It includes:

- Complete application review
- Recommended demo sequence
- Click-by-click navigation
- Business questions
- Recording checklist
- Full voice-over script
- Timing plan
- Hackathon presentation tips

## Development Notes

- Backend: FastAPI in `backend/`
- Frontend: React + Vite in `frontend/`
- Shared runtime paths: `backend/runtime_paths.py`
- AI abstraction: `backend/llm.py`
- Snowflake/database access: `backend/database.py`
- Incident app routes: `backend/routes_incident_command.py`
- Table intelligence routes: `backend/routes_table_apps.py`
- RAG routes: `backend/routes_rag.py`

## GitHub Branch

Current working branch used for this project:

```text
Code_base
```
