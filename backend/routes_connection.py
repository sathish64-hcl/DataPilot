from fastapi import APIRouter, HTTPException
from common import db, ConnectionConfig, UseSessionRequest
from typing import Optional

router = APIRouter()

@router.post("/api/connection/test")
async def test_connection(config: ConnectionConfig):
    # Determine platform
    platform = config.platform
    if config.use_mock and platform == "SNOWFLAKE":
        platform = "MOCK"
        
    db.active_platform = platform
    
    if platform == "MOCK":
        db.use_mock = True
        return {"success": True, "message": "Using Data Pilot Studio Mock Database Mode.", "mode": "MOCK"}
    
    if platform == "SNOWFLAKE":
        db.set_snowflake_config(
            account=config.account or "",
            user=config.user or "",
            password=config.password,
            role=config.role,
            warehouse=config.warehouse,
            database=config.database,
            schema=config.schema_name,
            use_sso=config.use_sso,
            token=config.token,
            auth_method=config.auth_method
        )
        success, msg = db.connect_snowflake()
        
    elif platform == "REDSHIFT":
        db.set_redshift_config(
            host=config.host or "",
            port=config.port or 5439,
            database=config.database or "",
            user=config.user or "",
            password=config.password or ""
        )
        success, msg = db.connect_redshift()
        
    elif platform == "POSTGRESQL":
        db.set_postgresql_config(
            host=config.host or "",
            port=config.port or 5432,
            database=config.database or "",
            user=config.user or "",
            password=config.password or ""
        )
        success, msg = db.connect_postgresql()
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported database platform: {platform}")
        
    if success:
        return {"success": True, "message": msg, "mode": platform}
    return {"success": False, "message": msg, "mode": platform}

@router.post("/api/connection/use")
async def use_session(req: UseSessionRequest):
    success, msg = db.update_snowflake_session(
        role=req.role,
        warehouse=req.warehouse,
        database=req.database,
        schema=req.schema_name
    )
    if success:
        return {"success": True, "message": msg}
    else:
        raise HTTPException(status_code=400, detail=msg)

@router.get("/api/databases")
async def get_databases():
    dbs = db.get_databases()
    return {"databases": dbs}

@router.get("/api/schemas")
async def get_schemas(database: str):
    sch = db.get_schemas(database)
    return {"schemas": sch}

@router.get("/api/tables")
async def get_tables(database: str, schema: str, table_type: str = "ALL"):
    tbl = db.get_tables(database, schema, table_type)
    return {"tables": tbl}

@router.get("/api/roles")
async def get_roles():
    return {"roles": db.get_roles()}

@router.get("/api/warehouses")
async def get_warehouses():
    return {"warehouses": db.get_warehouses()}
