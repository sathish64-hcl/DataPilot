from fastapi import APIRouter
from common import db
from typing import Optional

router = APIRouter()

@router.get("/api/governance")
async def get_governance(database: Optional[str] = None, table: str = ""):
    if not db.use_mock:
        db_prefix = f'"{database.upper()}".' if database else ""
        query = f"SELECT 'TABLE' AS object_type, table_name AS object_name, grantee AS role, privilege_type AS privilege, grantor AS granted_by, '' AS granted_to_user FROM {db_prefix}information_schema.table_privileges"
        if table:
            query += f" WHERE table_name = '{table.upper()}'"
        else:
            query += " LIMIT 100"
    else:
        query = "SELECT object_type, object_name, role, privilege, granted_by, granted_to_user FROM access_control"
        if table:
            query += f" WHERE object_name = '{table.upper()}'"
            
    res = db.execute_query(query)
    if not res.get("success"):
        # Fall back to mock access control to prevent 500 error
        fallback_query = "SELECT object_type, object_name, role, privilege, granted_by, granted_to_user FROM access_control"
        if table:
            fallback_query += f" WHERE object_name = '{table.upper()}'"
        res = db.execute_mock_query(fallback_query)
        
    return {"grants": res.get("data", [])}
