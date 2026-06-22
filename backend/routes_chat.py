from fastapi import APIRouter, HTTPException
from common import db, ai, ChatRequest, SQLRequest
from typing import Optional
from routes_table_apps import log_query
import re

router = APIRouter()


def _safe_identifier(value: Optional[str]) -> str:
    if not value:
        return ""
    cleaned = value.strip()
    if not cleaned.replace("_", "").replace("$", "").isalnum():
        raise HTTPException(status_code=400, detail=f"Unsafe identifier: {value}")
    return cleaned.upper()


def _quote_identifier(value: Optional[str]) -> str:
    cleaned = _safe_identifier(value)
    return f'"{cleaned}"' if cleaned else ""


def _sql_literal(value: Optional[str]) -> str:
    return (value or "").upper().replace("'", "''")


def _limited_sql(sql: str, limit: int) -> str:
    cleaned = (sql or "").strip().rstrip(";")
    if not cleaned:
        return cleaned
    first_word = cleaned.split(None, 1)[0].lower()
    if first_word not in ("select", "with"):
        return cleaned
    return f"SELECT * FROM ({cleaned}) AS data_pilot_limited_result LIMIT {limit}"


def _extract_table_refs(sql: str):
    cleaned = re.sub(r"--.*?$|/\*.*?\*/", " ", sql or "", flags=re.MULTILINE | re.DOTALL)
    matches = re.findall(r"\b(?:from|join)\s+([\"A-Za-z0-9_.$]+)", cleaned, flags=re.IGNORECASE)
    refs = []
    for match in matches:
        ref = match.strip().strip(",").strip()
        if ref.startswith("(") or ref.lower() in ("select", "lateral", "table"):
            continue
        parts = [part.strip('"').upper() for part in ref.split(".") if part.strip('"')]
        if not parts:
            continue
        if len(parts) >= 3:
            database, schema, table = parts[-3], parts[-2], parts[-1]
        elif len(parts) == 2:
            database = (db.snowflake_config.get("database") or "").upper()
            schema, table = parts
        else:
            database = (db.snowflake_config.get("database") or "").upper()
            schema = (db.snowflake_config.get("schema") or "").upper()
            table = parts[0]
        if database and schema and table:
            refs.append({"database": database, "schema": schema, "table": table})
    unique = []
    seen = set()
    for ref in refs:
        key = (ref["database"], ref["schema"], ref["table"])
        if key not in seen:
            unique.append(ref)
            seen.add(key)
    return unique


def _metadata_for_table(ref):
    try:
        database = _safe_identifier(ref["database"])
        schema = _safe_identifier(ref["schema"])
        table = _safe_identifier(ref["table"])
    except HTTPException:
        return None
    query = (
        "SELECT table_catalog, table_schema, table_name, row_count, bytes "
        f"FROM {_quote_identifier(database)}.information_schema.tables "
        f"WHERE table_schema = '{_sql_literal(schema)}' AND table_name = '{_sql_literal(table)}'"
    )
    if db.use_mock:
        query = (
            "SELECT table_catalog, table_schema, table_name, row_count, bytes "
            "FROM information_schema.tables "
            f"WHERE table_catalog = '{_sql_literal(database)}' AND table_schema = '{_sql_literal(schema)}' AND table_name = '{_sql_literal(table)}'"
        )
    res = db.execute_query(query)
    if res.get("success") and res.get("data"):
        row = res["data"][0]
        return {
            "name": f"{database}.{schema}.{table}",
            "row_count": row.get("ROW_COUNT") or row.get("row_count") or 0,
            "bytes": row.get("BYTES") or row.get("bytes") or 0,
        }
    return {"name": f"{database}.{schema}.{table}", "row_count": 0, "bytes": 0}


def _rough_optimized_sql(sql: str):
    cleaned = (sql or "").strip().rstrip(";")
    optimized = cleaned
    notes = []
    if re.search(r"select\s+\*", optimized, flags=re.IGNORECASE):
        notes.append("Replace SELECT * with only the columns needed for the analysis.")
    if not re.search(r"\bwhere\b", optimized, flags=re.IGNORECASE):
        notes.append("Add selective WHERE filters, especially date filters, before running against large tables.")
    if not re.search(r"\blimit\s+\d+\b", optimized, flags=re.IGNORECASE) and re.match(r"^\s*select\b", optimized, flags=re.IGNORECASE):
        optimized = f"{optimized}\nLIMIT 100"
        notes.append("Added LIMIT 100 for exploratory execution.")
    if re.search(r"\bjoin\b", optimized, flags=re.IGNORECASE):
        notes.append("Pre-aggregate or filter each joined table before the JOIN when possible.")
    if notes:
        optimized = "-- Cost-aware rewrite notes:\n-- " + "\n-- ".join(notes) + "\n" + optimized
    return optimized or sql


def _format_bytes(num_bytes: float):
    value = float(num_bytes or 0)
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    while value >= 1024 and unit_index < len(units) - 1:
        value /= 1024
        unit_index += 1
    if unit_index == 0:
        return f"{int(value)}B"
    precision = 2 if value < 10 else 1
    return f"{value:.{precision}f}{units[unit_index]}"


