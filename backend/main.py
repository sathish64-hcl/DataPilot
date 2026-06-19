from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
from database import DatabaseManager
from llm import AI_Engine
from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime

app = FastAPI(title="Data Pilot Studio API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate managers
db = DatabaseManager()
ai = AI_Engine()

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

class SchemaRequest(BaseModel):
    table_name: str
    columns: List[str]

@app.post("/api/connection/test")
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
    else:
        return {"success": False, "message": msg, "mode": f"{platform}_FALLBACK"}

@app.post("/api/chat")
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

@app.get("/api/chat/samples")
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

@app.get("/api/databases")
async def get_databases():
    dbs = db.get_databases()
    return {"databases": dbs}

@app.get("/api/schemas")
async def get_schemas(database: str):
    sch = db.get_schemas(database)
    return {"schemas": sch}

@app.get("/api/tables")
async def get_tables(database: str, schema: str, table_type: str = "ALL"):
    tbl = db.get_tables(database, schema, table_type)
    return {"tables": tbl}

@app.post("/api/execute-sql")
async def execute_sql(req: SQLRequest):
    res = db.execute_query(req.sql)
    if res.get("success"):
        return res
    else:
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to execute SQL query."))

@app.post("/api/sql/optimize")
async def optimize_query(req: SQLRequest):
    res = ai.explain_and_optimize(req.sql)
    return res

@app.get("/api/metadata")
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

@app.post("/api/metadata/dictionary/generate")
async def generate_dictionary(req: SchemaRequest):
    res = ai.generate_data_dictionary(req.table_name, req.columns)
    return res

@app.get("/api/governance")
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

@app.get("/api/cost/dashboard")
async def get_cost_dashboard():
    # Fetch query history
    qh_res = db.execute_query("SELECT query_id, query_text, user_name, warehouse_name, total_elapsed_time, credits_used FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY ORDER BY credits_used DESC")
    # Fetch daily warehouse billing
    metering_res = db.execute_query("SELECT start_time, warehouse_name, credits_used FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY ORDER BY start_time DESC")
    
    if not qh_res.get("success") or not metering_res.get("success"):
         raise HTTPException(status_code=500, detail="Failed to query warehouse billing logs.")
         
    # Compute summary stats
    metering_data = metering_res.get("data", [])
    total_credits = sum([float(row["CREDITS_USED"]) for row in metering_data])
    
    whs = {}
    for row in metering_data:
        w_name = row["WAREHOUSE_NAME"]
        whs[w_name] = whs.get(w_name, 0.0) + float(row["CREDITS_USED"])
        
    wh_breakdown = [{"warehouse": k, "credits": round(v, 2)} for k, v in whs.items()]
    
    # Aggregated daily trend
    daily_costs = {}
    for row in metering_data:
        start_time = row["START_TIME"]
        if hasattr(start_time, "strftime"):
            date_str = start_time.strftime("%Y-%m-%d")
        else:
            date_str = str(start_time).split(" ")[0]
        daily_costs[date_str] = daily_costs.get(date_str, 0.0) + float(row["CREDITS_USED"])
        
    daily_trend = [{"date": k, "credits": round(v, 2)} for k, v in sorted(daily_costs.items())]

    # Optimization rules
    recommendations = [
        "Set AUTO_SUSPEND = 60 on WH_LOAD_LARGE (currently running 5 minutes idle).",
        "Enable Multi-cluster auto-scaling on WH_ELT_XL to resolve pipeline queuing delays.",
        "Migrate 8 queries from WH_ELT_XL to WH_BI_MEDIUM for cost reduction."
    ]

    return {
        "total_credits_used": round(total_credits, 2),
        "active_warehouses_count": len(wh_breakdown),
        "most_expensive_queries": qh_res.get("data", [])[:5],
        "warehouse_credits": wh_breakdown,
        "daily_trend": daily_trend,
        "recommendations": recommendations
    }

@app.get("/api/lineage")
async def get_lineage(object_name: str = ""):
    # Build standard response representing database object relationships
    # This acts as our lineage DAG
    nodes = [
        {"id": "s3_customer", "label": "s3://company-datalake/customer/", "type": "stage", "category": "source"},
        {"id": "raw_logins", "label": "STAGING.RAW_LOGINS", "type": "table", "category": "staging"},
        {"id": "customer", "label": "PUBLIC.CUSTOMER", "type": "table", "category": "core"},
        {"id": "orders", "label": "PUBLIC.ORDERS", "type": "table", "category": "core"},
        {"id": "customer_ltv", "label": "ANALYTICS.CUSTOMER_LTV", "type": "view", "category": "analytics"},
        {"id": "monthly_revenue", "label": "ANALYTICS.MONTHLY_REVENUE", "type": "view", "category": "analytics"},
        {"id": "sales_tableau", "label": "Tableau Revenue Dashboard", "type": "dashboard", "category": "downstream"}
    ]
    
    links = [
        {"source": "s3_customer", "target": "raw_logins"},
        {"source": "raw_logins", "target": "customer"},
        {"source": "customer", "target": "customer_ltv"},
        {"source": "orders", "target": "customer_ltv"},
        {"source": "orders", "target": "monthly_revenue"},
        {"source": "customer_ltv", "target": "sales_tableau"},
        {"source": "monthly_revenue", "target": "sales_tableau"}
    ]
    
    # Simple Impact Analysis Calculation
    impact_score = 3
    affected_pipelines = []
    
    if object_name:
        obj = object_name.upper()
        if "CUSTOMER" in obj:
            impact_score = 9
            affected_pipelines = [
                "Nightly Revenue Merge Job (High Risk)",
                "Customer Loyalty ETL Stream (Medium Risk)",
                "Tableau Sales Report Integration (High Risk)"
            ]
        elif "ORDERS" in obj:
            impact_score = 8
            affected_pipelines = [
                "Monthly Financial Aggregation (High Risk)",
                "Tableau Sales Report Integration (High Risk)"
            ]
        elif "EMAIL" in obj or "PII" in obj:
            impact_score = 6
            affected_pipelines = [
                "Marketing Campaign Sync (Medium Risk)",
                "GDPR Compliance Scanner (Low Risk)"
            ]
            
    return {
        "nodes": nodes,
        "links": links,
        "impact": {
            "object_queried": object_name,
            "risk_score": impact_score,
            "affected_pipelines": affected_pipelines
        }
    }

@app.get("/api/quality/dashboard")
async def get_quality_dashboard():
    res = db.execute_query("SELECT table_name, column_name, check_name, check_status, fail_count, total_count, last_run FROM data_quality_metrics")
    if not res.get("success"):
         raise HTTPException(status_code=500, detail="Failed to load data quality logs.")
         
    metrics = res.get("data", [])
    
    # Calculate Data Quality Score
    passed = sum([1 for m in metrics if m["CHECK_STATUS"] == "PASS"])
    total = len(metrics)
    dq_score = int((passed / total) * 100) if total > 0 else 100
    
    anomalies = [m for m in metrics if m["CHECK_STATUS"] == "FAIL"]
    
    return {
        "quality_score": dq_score,
        "total_checks_run": total,
        "checks_passed": passed,
        "checks_failed": len(anomalies),
        "metrics": metrics,
        "anomalies": anomalies
    }

@app.get("/api/rag/search")
async def search_rag(query: str = ""):
    docs_res = db.execute_query("SELECT title, source_type, content, metadata FROM rag_documents")
    if not docs_res.get("success"):
         raise HTTPException(status_code=500, detail="Failed to load knowledge database.")
         
    docs = docs_res.get("data", [])
    
    # Match query keywords locally to RAG chunks
    matched_chunks = []
    q = query.lower()
    for doc in docs:
        if any(kw in doc["CONTENT"].lower() or kw in doc["TITLE"].lower() for kw in q.split()):
            # Parse json metadata safely
            meta = {}
            try:
                import json
                meta = json.loads(doc["METADATA"])
            except:
                pass
            doc["parsed_metadata"] = meta
            matched_chunks.append(doc)
            
    # Default to all if no match found
    if not matched_chunks:
        matched_chunks = docs
        
    answer_res = ai.answer_rag(query, matched_chunks)
    
    return {
        "answer": answer_res.get("answer", ""),
        "citations": answer_res.get("citations", []),
        "source_chunks": matched_chunks
    }

@app.get("/api/incidents")
async def get_incidents(incident_id: str = ""):
    list_res = db.execute_query("SELECT incident_id, incident_time, pipeline_name, status, error_message, root_cause, resolution FROM incident_logs")
    if not list_res.get("success"):
         raise HTTPException(status_code=500, detail="Failed to load incident files.")
         
    incidents = list_res.get("data", [])
    
    # If a specific incident ID is queried, generate analysis correlation
    investigation = None
    if incident_id:
        incident_item = next((inc for inc in incidents if inc["INCIDENT_ID"] == incident_id), None)
        if incident_item:
            # Query recent audit log context and metadata
            recent_queries = db.execute_query("SELECT query_text, user_name, execution_status, error_message FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY LIMIT 10")
            recent_dq = db.execute_query("SELECT table_name, check_status, fail_count FROM data_quality_metrics WHERE check_status = 'FAIL'")
            
            logs_context = {
                "recent_failed_queries": recent_queries.get("data", []) if recent_queries.get("success") else [],
                "recent_failed_dq": recent_dq.get("data", []) if recent_dq.get("success") else []
            }
            investigation = ai.investigate_incident(incident_item, logs_context)
            
    return {
        "incidents": incidents,
        "investigation": investigation
    }

class IngestFeedRequest(BaseModel):
    url: str
    source_name: Optional[str] = "Website"

def parse_rss_feed(url: str):
    try:
        import feedparser
        d = feedparser.parse(url)
        entries = []
        for entry in d.entries[:15]:
            title = entry.get("title", "No Title")
            link = entry.get("link", "")
            summary = entry.get("summary", "") or entry.get("description", "")
            date = entry.get("published", "") or entry.get("updated", "")
            entries.append({
                "title": title,
                "content": summary,
                "link": link,
                "date": date
            })
        return entries
    except Exception as e:
        print(f"feedparser failed or not installed ({e}). Falling back to xml.etree.ElementTree parser.")
        
    try:
        import urllib.request
        import xml.etree.ElementTree as ET
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        entries = []
        
        for item in root.findall(".//item")[:15]:
            title = item.findtext("title", "No Title")
            link = item.findtext("link", "")
            description = item.findtext("description", "")
            date = item.findtext("pubDate", "")
            entries.append({
                "title": title,
                "content": description,
                "link": link,
                "date": date
            })
            
        if not entries:
            namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
            for entry in (root.findall(".//atom:entry", namespaces) or root.findall(".//entry"))[:15]:
                title = entry.findtext("atom:title", namespaces) or entry.findtext("title", "")
                link_elem = entry.find("atom:link", namespaces) or entry.find("link")
                link = link_elem.get("href") if link_elem is not None else ""
                summary = entry.findtext("atom:summary", namespaces) or entry.findtext("summary", "") or entry.findtext("atom:content", namespaces) or entry.findtext("content", "")
                date = entry.findtext("atom:updated", namespaces) or entry.findtext("updated", "")
                entries.append({
                    "title": title,
                    "content": summary,
                    "link": link,
                    "date": date
                })
        return entries
    except Exception as ex:
        print(f"Fallback RSS parser failed: {ex}")
        raise ValueError(f"Failed to parse RSS feed: {str(ex)}")

@app.post("/api/rag/ingest/feed")
async def ingest_feed(req: IngestFeedRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL is required.")
    
    try:
        articles = parse_rss_feed(req.url)
        if not articles:
            raise HTTPException(status_code=400, detail="No feed entries found at the provided URL.")
        
        success_count = 0
        ingested_titles = []
        for article in articles:
            meta = {
                "url": article["link"],
                "published_date": article["date"],
                "ingested_at": str(datetime.now())
            }
            content = article["content"]
            import re
            content = re.sub('<[^<]+?>', '', content)
            
            success = db.add_rag_document(
                title=article["title"],
                source_type=req.source_name or "Website",
                content=content,
                metadata=meta
            )
            if success:
                success_count += 1
                ingested_titles.append(article["title"])
                
        return {
            "success": True,
            "message": f"Successfully ingested {success_count} articles from feed.",
            "ingested_count": success_count,
            "titles": ingested_titles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest RSS feed: {str(e)}")

@app.post("/api/rag/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
        
        paragraphs = [p.strip() for p in text_content.split("\n\n") if p.strip()]
        
        chunks = []
        current_chunk = ""
        for p in paragraphs:
            if len(current_chunk) + len(p) < 1000:
                current_chunk += "\n\n" + p if current_chunk else p
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = p
        if current_chunk:
            chunks.append(current_chunk)
            
        if not chunks:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        success_count = 0
        for i, chunk in enumerate(chunks):
            title = f"{file.filename} (Chunk {i+1}/{len(chunks)})" if len(chunks) > 1 else file.filename
            meta = {
                "filename": file.filename,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "ingested_at": str(datetime.now())
            }
            success = db.add_rag_document(
                title=title,
                source_type="Uploaded File",
                content=chunk,
                metadata=meta
            )
            if success:
                success_count += 1
                
        return {
            "success": True,
            "message": f"Successfully uploaded and indexed '{file.filename}' into {success_count} search chunks.",
            "chunks_count": success_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest file: {str(e)}")

@app.get("/api/rag/documents")
async def get_rag_documents():
    return {"documents": db.get_rag_documents_list()}

@app.post("/api/rag/documents/clear")
async def clear_rag_documents_endpoint():
    success = db.clear_rag_documents()
    if success:
        return {"success": True, "message": "RAG Knowledge Base reset to default schemas and runbooks."}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear RAG database.")

class UseSessionRequest(BaseModel):
    role: Optional[str] = None
    warehouse: Optional[str] = None
    database: Optional[str] = None
    schema_name: Optional[str] = None

@app.get("/api/roles")
async def get_roles():
    return {"roles": db.get_roles()}

@app.get("/api/warehouses")
async def get_warehouses():
    return {"warehouses": db.get_warehouses()}

@app.post("/api/connection/use")
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
