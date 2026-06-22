from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import DatabaseManager
from llm import AI_Engine
from pydantic import BaseModel
from typing import Optional, List, Union

# ── FastAPI App Instance ─────────────────────────────────────────────────────
app = FastAPI(title="Data Pilot Studio API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared Singleton Instances ───────────────────────────────────────────────
db = DatabaseManager()
ai = AI_Engine()

# ── Pydantic Request Models ─────────────────────────────────────────────────

class ConnectionConfig(BaseModel):
    platform: Optional[str] = "SNOWFLAKE"
    account: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    warehouse: Optional[str] = None
    database: Optional[str] = None
    schema_name: Optional[str] = None
    use_sso: bool = False
    use_mock: bool = True
    auth_method: Optional[str] = "PASSWORD"
    token: Optional[str] = None
    host: Optional[str] = None
    port: Optional[Union[int, str]] = None

class ChatRequest(BaseModel):
    message: str
    database: Optional[str] = None
    schema_name: Optional[str] = None
    table_name: Optional[str] = None

class SQLRequest(BaseModel):
    sql: str
    limit: Optional[int] = 100

class SchemaRequest(BaseModel):
    table_name: str
    columns: List[str]

class IngestFeedRequest(BaseModel):
    url: str
    source_name: Optional[str] = "Website"

class IngestSourceRequest(BaseModel):
    source_type: str
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    format: Optional[str] = "auto"
    crawl_depth: Optional[int] = 0
    max_pages: Optional[int] = 10

class UseSessionRequest(BaseModel):
    role: Optional[str] = None
    warehouse: Optional[str] = None
    database: Optional[str] = None
    schema_name: Optional[str] = None
