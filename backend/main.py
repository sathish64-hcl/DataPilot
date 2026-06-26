from common import app
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from runtime_paths import resource_root

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
from routes_incident_command import router as incident_command_router
from routes_table_apps import router as table_apps_router
from routes_ai import router as ai_router

app.include_router(ai_router)
app.include_router(connection_router)
app.include_router(chat_router)
app.include_router(metadata_router)
app.include_router(governance_router)
app.include_router(cost_router)
app.include_router(lineage_router)
app.include_router(quality_router)
app.include_router(rag_router)
app.include_router(incidents_router)
app.include_router(incident_command_router)
app.include_router(table_apps_router)


FRONTEND_DIST = resource_root() / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    for public_file in ("favicon.svg", "icons.svg", "vite.svg"):
        file_path = FRONTEND_DIST / public_file
        if file_path.exists():
            async def serve_public(path=file_path):
                return FileResponse(path)
            app.add_api_route(f"/{public_file}", serve_public, methods=["GET"], include_in_schema=False)

    @app.get("/", include_in_schema=False)
    async def serve_frontend_index():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_app(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = FRONTEND_DIST / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
