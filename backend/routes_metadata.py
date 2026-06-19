from fastapi import APIRouter
from common import db, ai, SchemaRequest
from typing import Optional

router = APIRouter()

@router.get("/api/metadata")
async def get_metadata(database: Optional[str] = None, schema: Optional[str] = None, search: str = ""):
    # Build query depending on active engine
    if db.active_platform == "SNOWFLAKE" and not db.use_mock:
        db_prefix = f'"{database.upper()}".' if database else ""
        query = f"SELECT table_schema, table_name, row_count, bytes, table_owner AS owner, comment AS description FROM {db_prefix}information_schema.tables"
        filters = []
        if schema:
            filters.append(f"table_schema = '{schema.upper()}'")
        if search:
            filters.append(f"(table_name LIKE '%{search.upper()}%' OR comment LIKE '%{search}%')")
        if filters:
            query += " WHERE " + " AND ".join(filters)
        
        columns_query = f"SELECT table_name, column_name, data_type, is_nullable, comment AS description, '—' AS data_owner FROM {db_prefix}information_schema.columns"
        if schema:
            columns_query += f" WHERE table_schema = '{schema.upper()}'"
    elif (db.active_platform == "REDSHIFT" or db.active_platform == "POSTGRESQL") and not db.use_mock:
        query = "SELECT table_schema, table_name, 0 AS row_count, 0 AS bytes, 'DBA' AS owner, '' AS description FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema')"
        if search:
            query += f" AND (table_name LIKE '%{search}%')"
            
        columns_query = "SELECT table_name, column_name, data_type, is_nullable, '' AS description, 'DBA' AS data_owner FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog', 'information_schema')"
    else:
        query = "SELECT table_schema, table_name, row_count, bytes, owner, description FROM information_schema.tables"
        if search:
            query += f" WHERE table_name LIKE '%{search}%' OR description LIKE '%{search}%'"
        
        columns_query = "SELECT table_name, column_name, data_type, is_nullable, description, data_owner FROM information_schema.columns"
        
    tables_res = db.execute_query(query)
    columns_res = db.execute_query(columns_query)
    
    # Fallback to mock data if live connection query fails
    if not tables_res.get("success") or not columns_res.get("success"):
        mock_query = "SELECT table_schema, table_name, row_count, bytes, owner, description FROM information_schema.tables"
        if search:
            mock_query += f" WHERE table_name LIKE '%{search}%' OR description LIKE '%{search}%'"
        tables_res = db.execute_mock_query(mock_query)
        
        mock_columns_query = "SELECT table_name, column_name, data_type, is_nullable, description, data_owner FROM information_schema.columns"
        columns_res = db.execute_mock_query(mock_columns_query)
        
    tables = tables_res.get("data", [])
    columns = columns_res.get("data", [])
    
    # Group columns by table
    for table in tables:
        t_name = table.get("TABLE_NAME")
        if t_name:
            table["columns"] = [col for col in columns if col.get("TABLE_NAME") == t_name]
        else:
            table["columns"] = []
        
    return {"tables": tables}

@router.post("/api/metadata/dictionary/generate")
async def generate_dictionary(req: SchemaRequest):
    res = ai.generate_data_dictionary(req.table_name, req.columns)
    return res