def _format_cost(value: float):
    amount = float(value or 0)
    if 0 < amount < 0.01:
        return "<$0.01"
    return f"${amount:.2f}"


@router.post("/api/chat")
async def chat_assistant(req: ChatRequest):
    # Fetch schema description to send to LLM
    database = _safe_identifier(req.database) if req.database else ""
    schema_name = _safe_identifier(req.schema_name) if req.schema_name else ""
    table_name = _safe_identifier(req.table_name) if req.table_name else ""
    db_prefix = f'{_quote_identifier(database)}.' if database else ""
    query = f"SELECT table_name, column_name, data_type FROM {db_prefix}information_schema.columns"
    filters = []
    if database:
        filters.append(f"table_catalog = '{_sql_literal(database)}'")
    if schema_name:
        filters.append(f"table_schema = '{_sql_literal(schema_name)}'")
    if table_name:
        filters.append(f"table_name = '{_sql_literal(table_name)}'")
        
    if filters:
        query += " WHERE " + " AND ".join(filters)
        
    schema_res = db.execute_query(query)
    schema_summary = ""
    if schema_res.get("success"):
        schema_summary = "\n".join([f"Table {row['TABLE_NAME']}: {row['COLUMN_NAME']} ({row['DATA_TYPE']})" for row in schema_res.get("data", [])[:20]])
    
    db_ctx = f"Active DB Context: Database={database or 'None'}, Schema={schema_name or 'None'}, Table={table_name or 'None'}"
    res = ai.generate_sql(schema_summary + "\n" + db_ctx, req.message, db=database, schema=schema_name)
    
    sql = res.get("sql", "")
    # Prefix schema path if needed
    if sql and database and schema_name:
        if database.lower() not in sql.lower():
            import re
            tables_list = db.get_tables(database, schema_name)
            for t in tables_list:
                pattern = re.compile(rf"\b{t}\b", re.IGNORECASE)
                sql = pattern.sub(f"{database}.{schema_name}.{t}", sql)
                sql = sql.replace(f"{database}.{schema_name}.{database}", database)
                
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
    database = _safe_identifier(database) if database else ""
    schema = _safe_identifier(schema) if schema else ""
    table_name = _safe_identifier(table_name) if table_name else ""
    db_prefix = f'{_quote_identifier(database)}.' if database else ""
    query = f"SELECT table_name, column_name, data_type FROM {db_prefix}information_schema.columns"
    filters = []
    if database:
        filters.append(f"table_catalog = '{_sql_literal(database)}'")
    if schema:
        filters.append(f"table_schema = '{_sql_literal(schema)}'")
    if table_name:
        filters.append(f"table_name = '{_sql_literal(table_name)}'")
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " LIMIT 200"

    schema_res = db.execute_query(query)
    
    if not schema_res.get("success") or not schema_res.get("data"):
        # Try mock DB's INFORMATION_SCHEMA_COLUMNS as second option
        mock_filters = []
        if database:
            mock_filters.append(f"table_catalog = '{_sql_literal(database)}'")
        if schema:
            mock_filters.append(f"table_schema = '{_sql_literal(schema)}'")
        if table_name:
            mock_filters.append(f"table_name = '{_sql_literal(table_name)}'")
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
    log_query(req.sql, "AI Chat executed SQL")
    limit = req.limit if req.limit is not None else 100
    try:
        limit = max(1, min(int(limit), 1000))
    except (TypeError, ValueError):
        limit = 100
    sql_to_execute = _limited_sql(req.sql, limit)
    res = db.execute_query(sql_to_execute)
    if res.get("success"):
        total_row_count = len(res.get("data", []))
        res["data"] = res.get("data", [])[:limit]
        res["row_count"] = len(res["data"])
        res["total_row_count"] = total_row_count
        res["row_limit"] = limit
        return res
    else:
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to execute SQL query."))

@router.post("/api/sql/optimize")
async def optimize_query(req: SQLRequest):
    res = ai.explain_and_optimize(req.sql)
    return res


