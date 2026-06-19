from fastapi import APIRouter, HTTPException
from common import db, ai, ChatRequest, SQLRequest
from typing import Optional

router = APIRouter()

@router.post("/api/chat")
async def chat_assistant(req: ChatRequest):
    # Fetch schema description to send to LLM
    db_prefix = f'"{req.database.upper()}".' if req.database else ""
    query = f"SELECT table_name, column_name, data_type FROM {db_prefix}information_schema.columns"
    filters = []
    if req.database:
        filters.append(f"table_catalog = '{req.database.upper()}'")
    if req.schema_name:
        filters.append(f"table_schema = '{req.schema_name.upper()}'")
    if req.table_name:
        filters.append(f"table_name = '{req.table_name.upper()}'")
        
    if filters:
        query += " WHERE " + " AND ".join(filters)
        
    schema_res = db.execute_query(query)
    schema_summary = ""
    if schema_res.get("success"):
        schema_summary = "\n".join([f"Table {row['TABLE_NAME']}: {row['COLUMN_NAME']} ({row['DATA_TYPE']})" for row in schema_res.get("data", [])[:20]])
    
    db_ctx = f"Active DB Context: Database={req.database or 'None'}, Schema={req.schema_name or 'None'}, Table={req.table_name or 'None'}"
    res = ai.generate_sql(schema_summary + "\n" + db_ctx, req.message, db=req.database, schema=req.schema_name)
    
    sql = res.get("sql", "")
    # Prefix schema path if needed
    if sql and req.database and req.schema_name:
        if req.database.lower() not in sql.lower():
            import re
            tables_list = db.get_tables(req.database, req.schema_name)
            for t in tables_list:
                pattern = re.compile(rf"\b{t}\b", re.IGNORECASE)
                sql = pattern.sub(f"{req.database}.{req.schema_name}.{t}", sql)
                sql = sql.replace(f"{req.database}.{req.schema_name}.{req.database}", req.database)
                
    return {
        "success": True,
        "reply": res.get("explanation", ""),
        "sql": sql,
        "visualization": res.get("visualization", {"type": "none"})
    }

@router.get("/api/chat/samples")
async def get_chat_samples(database: Optional[str] = None, schema: Optional[str] = None, table_name: Optional[str] = None):
    """Generate contextual sample questions based on the actual tables/columns in the selected DB/schema/table."""
    # Build live DB query
    db_prefix = f'"{database.upper()}".' if database else ""
    query = f"SELECT table_name, column_name, data_type FROM {db_prefix}information_schema.columns"
    filters = []
    if database:
        filters.append(f"table_catalog = '{database.upper()}'")
    if schema:
        filters.append(f"table_schema = '{schema.upper()}'")
    if table_name:
        filters.append(f"table_name = '{table_name.upper()}'")
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " LIMIT 200"

    schema_res = db.execute_query(query)
    
    if not schema_res.get("success") or not schema_res.get("data"):
        # Try mock DB's INFORMATION_SCHEMA_COLUMNS as second option
        mock_filters = []
        if database:
            mock_filters.append(f"table_catalog = '{database.upper()}'")
        if schema:
            mock_filters.append(f"table_schema = '{schema.upper()}'")
        if table_name:
            mock_filters.append(f"table_name = '{table_name.upper()}'")
        mock_cols_query = "SELECT table_name, column_name, data_type FROM information_schema.columns"
        if mock_filters:
            mock_cols_query += " WHERE " + " AND ".join(mock_filters)
        mock_cols_query += " LIMIT 200"
        schema_res = db.execute_mock_query(mock_cols_query)

    # If still nothing, fall back to table names only
    if not schema_res.get("success") or not schema_res.get("data"):
        table_names = db.get_tables(database or "", schema or "")
        if table_names:
            samples = [f"Show the first 10 rows from {table_names[0]}."]
            if len(table_names) > 1:
                samples.append(f"How many records are in {table_names[1]}?")
            if len(table_names) > 2:
                samples.append(f"Show a summary of {table_names[2]}.")
            samples.append(f"What are all the columns in {table_names[0]}?")
            return {"samples": samples[:4]}
        return {"samples": [
            "Show all tables in this schema.",
            "How many records are in the largest table?"
        ]}
    
    # Build table -> columns map from schema metadata
    table_columns = {}
    for row in schema_res.get("data", []):
        t_name = row.get("TABLE_NAME", "")
        c_name = row.get("COLUMN_NAME", "")
        c_type = row.get("DATA_TYPE", "").upper()
        if not t_name:
            continue
        if t_name not in table_columns:
            table_columns[t_name] = []
        table_columns[t_name].append({"name": c_name, "type": c_type})
    
    samples = []
    table_list = list(table_columns.keys())[:6]
    
    for t_name in table_list:
        cols = table_columns[t_name]
        numeric_cols = [c for c in cols if c["type"] in ("NUMBER", "FLOAT", "INT", "INTEGER", "DECIMAL", "DOUBLE", "BIGINT", "SMALLINT", "NUMERIC")]
        date_cols    = [c for c in cols if c["type"] in ("DATE", "TIMESTAMP", "TIMESTAMP_NTZ", "TIMESTAMP_LTZ", "TIMESTAMP_TZ", "DATETIME")]
        text_cols    = [c for c in cols if c["type"] in ("VARCHAR", "TEXT", "STRING", "CHAR", "CHARACTER", "NVARCHAR")]

        if numeric_cols and text_cols:
            samples.append(f"Show total {numeric_cols[0]['name']} grouped by {text_cols[0]['name']} from {t_name}.")
        elif date_cols and numeric_cols:
            samples.append(f"Show {numeric_cols[0]['name']} trend over time from {t_name}.")
        elif date_cols and text_cols:
            samples.append(f"List recent {t_name} records by {date_cols[0]['name']}.")
        elif text_cols:
            samples.append(f"Show distinct {text_cols[0]['name']} values from {t_name}.")
        else:
            samples.append(f"Show the first 10 rows from {t_name}.")
        
        if len(samples) >= 4:
            break
    
    if len(samples) < 2 and table_list:
        samples.append(f"How many records are in {table_list[0]}?")
    
    return {"samples": samples[:4]}

@router.post("/api/execute-sql")
async def execute_sql(req: SQLRequest):
    res = db.execute_query(req.sql)
    if res.get("success"):
        return res
    else:
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to execute SQL query."))

@router.post("/api/sql/optimize")
async def optimize_query(req: SQLRequest):
    res = ai.explain_and_optimize(req.sql)
    return res
