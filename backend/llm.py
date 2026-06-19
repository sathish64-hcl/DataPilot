import os
import re
import json

class AI_Engine:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.gemini_enabled = False
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.gemini_enabled = True
            except Exception as e:
                print(f"Failed to load Gemini API, using local AI engine fallback. Error: {e}")

    def generate_sql(self, schema_info: str, user_question: str, db=None, schema=None) -> dict:
        """Translates user natural language query to Snowflake SQL."""
        if self.gemini_enabled:
            prompt = f"""
            You are a Snowflake SQL Developer Expert. Generate a Snowflake SQL query for this request: "{user_question}".
            
            Active Database Context: Database={db or 'None'}, Schema={schema or 'None'}
            Here is the schema metadata of the available tables:
            {schema_info}
            
            Return ONLY a valid JSON object matching this schema. Do not include any markdowns or markdown code block identifiers in the raw response:
            {{
                "sql": "generated_snowflake_sql_query",
                "explanation": "brief description of the logic",
                "visualization": {{"type": "bar|line|pie|none", "x": "column_for_x_axis", "y": "column_for_y_axis"}}
            }}
            """
            try:
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                # Clean up potential markdown formatting if returned
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
            except Exception as e:
                # Fallback on Gemini error
                print(f"Gemini API SQL generation error: {e}")

        # ── Schema-aware heuristic fallback ──────────────────────────────────
        q = user_question.lower()
        sql = ""
        explanation = ""
        vis = {"type": "none", "x": "", "y": ""}

        # Build a quick lookup from schema_info lines:
        #  "Table TABLENAME: COLNAME (TYPE)"
        schema_tables = {}   # { table_name: [(col_name, data_type), ...] }
        if schema_info:
            for line in schema_info.splitlines():
                line = line.strip()
                if line.startswith("Table ") and ":" in line:
                    try:
                        parts = line.split(":", 1)
                        tname = parts[0].replace("Table ", "").strip().upper()
                        col_part = parts[1].strip()
                        # col_part looks like "COL_NAME (DATA_TYPE)"
                        col_name = col_part.split("(")[0].strip().upper()
                        col_type = col_part.split("(")[1].replace(")", "").strip().upper() if "(" in col_part else ""
                        if tname not in schema_tables:
                            schema_tables[tname] = []
                        schema_tables[tname].append((col_name, col_type))
                    except Exception:
                        pass

        # Helpers ─────────────────────────────────────────────────────────────
        NUMERIC_TYPES = {"NUMBER", "FLOAT", "INT", "INTEGER", "DECIMAL", "DOUBLE",
                         "BIGINT", "SMALLINT", "NUMERIC", "MONEY", "REAL"}
        DATE_TYPES    = {"DATE", "TIMESTAMP", "TIMESTAMP_NTZ", "TIMESTAMP_LTZ",
                         "TIMESTAMP_TZ", "DATETIME"}
        TEXT_TYPES    = {"VARCHAR", "TEXT", "STRING", "CHAR", "CHARACTER", "NVARCHAR"}

        def classify(cols):
            numeric, date, text = [], [], []
            for cname, ctype in cols:
                if ctype in NUMERIC_TYPES: numeric.append(cname)
                elif ctype in DATE_TYPES:  date.append(cname)
                elif ctype in TEXT_TYPES:  text.append(cname)
            return numeric, date, text

        def qualify(table):
            """Return the fully-qualified table name using active db/schema."""
            if db and schema:
                return f"{db}.{schema}.{table}"
            return table

        def build_sql_for_table(t_upper):
            """Generate a context-aware SQL statement for the given table."""
            cols = schema_tables.get(t_upper, [])
            numeric, date, text = classify(cols)
            q_lower = q

            # Explicit "first N rows" or "show rows"
            if any(kw in q_lower for kw in ("first 10", "first few", "show rows", "all rows", "limit")):
                return (f"SELECT * FROM {qualify(t_upper)} LIMIT 10;",
                        f"Shows the first 10 rows from {t_upper}.",
                        {"type": "none", "x": "", "y": ""})

            # Count
            if any(kw in q_lower for kw in ("how many", "count", "total records", "number of")):
                return (f"SELECT COUNT(*) AS record_count FROM {qualify(t_upper)};",
                        f"Counts all records in {t_upper}.",
                        {"type": "none", "x": "", "y": ""})

            # "grouped by" or "total X by Y"
            if ("grouped by" in q_lower or "group by" in q_lower or "by " in q_lower) and numeric and text:
                return (
                    f"SELECT {text[0]}, SUM({numeric[0]}) AS total_{numeric[0].lower()} FROM {qualify(t_upper)} GROUP BY {text[0]} ORDER BY total_{numeric[0].lower()} DESC;",
                    f"Sums {numeric[0]} grouped by {text[0]} in {t_upper}.",
                    {"type": "bar", "x": text[0], "y": f"TOTAL_{numeric[0]}"}
                )

            # Trend / time series
            if any(kw in q_lower for kw in ("trend", "over time", "by date", "by month", "by year")) and date and numeric:
                return (
                    f"SELECT {date[0]}, SUM({numeric[0]}) AS total_{numeric[0].lower()} FROM {qualify(t_upper)} GROUP BY {date[0]} ORDER BY {date[0]} ASC;",
                    f"Shows {numeric[0]} trend over {date[0]} in {t_upper}.",
                    {"type": "line", "x": date[0], "y": f"TOTAL_{numeric[0]}"}
                )

            # Distinct / unique values
            if any(kw in q_lower for kw in ("distinct", "unique", "values")) and text:
                return (
                    f"SELECT {text[0]}, COUNT(*) AS count FROM {qualify(t_upper)} GROUP BY {text[0]} ORDER BY count DESC;",
                    f"Shows distinct {text[0]} values and their counts from {t_upper}.",
                    {"type": "bar", "x": text[0], "y": "COUNT"}
                )

            # "columns" / "schema"
            if any(kw in q_lower for kw in ("column", "schema", "structure", "describe")):
                col_list = ", ".join(c for c, _ in cols[:10]) if cols else "*"
                return (
                    f"SELECT {col_list} FROM {qualify(t_upper)} LIMIT 5;",
                    f"Previews columns and sample data from {t_upper}.",
                    {"type": "none", "x": "", "y": ""}
                )

            # Default: show sample rows
            return (
                f"SELECT * FROM {qualify(t_upper)} LIMIT 10;",
                f"Shows first 10 records from {t_upper}.",
                {"type": "none", "x": "", "y": ""}
            )

        # ── Step 1: Explicit "from TABLE_NAME" extraction ─────────────────────
        from_match = re.search(r'\bfrom\s+([A-Za-z_][A-Za-z0-9_]*)\b', user_question, re.IGNORECASE)
        explicit_table = from_match.group(1).upper() if from_match else None

        if explicit_table and (explicit_table in schema_tables or schema_tables):
            # Use explicit table if it's in schema, else use best match
            target = explicit_table if explicit_table in schema_tables else list(schema_tables.keys())[0]
            sql, explanation, vis = build_sql_for_table(target)

        # ── Step 2: Match table name mentioned anywhere in the question ───────
        elif schema_tables:
            matched_table = None
            for t_name in schema_tables:
                if t_name.lower() in q or t_name.lower().replace("_", " ") in q:
                    matched_table = t_name
                    break
            if not matched_table:
                matched_table = list(schema_tables.keys())[0]  # use first table
            sql, explanation, vis = build_sql_for_table(matched_table)

        # ── Step 3: Legacy hardcoded fallback (no schema info) ───────────────
        else:
            db_upper = db.upper() if db else ""
            if "customer count" in q or "customers by state" in q:
                sql = "SELECT state, COUNT(*) as customer_count FROM customer GROUP BY state ORDER BY customer_count DESC;"
                explanation = "Groups customers by state."
                vis = {"type": "bar", "x": "STATE", "y": "CUSTOMER_COUNT"}
            elif "revenue trend" in q or "revenue for the last 12 months" in q:
                sql = "SELECT order_date as date, SUM(amount) as total_revenue FROM orders GROUP BY order_date ORDER BY order_date ASC;"
                explanation = "Revenue over time."
                vis = {"type": "line", "x": "DATE", "y": "TOTAL_REVENUE"}
            elif "inactive customers" in q:
                sql = "SELECT customer_id, name, email, status FROM customer WHERE status = 'INACTIVE' LIMIT 20;"
                explanation = "Lists inactive customers."
            elif "grants" in q or "who has access" in q or "permission" in q:
                sql = "SELECT object_type, object_name, role, privilege FROM access_control WHERE object_name = 'CUSTOMER';"
                explanation = "Access control grants for CUSTOMER."
            else:
                sql = "SELECT * FROM customer LIMIT 10;"
                explanation = "Shows first 10 customer records."

        return {
            "sql": sql,
            "explanation": explanation,
            "visualization": vis
        }

    def explain_and_optimize(self, sql_query: str) -> dict:
        """Explains query and identifies potential inefficiencies."""
        if self.gemini_enabled:
            prompt = f"""
            You are a Snowflake database tuning expert.
            Analyze this SQL query:
            "{sql_query}"
            
            Identify performance problems (full scans, bad joins, sizing), explain it in business terms, and generate a optimized version.
            Return ONLY a valid JSON object matching this schema. Do not include any markdowns:
            {{
                "explanation": "business-friendly explanation",
                "inefficiencies": ["Inefficiency 1", "Inefficiency 2"],
                "recommendations": ["Recommendation 1", "Recommendation 2"],
                "optimized_sql": "optimized_sql_query"
            }}
            """
            try:
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
            except Exception as e:
                print(f"Gemini API Optimize error: {e}")

        # Local Fallback
        ineff = []
        recs = []
        opt_sql = sql_query

        # Basic parsing checks
        if "join" in sql_query.lower() and "on" not in sql_query.lower():
            ineff.append("Implicit cross-join detected. Missing explicit join key mapping.")
            recs.append("Add clear 'ON' conditions aligning matching columns.")
        if "*" in sql_query:
            ineff.append("Select Star (*) retrieval returns unnecessary columns and increases network serialization overhead.")
            recs.append("Specify only the actual columns required by your dashboard or report.")
        if "from lineitem" in sql_query.lower() and "where" not in sql_query.lower():
            ineff.append("Full table scan detected on high-volume table 'LINEITEM'.")
            recs.append("Apply date filters or limit constraints to prune scanned partitions.")
        if "date" in sql_query.lower() and "date_trunc" in sql_query.lower():
            ineff.append("Function wrapping on filters prevents index lookup / partition pruning optimization.")
            recs.append("Filter directly on the raw column using range predicates instead.")

        if not ineff:
            ineff.append("No obvious syntax anti-patterns detected. Standard execution index applies.")
            recs.append("Configure warehouse auto-suspend to 60 seconds to save credits if run during low-traffic periods.")

        # Build dummy optimized query
        if "*" in sql_query and "customer" in sql_query.lower():
            opt_sql = "SELECT customer_id, name, email, status FROM customer WHERE status = 'ACTIVE';"
            recs.append("Replaced 'SELECT *' with explicit business columns and added active status filter.")

        return {
            "explanation": "Retrieves transactions and joins customer details to evaluate recent activity logs.",
            "inefficiencies": ineff,
            "recommendations": recs,
            "optimized_sql": opt_sql
        }

    def generate_data_dictionary(self, table_name: str, columns: list) -> dict:
        """Generates descriptions and definitions for data catalog."""
        if self.gemini_enabled:
            prompt = f"""
            Generate a documentation dictionary for table '{table_name}' with these columns: {columns}.
            Return ONLY a valid JSON object matching this schema. Do not include markdown wraps:
            {{
                "table_description": "General description",
                "owner": "Default Owner",
                "refresh_frequency": "Daily/Hourly",
                "source_system": "Source name",
                "columns": [
                    {{"name": "col_name", "description": "col_desc", "owner": "owner_name"}}
                ]
            }}
            """
            try:
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
            except Exception as e:
                print(f"Gemini API Data Dictionary error: {e}")

        # Local Fallback
        col_list = []
        for c in columns:
            desc = "Internal record field tracking identifier."
            owner = "Sathish (Data Arch)"
            if "email" in c.lower():
                desc = "Primary customer contact email address. Managed under PII constraints."
                owner = "Sales Ops Team"
            elif "amount" in c.lower() or "price" in c.lower():
                desc = "Monetary currency value computed in USD currency units."
                owner = "Finance Admin"
            elif "state" in c.lower():
                desc = "US State code location identifier."
                owner = "Sales Ops Team"
            elif "status" in c.lower():
                desc = "State lifecycle flag: ACTIVE, INACTIVE, SUSPENDED."
                owner = "Customer Success"

            col_list.append({
                "name": c,
                "description": desc,
                "owner": owner
            })

        return {
            "table_description": f"Core operational ledger table storing info for {table_name}.",
            "owner": "Sathish (Data Arch)",
            "refresh_frequency": "Daily ETL at 02:00 AM UTC",
            "source_system": "Salesforce CRM Sync Stream",
            "columns": col_list
        }

    def answer_rag(self, query: str, document_chunks: list) -> dict:
        """Answers documentation search queries using RAG context."""
        context = "\n---\n".join([f"Document: {doc['TITLE']} ({doc['SOURCE_TYPE']})\nContent: {doc['CONTENT']}" for doc in document_chunks])
        
        if self.gemini_enabled:
            prompt = f"""
            You are a Snowflake documentation assistant. Answer the user question based ONLY on the context provided.
            
            Context:
            {context}
            
            Question:
            {query}
            
            Return a JSON object:
            {{
                "answer": "detailed answer here",
                "citations": ["document_title_1"]
            }}
            """
            try:
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
            except Exception as e:
                print(f"Gemini API RAG error: {e}")

        # Local Fallback answering
        q = query.lower()
        ans = "Documentation match not found. Please review the listed architecture standards in the metadata dashboard."
        citations = []

        for doc in document_chunks:
            if "confluence" in doc['SOURCE_TYPE'].lower() and ("load" in q or "customer" in q or "ingest" in q):
                ans = "Customer data is loaded nightly at 02:00 AM UTC via AWS S3. It streams into STAGING.RAW_LOGINS and merges into PUBLIC.CUSTOMER using the WH_LOAD_LARGE warehouse which automatically suspends after 60 seconds of inactivity."
                citations.append(doc['TITLE'])
                break
            elif "warehouse" in q or "paus" in q or "suspend" in q:
                if "pausing" in doc['TITLE'].lower() or "suspend" in doc['CONTENT'].lower():
                    ans = "To manage costs, Snowflake warehouses require an auto-suspend policy: WH_BI_MEDIUM suspends after 5 minutes, WH_LOAD_LARGE after 60 seconds, and WH_ELT_XL after 3 minutes. Warehouses auto-resume upon new queries."
                    citations.append(doc['TITLE'])
                    break
            elif "governance" in q or "email" in q or "owner" in q or "pii" in q:
                if "governance" in doc['TITLE'].lower() or "owner" in doc['CONTENT'].lower():
                    ans = "PII details (email, phone, name) reside in the PUBLIC schema. SELECT grants are restricted to ROLE_BI_ANALYST and ROLE_MARKETING, monitored via ACCOUNT_USAGE.GRANTS_TO_ROLES. The owner is Sathish."
                    citations.append(doc['TITLE'])
                    break

        if not citations and document_chunks:
            # General fallback citation
            ans = f"Operational data is processed in batch jobs. Here is the closest documentation reference: {document_chunks[0]['CONTENT'][:200]}..."
            citations.append(document_chunks[0]['TITLE'])

        return {
            "answer": ans,
            "citations": citations
        }
        
    def investigate_incident(self, incident_details: dict, logs: list) -> dict:
        """Correlates logs to identify probable root cause of failures."""
        if self.gemini_enabled:
            prompt = f"""
            Analyze the following incident and system logs:
            Incident: {json.dumps(incident_details)}
            System Logs: {json.dumps(logs)}
            
            Identify the probable root cause, impact, and actionable resolution steps.
            Return a JSON object:
            {{
                "root_cause": "Detailed explanation of why it failed",
                "affected_objects": ["table_name_1", "pipeline_name_2"],
                "risk_score": 8, // 1 to 10 scale
                "remediation_steps": ["Step 1", "Step 2"]
            }}
            """
            try:
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                return json.loads(text)
            except Exception as e:
                print(f"Gemini API Incident error: {e}")

        # Local Heuristic correlation fallback
        msg = incident_details.get("ERROR_MESSAGE", "").lower()
        cause = "System pipeline timeout error during database transaction write phase."
        affected = [incident_details.get("PIPELINE_NAME", "Data Pipeline")]
        risk = 5
        steps = ["Re-run the pipeline loader manually", "Check active database locks in Snowflake console"]

        if "state_name" in msg or "schema" in msg or "drift" in msg:
            cause = "Schema Drift: The source S3 JSON file included a column 'STATE_NAME' which was not mapped in the MERGE statements of the Customer Loading Pipeline, leading to a SQL compilation failure."
            affected = ["STAGING.RAW_LOGINS", "PUBLIC.CUSTOMER", "Customer Merge Pipeline"]
            risk = 8
            steps = [
                "Modify main_pipeline.py to map STATE_NAME to STATE field",
                "Apply strict JSON schema validation at the S3 ingestion gate",
                "Alert the Marketing team to coordinate schema changes"
            ]
        elif "delay" in msg or "wait" in msg or "queue" in msg:
            cause = "Resource Contention: Warehouse WH_ELT_XL was locked by a long-running full table scan query (q100918) executed by a BI analyst, leaving zero available clusters for the ETL scheduler."
            affected = ["WH_ELT_XL", "Nightly ETL Queue"]
            risk = 7
            steps = [
                "Implement query runtime limits (STATEMENT_TIMEOUT_IN_SECONDS = 600) on the BI warehouse",
                "Separate developer/analyst queries into WH_BI_MEDIUM and keep WH_ELT_XL reserved for core pipelines",
                "Configure auto-suspend and multi-cluster auto-scaling policies"
            ]

        return {
            "root_cause": cause,
            "affected_objects": affected,
            "risk_score": risk,
            "remediation_steps": steps
        }
