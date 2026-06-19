from common import app

# ── Register all application route modules ───────────────────────────────────
from routes_connection import router as connection_router
from routes_chat import router as chat_router
from routes_metadata import router as metadata_router
from routes_governance import router as governance_router
from routes_cost import router as cost_router
from routes_lineage import router as lineage_router
from routes_quality import router as quality_router
from routes_rag import router as rag_router
from routes_incidents import router as incidents_router

app.include_router(connection_router)
app.include_router(chat_router)
app.include_router(metadata_router)
app.include_router(governance_router)
app.include_router(cost_router)
app.include_router(lineage_router)
app.include_router(quality_router)
app.include_router(rag_router)
app.include_router(incidents_router)