@router.post("/api/sql/cost-advisor")
async def cost_advisor(req: SQLRequest):
    sql = (req.sql or "").strip()
    if not sql:
        raise HTTPException(status_code=400, detail="SQL is required.")

    lowered = sql.lower()
    table_refs = _extract_table_refs(sql)
    table_stats = []
    for ref in table_refs[:8]:
        meta = _metadata_for_table(ref)
        if meta:
            table_stats.append(meta)

    total_bytes = sum(float(row.get("bytes") or 0) for row in table_stats)
    estimated_scan_bytes = total_bytes
    confidence = "Medium" if total_bytes else "Low"

    has_where = bool(re.search(r"\bwhere\b", lowered))
    has_limit = bool(re.search(r"\blimit\s+\d+\b", lowered))
    has_select_star = bool(re.search(r"select\s+\*", lowered))
    join_count = len(re.findall(r"\bjoin\b", lowered))
    has_group_by = bool(re.search(r"\bgroup\s+by\b", lowered))
    has_order_by = bool(re.search(r"\border\s+by\b", lowered))

    reduction = 0
    risk_points = 0
    findings = []
    suggestions = []

    if has_select_star:
        risk_points += 25
        reduction += 20
        findings.append("SELECT * can read and transfer unnecessary columns.")
        suggestions.append("Select only the columns needed for the answer.")
    if not has_where:
        risk_points += 30
        reduction += 30
        findings.append("No WHERE clause was found, so this may scan full table data.")
        suggestions.append("Add a date, partition-like, status, or business filter before execution.")
    if join_count:
        risk_points += min(25, join_count * 10)
        reduction += min(20, join_count * 8)
        findings.append(f"{join_count} JOIN clause(s) found. Large joins can amplify scan and shuffle work.")
        suggestions.append("Filter and pre-aggregate joined tables before joining.")
    if has_order_by and not has_limit:
        risk_points += 15
        reduction += 10
        findings.append("ORDER BY without LIMIT may sort a large result set.")
        suggestions.append("Add LIMIT for exploration or aggregate before sorting.")
    if not has_limit and re.match(r"^\s*select\b", lowered):
        risk_points += 10
        reduction += 5
        suggestions.append("Use LIMIT for exploratory queries.")
    if has_group_by:
        suggestions.append("For repeated dashboards, consider a pre-aggregated table or dynamic table.")

    if not findings:
        findings.append("No obvious high-cost SQL patterns were detected.")
    if not suggestions:
        suggestions.append("Query shape looks reasonable. Check result cache and warehouse size before repeated runs.")

    if total_bytes:
        if has_where:
            estimated_scan_bytes *= 0.45
        if not has_select_star:
            estimated_scan_bytes *= 0.65
        if has_limit and not has_group_by:
            estimated_scan_bytes *= 0.75
    estimated_scan_gb = round(estimated_scan_bytes / (1024 ** 3), 2)
    estimated_scan_gb_raw = estimated_scan_bytes / (1024 ** 3)
    estimated_scan_mb = round(estimated_scan_bytes / (1024 ** 2), 2)
    estimated_cost_raw = estimated_scan_gb_raw * 0.033
    estimated_cost_usd = round(estimated_cost_raw, 2)
    reduction_pct = min(75, max(0, reduction))
    optimized_scan_bytes = estimated_scan_bytes * (1 - reduction_pct / 100)
    optimized_scan_gb = round(optimized_scan_bytes / (1024 ** 3), 2)
    optimized_scan_mb = round(optimized_scan_bytes / (1024 ** 2), 2)
    optimized_cost_raw = estimated_cost_raw * (1 - reduction_pct / 100)
    optimized_cost_usd = round(optimized_cost_raw, 2)

    if estimated_scan_gb_raw >= 50 or risk_points >= 60:
        risk_level = "High"
    elif estimated_scan_gb_raw >= 5 or risk_points >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    cache_note = "If this exact query was run recently and underlying data has not changed, Snowflake result cache may reduce compute cost."
    alternatives = [
        "Use a filtered date range or business partition column.",
        "Build a pre-aggregated table for dashboard-level metrics.",
        "Replace SELECT * with the required business columns.",
        "Use cached results for repeated demo queries when freshness allows.",
    ]
    if join_count:
        alternatives.insert(1, "Materialize or pre-aggregate the largest joined table before joining.")

    return {
        "success": True,
        "risk_level": risk_level,
        "confidence": confidence,
        "estimated_scan_gb": estimated_scan_gb,
        "estimated_scan_mb": estimated_scan_mb,
        "estimated_scan_bytes": round(estimated_scan_bytes, 2),
        "estimated_scan_label": _format_bytes(estimated_scan_bytes),
        "estimated_cost_usd": estimated_cost_usd,
        "estimated_cost_label": _format_cost(estimated_cost_raw),
        "optimized_scan_gb": optimized_scan_gb,
        "optimized_scan_mb": optimized_scan_mb,
        "optimized_scan_bytes": round(optimized_scan_bytes, 2),
        "optimized_scan_label": _format_bytes(optimized_scan_bytes),
        "optimized_cost_usd": optimized_cost_usd,
        "optimized_cost_label": _format_cost(optimized_cost_raw),
        "estimated_reduction_pct": reduction_pct,
        "table_count": len(table_refs),
        "table_stats": table_stats,
        "findings": findings,
        "suggestions": suggestions,
        "alternatives": alternatives,
        "cache_note": cache_note,
        "optimized_sql": _rough_optimized_sql(sql),
        "assumptions": [
            "Estimate uses table metadata and SQL-shape heuristics; Snowflake's optimizer and result cache can change actual cost.",
            "Dollar estimate is a rough demo approximation, not a billing statement.",
            "For exact historical cost, compare executed query IDs in Snowflake ACCOUNT_USAGE.QUERY_HISTORY.",
        ],
    }
