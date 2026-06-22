import sqlite3
import os
import pandas as pd
from datetime import datetime, timedelta
import snowflake.connector

class DatabaseManager:
    def __init__(self, db_path="data_pilot_mock.db"):
        self.db_path = db_path
        self.conn_snowflake = None
        self.conn_redshift = None
        self.conn_postgresql = None
        self.snowflake_config = {
            "account": "uxcqeib-tb48867",
            "user": "HCLHACKATHON",
            "password": "Indian-1234567"
        }
        self.redshift_config = {}
        self.postgresql_config = {}
        self.active_platform = "SNOWFLAKE"
        self.use_mock = False
        self.init_mock_db()
        
        try:
            print("Attempting to auto-connect to Snowflake on startup...")
            success, msg = self.connect_snowflake()
            print(msg)
        except Exception as e:
            print(f"Auto-connect to Snowflake failed: {e}")
            self.use_mock = True

    def extract_account_id(self, account_url: str) -> str:
        if not account_url:
            return ""
        # Strip protocols
        url = account_url.replace("https://", "").replace("http://", "")
        # Split by dots and get host prefix
        parts = url.split(".")
        if len(parts) > 0:
            return parts[0]
        return account_url

    def set_snowflake_config(self, account, user, password=None, role=None, warehouse=None, database=None, schema=None, use_sso=False, token=None, auth_method="PASSWORD"):
        self.snowflake_config = {
            "account": self.extract_account_id(account),
            "user": user,
        }
        if role:
            self.snowflake_config["role"] = role
        if warehouse:
            self.snowflake_config["warehouse"] = warehouse
        if database:
            self.snowflake_config["database"] = database
        if schema:
            self.snowflake_config["schema"] = schema
            
        if auth_method == "SSO" or use_sso:
            self.snowflake_config["authenticator"] = "externalbrowser"
        elif auth_method == "OAUTH_TOKEN" or (token and auth_method == "OAUTH_TOKEN"):
            self.snowflake_config["authenticator"] = "oauth"
            self.snowflake_config["token"] = token
        else:
            if password:
                self.snowflake_config["password"] = password
        
        self.active_platform = "SNOWFLAKE"
        self.use_mock = False

    def connect_snowflake(self):
        try:
            if self.use_mock:
                return True, "Using Mock Database"
            self.conn_snowflake = snowflake.connector.connect(**self.snowflake_config)
            return True, "Connected to Snowflake successfully!"
        except Exception as e:
            self.use_mock = True
            return False, f"Snowflake connection failed: {str(e)}. Falling back to Mock Mode."

    def set_redshift_config(self, host, port, database, user, password):
        self.redshift_config = {
            "host": host,
            "port": int(port) if port else 5439,
            "database": database,
            "user": user,
            "password": password
        }
        self.active_platform = "REDSHIFT"
        self.use_mock = False

    def connect_redshift(self):
        try:
            if self.use_mock:
                return True, "Using Mock Database"
            import redshift_connector
            self.conn_redshift = redshift_connector.connect(**self.redshift_config)
            return True, "Connected to Amazon Redshift successfully!"
        except Exception as e:
            self.use_mock = True
            return False, f"Redshift connection failed: {str(e)}. Falling back to Mock Mode."

    def set_postgresql_config(self, host, port, database, user, password):
        self.postgresql_config = {
            "host": host,
            "port": int(port) if port else 5432,
            "database": database,
            "user": user,
            "password": password
        }
        self.active_platform = "POSTGRESQL"
        self.use_mock = False

    def connect_postgresql(self):
        try:
            if self.use_mock:
                return True, "Using Mock Database"
            import psycopg2
            self.conn_postgresql = psycopg2.connect(**self.postgresql_config)
            return True, "Connected to PostgreSQL successfully!"
        except Exception as e:
            self.use_mock = True
            return False, f"PostgreSQL connection failed: {str(e)}. Falling back to Mock Mode."

    def get_databases(self):
        if self.use_mock:
            if self.active_platform == "REDSHIFT":
                return ["REDSHIFT_DEV", "AWS_DATA_LAKE"]
            elif self.active_platform == "POSTGRESQL":
                return ["POSTGRES_DB", "ANALYTICS_DB"]
            else:
                return ["DEMO_DB", "ENTERPRISE_DATA_HUB"]
        
        if self.active_platform == "SNOWFLAKE" and self.conn_snowflake:
            try:
                cur = self.conn_snowflake.cursor()
                cur.execute("SHOW DATABASES")
                rows = cur.fetchall()
                cur.close()
                return [row[1] for row in rows]
            except Exception as e:
                print(f"Error fetching Snowflake databases: {e}")
                return ["DEMO_DB"]
        elif self.active_platform == "REDSHIFT" and self.conn_redshift:
            try:
                cur = self.conn_redshift.cursor()
                cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false")
                rows = cur.fetchall()
                cur.close()
                return [row[0] for row in rows]
            except Exception as e:
                print(f"Error fetching Redshift databases: {e}")
                return [self.redshift_config.get("database", "REDSHIFT_DEV")]
        elif self.active_platform == "POSTGRESQL" and self.conn_postgresql:
            try:
                cur = self.conn_postgresql.cursor()
                cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false")
                rows = cur.fetchall()
                cur.close()
                return [row[0] for row in rows]
            except Exception as e:
                print(f"Error fetching PostgreSQL databases: {e}")
                return [self.postgresql_config.get("database", "POSTGRES_DB")]
        return ["DEMO_DB"]

    def get_schemas(self, db_name: str):
        if self.use_mock:
            db_upper = db_name.upper()
            if db_upper == "ENTERPRISE_DATA_HUB":
                return ["FINANCIALS", "LOGISTICS"]
            elif db_upper == "REDSHIFT_DEV":
                return ["SALES", "MARKETING"]
            elif db_upper == "AWS_DATA_LAKE":
                return ["LOGS", "S3_STAGING"]
            elif db_upper == "POSTGRES_DB":
                return ["PUBLIC", "APPLICATION"]
            elif db_upper == "ANALYTICS_DB":
                return ["BI_LAYERS", "AUDIT"]
            else:
                return ["PUBLIC", "ANALYTICS", "STAGING"]
        
        if self.active_platform == "SNOWFLAKE" and self.conn_snowflake:
            try:
                cur = self.conn_snowflake.cursor()
                cur.execute(f"SHOW SCHEMAS IN DATABASE {db_name}")
                rows = cur.fetchall()
                cur.close()
                return [row[1] for row in rows]
            except Exception as e:
                print(f"Error fetching Snowflake schemas: {e}")
                return ["PUBLIC"]
        elif self.active_platform == "REDSHIFT" and self.conn_redshift:
            try:
                cur = self.conn_redshift.cursor()
                cur.execute("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'")
                rows = cur.fetchall()
                cur.close()
                return [row[0] for row in rows]
            except Exception as e:
                print(f"Error fetching Redshift schemas: {e}")
                return ["public"]
        elif self.active_platform == "POSTGRESQL" and self.conn_postgresql:
            try:
                cur = self.conn_postgresql.cursor()
                cur.execute("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'")
                rows = cur.fetchall()
                cur.close()
                return [row[0] for row in rows]
            except Exception as e:
                print(f"Error fetching PostgreSQL schemas: {e}")
                return ["public"]
        return ["PUBLIC"]

    def get_tables(self, db_name: str, schema_name: str, table_type: str = "ALL"):
        target_type = table_type.upper()
        if self.use_mock:
            try:
                conn = sqlite3.connect(self.db_path)
                query = f"SELECT table_name FROM INFORMATION_SCHEMA_TABLES WHERE table_catalog = '{db_name.upper()}' AND table_schema = '{schema_name.upper()}'"
                if target_type == "TABLE":
                    query += " AND table_type = 'BASE TABLE'"
                elif target_type == "VIEW":
                    query += " AND table_type = 'VIEW'"
                df = pd.read_sql_query(query, conn)
                conn.close()
                return list(df["TABLE_NAME"])
            except Exception as e:
                print(f"Error in mock tables query: {e}")
                return []
        
        if self.active_platform == "SNOWFLAKE" and self.conn_snowflake:
            try:
                cur = self.conn_snowflake.cursor()
                tables = []
                if target_type in ("TABLE", "ALL"):
                    try:
                        cur.execute(f"SHOW TABLES IN SCHEMA \"{db_name.upper()}\".\"{schema_name.upper()}\"")
                        tables.extend([row[1] for row in cur.fetchall()])
                    except Exception as tbl_err:
                        print(f"Error showing Snowflake tables: {tbl_err}")
                if target_type in ("VIEW", "ALL"):
                    try:
                        cur.execute(f"SHOW VIEWS IN SCHEMA \"{db_name.upper()}\".\"{schema_name.upper()}\"")
                        tables.extend([row[1] for row in cur.fetchall()])
                    except Exception as view_err:
                        print(f"Error showing Snowflake views: {view_err}")
                cur.close()
                return sorted(list(set(tables)))
            except Exception as e:
                print(f"Error fetching Snowflake tables: {e}")
                return []
        elif self.active_platform == "REDSHIFT" and self.conn_redshift:
            try:
                cur = self.conn_redshift.cursor()
                query = f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema_name.lower()}'"
                if target_type == "TABLE":
                    query += " AND table_type = 'BASE TABLE'"
                elif target_type == "VIEW":
                    query += " AND table_type = 'VIEW'"
                cur.execute(query)
                rows = cur.fetchall()
                cur.close()
                return [row[0] for row in rows]
            except Exception as e:
                print(f"Error fetching Redshift tables: {e}")
                return []
        elif self.active_platform == "POSTGRESQL" and self.conn_postgresql:
            try:
                cur = self.conn_postgresql.cursor()
                query = f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema_name.lower()}'"
                if target_type == "TABLE":
                    query += " AND table_type = 'BASE TABLE'"
                elif target_type == "VIEW":
                    query += " AND table_type = 'VIEW'"
                cur.execute(query)
                rows = cur.fetchall()
                cur.close()
                return [row[0] for row in rows]
            except Exception as e:
                print(f"Error fetching PostgreSQL tables: {e}")
                return []
        return []


    def execute_query(self, query: str):
        """Executes a query on the active platform. Mock execution is only used in mock mode or for local app tables."""
        lower_q = query.lower()
        
        # Route queries targeting local mock-only tables directly to mock execution
        mock_tables = ["incident_logs", "data_quality_metrics", "rag_documents"]
        if any(tbl in lower_q for tbl in mock_tables):
            return self.execute_mock_query(query)
            
        if self.use_mock:
            return self.execute_mock_query(query)
            
        if self.active_platform == "SNOWFLAKE":
            if self.conn_snowflake is None:
                return {"success": False, "error": "No active Snowflake connection. Reconnect or switch to mock mode explicitly."}
            return self.execute_snowflake_query(query)
            
        elif self.active_platform == "REDSHIFT":
            if "query_history" in lower_q or "warehouse_metering_history" in lower_q:
                return {"success": False, "error": "Snowflake ACCOUNT_USAGE cost views are not available on Redshift."}
            if self.conn_redshift is None:
                return {"success": False, "error": "No active Redshift connection. Reconnect or switch to mock mode explicitly."}
            return self.execute_redshift_query(query)
            
        elif self.active_platform == "POSTGRESQL":
            if "query_history" in lower_q or "warehouse_metering_history" in lower_q:
                return {"success": False, "error": "Snowflake ACCOUNT_USAGE cost views are not available on PostgreSQL."}
            if self.conn_postgresql is None:
                return {"success": False, "error": "No active PostgreSQL connection. Reconnect or switch to mock mode explicitly."}
            return self.execute_postgresql_query(query)
            
        return {"success": False, "error": f"Unsupported active platform: {self.active_platform}"}

    def execute_snowflake_query(self, query: str):
        try:
            cur = self.conn_snowflake.cursor()
            cur.execute(query)
            cols = [col[0] for col in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            df = pd.DataFrame(rows, columns=cols)
            df = df.replace([float('inf'), float('-inf')], None)
            df = df.astype(object).where(pd.notnull(df), None)
            cur.close()
            return {
                "success": True,
                "columns": cols,
                "data": df.to_dict(orient="records"),
                "row_count": len(df),
                "source": "Snowflake"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "source": "Snowflake"
            }

    def execute_redshift_query(self, query: str):
        try:
            cur = self.conn_redshift.cursor()
            cur.execute(query)
            cols = [col[0] for col in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            df = pd.DataFrame(rows, columns=cols)
            df = df.replace([float('inf'), float('-inf')], None)
            df = df.astype(object).where(pd.notnull(df), None)
            cur.close()
            return {
                "success": True,
                "columns": cols,
                "data": df.to_dict(orient="records"),
                "row_count": len(df),
                "source": "Amazon Redshift"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "source": "Amazon Redshift"
            }

    def execute_postgresql_query(self, query: str):
        try:
            cur = self.conn_postgresql.cursor()
            cur.execute(query)
            cols = [col[0] for col in cur.description] if cur.description else []
            rows = cur.fetchall() if cur.description else []
            df = pd.DataFrame(rows, columns=cols)
            df = df.replace([float('inf'), float('-inf')], None)
            df = df.astype(object).where(pd.notnull(df), None)
            cur.close()
            return {
                "success": True,
                "columns": cols,
                "data": df.to_dict(orient="records"),
                "row_count": len(df),
                "source": "PostgreSQL"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "source": "PostgreSQL"
            }

    def execute_mock_query(self, query: str):
        # Normalize and map common tables from Snowflake names to SQLite names
        norm_query = query
        
        # Strip Snowflake 3-part and 2-part prefixes for SQLite mock execution
        import re
        prefixes = [
            r"\bDEMO_DB\.PUBLIC\.",
            r"\bDEMO_DB\.ANALYTICS\.",
            r"\bDEMO_DB\.STAGING\.",
            r"\bENTERPRISE_DATA_HUB\.FINANCIALS\.",
            r"\bENTERPRISE_DATA_HUB\.LOGISTICS\.",
            r"\bREDSHIFT_DEV\.SALES\.",
            r"\bREDSHIFT_DEV\.MARKETING\.",
            r"\bAWS_DATA_LAKE\.LOGS\.",
            r"\bAWS_DATA_LAKE\.S3_STAGING\.",
            r"\bPOSTGRES_DB\.PUBLIC\.",
            r"\bPOSTGRES_DB\.APPLICATION\.",
            r"\bANALYTICS_DB\.BI_LAYERS\.",
            r"\bANALYTICS_DB\.AUDIT\.",
            r"\bPUBLIC\.",
            r"\bANALYTICS\.",
            r"\bSTAGING\.",
            r"\bFINANCIALS\.",
            r"\bLOGISTICS\.",
            r"\bSALES\.",
            r"\bMARKETING\.",
            r"\bLOGS\.",
            r"\bS3_STAGING\.",
            r"\bAPPLICATION\.",
            r"\bBI_LAYERS\.",
            r"\bAUDIT\."
        ]
        for prefix_pat in prefixes:
            norm_query = re.sub(prefix_pat, "", norm_query, flags=re.IGNORECASE)
        
        # Simple string replacements to map query objects (sorted by length descending)
        replacements = {
            "snowflake.account_usage.query_history": "QUERY_HISTORY",
            "account_usage.query_history": "QUERY_HISTORY",
            "query_history": "QUERY_HISTORY",
            "snowflake.account_usage.warehouse_metering_history": "WAREHOUSE_METERING_HISTORY",
            "account_usage.warehouse_metering_history": "WAREHOUSE_METERING_HISTORY",
            "warehouse_metering_history": "WAREHOUSE_METERING_HISTORY",
            "snowflake.account_usage.grants_to_roles": "ACCESS_CONTROL",
            "account_usage.grants_to_roles": "ACCESS_CONTROL",
            "grants_to_roles": "ACCESS_CONTROL",
            "access_control": "ACCESS_CONTROL",
            "information_schema.tables": "INFORMATION_SCHEMA_TABLES",
            "information_schema.columns": "INFORMATION_SCHEMA_COLUMNS",
            "customer": "MOCK_CUSTOMER",
            "orders": "MOCK_ORDERS",
            "lineitem": "MOCK_LINEITEM",
            "invoices": "MOCK_INVOICES",
            "payments": "MOCK_PAYMENTS",
            "shipments": "MOCK_SHIPMENTS",
            "warehouses": "MOCK_WAREHOUSES",
            "tickit_users": "MOCK_TICKIT_USERS",
            "tickit_sales": "MOCK_TICKIT_SALES",
            "tickit_event": "MOCK_TICKIT_EVENT",
            "campaigns": "MOCK_CAMPAIGNS",
            "leads": "MOCK_LEADS",
            "app_users": "MOCK_APP_USERS",
            "app_events": "MOCK_APP_EVENTS",
            "app_products": "MOCK_APP_PRODUCTS",
            "data_quality_metrics": "DATA_QUALITY_METRICS",
            "incident_logs": "INCIDENT_LOGS",
            "rag_documents": "RAG_DOCUMENTS"
        }
        
        for k, v in sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True):
            if k in norm_query.lower():
                insens = re.compile(re.escape(k), re.IGNORECASE)
                norm_query = insens.sub(v, norm_query)

        # Cleanup residual namespace schemas
        norm_query = norm_query.replace("snowflake.account_usage.", "").replace("account_usage.", "")
        norm_query = norm_query.replace("information_schema.", "")

        try:
            conn = sqlite3.connect(self.db_path)
            # Register LOWER function or others if needed
            df = pd.read_sql_query(norm_query, conn)
            df = df.replace([float('inf'), float('-inf')], None)
            df = df.astype(object).where(pd.notnull(df), None)
            conn.close()
            return {
                "success": True,
                "columns": list(df.columns),
                "data": df.to_dict(orient="records"),
                "row_count": len(df),
                "source": "Mock Database (SQLite)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query_attempted": norm_query,
                "source": "Mock Database (SQLite)"
            }

    def init_mock_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 1. Mock Customer Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_CUSTOMER (
            CUSTOMER_ID INTEGER PRIMARY KEY,
            NAME TEXT,
            EMAIL TEXT,
            PHONE TEXT,
            STATE TEXT,
            STATUS TEXT,
            CREATED_DATE TEXT
        )""")

        # 2. Mock Orders Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_ORDERS (
            ORDER_ID INTEGER PRIMARY KEY,
            CUSTOMER_ID INTEGER,
            ORDER_DATE TEXT,
            AMOUNT REAL,
            STATUS TEXT,
            WAREHOUSE_ID TEXT
        )""")

        # 3. Mock Lineitem Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_LINEITEM (
            ITEM_ID INTEGER PRIMARY KEY,
            ORDER_ID INTEGER,
            PRODUCT_NAME TEXT,
            QUANTITY INTEGER,
            PRICE REAL
        )""")

        # 4. Information Schema Tables
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS INFORMATION_SCHEMA_TABLES (
            TABLE_CATALOG TEXT,
            TABLE_SCHEMA TEXT,
            TABLE_NAME TEXT,
            ROW_COUNT INTEGER,
            BYTES INTEGER,
            OWNER TEXT,
            DESCRIPTION TEXT,
            TABLE_TYPE TEXT
        )""")
        try:
            cursor.execute("ALTER TABLE INFORMATION_SCHEMA_TABLES ADD COLUMN TABLE_TYPE TEXT")
        except sqlite3.OperationalError:
            pass

        # 5. Information Schema Columns
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS INFORMATION_SCHEMA_COLUMNS (
            TABLE_CATALOG TEXT,
            TABLE_SCHEMA TEXT,
            TABLE_NAME TEXT,
            COLUMN_NAME TEXT,
            DATA_TYPE TEXT,
            IS_NULLABLE TEXT,
            DESCRIPTION TEXT,
            DATA_OWNER TEXT
        )""")

        # 6. Access Control
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ACCESS_CONTROL (
            OBJECT_TYPE TEXT,
            OBJECT_NAME TEXT,
            ROLE TEXT,
            PRIVILEGE TEXT,
            GRANTED_BY TEXT,
            GRANTED_TO_USER TEXT
        )""")

        # 7. Query History
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS QUERY_HISTORY (
            QUERY_ID TEXT PRIMARY KEY,
            QUERY_TEXT TEXT,
            USER_NAME TEXT,
            ROLE_NAME TEXT,
            WAREHOUSE_NAME TEXT,
            EXECUTION_STATUS TEXT,
            ERROR_CODE TEXT,
            ERROR_MESSAGE TEXT,
            START_TIME TEXT,
            END_TIME TEXT,
            TOTAL_ELAPSED_TIME REAL,
            CREDITS_USED REAL
        )""")

        # 8. Warehouse Metering History
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS WAREHOUSE_METERING_HISTORY (
            START_TIME TEXT,
            END_TIME TEXT,
            WAREHOUSE_NAME TEXT,
            CREDITS_USED REAL,
            CREDITS_USED_COMPUTE REAL,
            CREDITS_USED_CLOUD REAL
        )""")

        # 9. Data Quality Metrics
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS DATA_QUALITY_METRICS (
            TABLE_NAME TEXT,
            COLUMN_NAME TEXT,
            CHECK_NAME TEXT,
            CHECK_STATUS TEXT,
            FAIL_COUNT INTEGER,
            TOTAL_COUNT INTEGER,
            LAST_RUN TEXT
        )""")

        # 10. RAG Documents
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS RAG_DOCUMENTS (
            TITLE TEXT,
            SOURCE_TYPE TEXT,
            CONTENT TEXT,
            METADATA TEXT
        )""")

        # 11. Incident Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS INCIDENT_LOGS (
            INCIDENT_ID TEXT PRIMARY KEY,
            INCIDENT_TIME TEXT,
            PIPELINE_NAME TEXT,
            STATUS TEXT,
            ERROR_MESSAGE TEXT,
            ROOT_CAUSE TEXT,
            RESOLUTION TEXT
        )""")

        # 12. Mock Invoices Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_INVOICES (
            INVOICE_ID INTEGER PRIMARY KEY,
            AMOUNT REAL,
            DUE_DATE TEXT
        )""")

        # 13. Mock Payments Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_PAYMENTS (
            PAYMENT_ID INTEGER PRIMARY KEY,
            INVOICE_ID INTEGER,
            METHOD TEXT
        )""")

        # 14. Mock Shipments Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_SHIPMENTS (
            SHIPMENT_ID INTEGER PRIMARY KEY,
            ORDER_ID INTEGER,
            STATUS TEXT,
            SHIP_DATE TEXT
        )""")

        # 15. Mock Warehouses Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_WAREHOUSES (
            WAREHOUSE_ID TEXT PRIMARY KEY,
            LOCATION TEXT,
            CAPACITY INTEGER
        )""")

        # 16. Mock Redshift Tickit Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_TICKIT_USERS (
            USER_ID INTEGER PRIMARY KEY,
            USERNAME TEXT,
            STATE TEXT,
            EMAIL TEXT
        )""")

        # 17. Mock Redshift Tickit Sales
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_TICKIT_SALES (
            SALES_ID INTEGER PRIMARY KEY,
            PRICEPAID REAL,
            SALETIME TEXT
        )""")

        # 18. Mock Redshift Tickit Event
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_TICKIT_EVENT (
            EVENT_ID INTEGER PRIMARY KEY,
            EVENTNAME TEXT,
            STARTTIME TEXT
        )""")

        # 19. Mock Redshift Campaigns
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_CAMPAIGNS (
            CAMPAIGN_ID INTEGER PRIMARY KEY,
            NAME TEXT,
            STATUS TEXT
        )""")

        # 20. Mock Redshift Leads
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_LEADS (
            LEAD_ID INTEGER PRIMARY KEY,
            CAMPAIGN_ID INTEGER,
            EMAIL TEXT
        )""")

        # 21. Mock Postgres App Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_APP_USERS (
            USER_ID INTEGER PRIMARY KEY,
            EMAIL TEXT,
            STATE TEXT
        )""")

        # 22. Mock Postgres App Events
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_APP_EVENTS (
            EVENT_ID INTEGER PRIMARY KEY,
            USER_ID INTEGER,
            EVENT_DATE TEXT
        )""")

        # 23. Mock Postgres App Products
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MOCK_APP_PRODUCTS (
            PRODUCT_ID INTEGER PRIMARY KEY,
            NAME TEXT,
            STATUS TEXT
        )""")

        conn.commit()

        # Seed data check
        cursor.execute("SELECT COUNT(*) FROM MOCK_CUSTOMER")
        if cursor.fetchone()[0] == 0:
            self.seed_mock_data(cursor)

        conn.commit()
        conn.close()

    def seed_mock_data(self, cursor):
        # Seed Customer
        customers = [
            (101, 'Acme Corp', 'contact@acme.com', '555-0192', 'CA', 'ACTIVE', '2025-01-15'),
            (102, 'Apex Enterprises', 'billing@apex.org', '555-0248', 'TX', 'ACTIVE', '2025-02-10'),
            (103, 'Global Logistics', 'info@globallogistics.com', '555-1923', 'NY', 'ACTIVE', '2025-03-01'),
            (104, 'Delta Services', 'support@delta.net', '555-9831', 'CA', 'INACTIVE', '2024-11-20'),
            (105, 'Quantum Labs', 'research@quantum.edu', '555-7281', 'MA', 'ACTIVE', '2025-04-12'),
            (106, 'Starlight Retail', 'sales@starlight.com', '555-4432', 'FL', 'INACTIVE', '2024-12-05'),
            (107, 'Nova Financial', 'admin@novafin.com', '555-0019', 'NY', 'ACTIVE', '2025-05-18')
        ]
        cursor.executemany("INSERT INTO MOCK_CUSTOMER VALUES (?,?,?,?,?,?,?)", customers)

        # Seed Orders
        orders = [
            (1001, 101, '2026-06-01', 12500.00, 'DELIVERED', 'WH_LOAD_LARGE'),
            (1002, 101, '2026-06-10', 4300.00, 'COMPLETED', 'WH_LOAD_LARGE'),
            (1003, 102, '2026-06-02', 8900.50, 'COMPLETED', 'WH_BI_MEDIUM'),
            (1004, 103, '2026-06-03', 24500.00, 'COMPLETED', 'WH_ELT_XL'),
            (1005, 105, '2026-06-05', 300.00, 'COMPLETED', 'WH_BI_MEDIUM'),
            (1006, 107, '2026-06-08', 15400.00, 'SHIPPED', 'WH_LOAD_LARGE'),
            (1007, 102, '2026-06-11', 1200.00, 'PROCESSING', 'WH_BI_MEDIUM'),
            (1008, 101, '2026-05-15', 7500.00, 'COMPLETED', 'WH_LOAD_LARGE'),
            (1009, 103, '2026-05-20', 32000.00, 'COMPLETED', 'WH_ELT_XL'),
            (1010, 105, '2026-04-10', 5000.00, 'COMPLETED', 'WH_BI_MEDIUM')
        ]
        cursor.executemany("INSERT INTO MOCK_ORDERS VALUES (?,?,?,?,?,?)", orders)

        # Seed Lineitems
        lineitems = [
            (1, 1001, 'Enterprise Cloud Suite', 1, 12500.00),
            (2, 1002, 'Consulting Block Hours', 10, 400.00),
            (3, 1002, 'Support Retainer SLA', 1, 300.00),
            (4, 1003, 'Data Warehousing Nodes', 4, 2000.00),
            (5, 1003, 'Data Pipeline Licences', 3, 300.16),
            (6, 1004, 'Bulk Loading ETL License', 1, 24500.00),
            (7, 1005, 'API Gateway Access', 100, 3.00),
            (8, 1006, 'BI Visualization Users', 154, 100.00),
            (9, 1007, 'BI Analyst Core license', 1, 1200.00)
        ]
        cursor.executemany("INSERT INTO MOCK_LINEITEM VALUES (?,?,?,?,?)", lineitems)

        # Seed Information Schema Tables
        tables = [
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 7, 4096, 'ROLE_DATA_ENG', 'Main customer information containing demographics and contact details.', 'BASE TABLE'),
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 10, 8192, 'ROLE_DATA_ENG', 'Sales orders database detailing purchase amounts and statuses.', 'BASE TABLE'),
            ('DEMO_DB', 'PUBLIC', 'LINEITEM', 9, 8192, 'ROLE_DATA_ENG', 'Granular list of items inside each customer purchase order.', 'BASE TABLE'),
            ('DEMO_DB', 'ANALYTICS', 'CUSTOMER_LTV', 7, 2048, 'ROLE_BI_ANALYST', 'Aggregated lifetime value metrics per customer.', 'VIEW'),
            ('DEMO_DB', 'ANALYTICS', 'MONTHLY_REVENUE', 12, 1024, 'ROLE_BI_ANALYST', 'Aggregated operational revenue trends grouped by month.', 'VIEW'),
            ('DEMO_DB', 'STAGING', 'RAW_LOGINS', 14205, 5242880, 'ROLE_SECURITY_ADMIN', 'Raw access logs mapping customer logins and sessions.', 'BASE TABLE'),
            
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'INVOICES', 150, 65536, 'ROLE_FINANCE', 'Enterprise customer invoice ledgers.', 'BASE TABLE'),
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'PAYMENTS', 142, 32768, 'ROLE_FINANCE', 'Historical payment ledger logs.', 'BASE TABLE'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'SHIPMENTS', 95, 16384, 'ROLE_LOGISTICS', 'Logistics shipping status trackers.', 'BASE TABLE'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'WAREHOUSES', 4, 1024, 'ROLE_LOGISTICS', 'Inventory warehouses locations metadata.', 'BASE TABLE'),

            ('REDSHIFT_DEV', 'SALES', 'TICKIT_USERS', 12, 2048, 'ROLE_SALES_ANALYST', 'Redshift Tickit users list.', 'BASE TABLE'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_SALES', 15, 4096, 'ROLE_SALES_ANALYST', 'Redshift Tickit transaction ledger.', 'BASE TABLE'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_EVENT', 8, 2048, 'ROLE_SALES_ANALYST', 'Redshift Tickit events information.', 'BASE TABLE'),
            ('REDSHIFT_DEV', 'MARKETING', 'CAMPAIGNS', 5, 1024, 'ROLE_MARKETING', 'Redshift marketing campaigns list.', 'BASE TABLE'),
            ('REDSHIFT_DEV', 'MARKETING', 'LEADS', 10, 2048, 'ROLE_MARKETING', 'Redshift leads contact registry.', 'BASE TABLE'),
            
            ('POSTGRES_DB', 'PUBLIC', 'APP_USERS', 12, 2048, 'ROLE_APP_OWNER', 'Postgres application registered users.', 'BASE TABLE'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_EVENTS', 18, 4096, 'ROLE_APP_OWNER', 'Postgres user action logs database.', 'BASE TABLE'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_PRODUCTS', 5, 1024, 'ROLE_APP_OWNER', 'Postgres commercial inventory products.', 'BASE TABLE')
        ]
        cursor.execute("DELETE FROM INFORMATION_SCHEMA_TABLES")
        cursor.executemany("INSERT INTO INFORMATION_SCHEMA_TABLES VALUES (?,?,?,?,?,?,?,?)", tables)

        # Seed Information Schema Columns
        columns = [
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'CUSTOMER_ID', 'INTEGER', 'NO', 'Unique identifying primary key for each customer.', 'Sathish (Data Arch)'),
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'NAME', 'VARCHAR', 'NO', 'Corporate or individual legal name.', 'Sales Ops'),
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'EMAIL', 'VARCHAR', 'YES', 'Primary billing and communication email address.', 'Sales Ops'),
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'PHONE', 'VARCHAR', 'YES', 'Standard formatting phone number.', 'Sales Ops'),
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'STATE', 'VARCHAR', 'YES', 'US State code where customer is headquartered.', 'Sales Ops'),
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'STATUS', 'VARCHAR', 'NO', 'Operational state: ACTIVE, INACTIVE, SUSPENDED.', 'Customer Success'),
            ('DEMO_DB', 'PUBLIC', 'CUSTOMER', 'CREATED_DATE', 'DATE', 'NO', 'Timestamp of record initialization.', 'Sathish (Data Arch)'),
            
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 'ORDER_ID', 'INTEGER', 'NO', 'Primary key identifier for sales transactions.', 'Sathish (Data Arch)'),
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 'CUSTOMER_ID', 'INTEGER', 'NO', 'Foreign key referencing CUSTOMER table.', 'Sathish (Data Arch)'),
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 'ORDER_DATE', 'DATE', 'NO', 'Calendar date of the purchase request.', 'Finance'),
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 'AMOUNT', 'DECIMAL', 'NO', 'Total monetary sum of the order in USD.', 'Finance'),
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 'STATUS', 'VARCHAR', 'NO', 'Transaction state: COMPLETED, PENDING, SHIPPED, DELIVERED.', 'Finance'),
            ('DEMO_DB', 'PUBLIC', 'ORDERS', 'WAREHOUSE_ID', 'VARCHAR', 'YES', 'Reference to the Snowflake Warehouse cluster running loading logic.', 'Sathish (Data Arch)'),
            
            ('DEMO_DB', 'ANALYTICS', 'CUSTOMER_LTV', 'CUSTOMER_ID', 'INTEGER', 'NO', 'Reference keys to base table.', 'Sathish (Data Arch)'),
            ('DEMO_DB', 'ANALYTICS', 'CUSTOMER_LTV', 'TOTAL_SPENT', 'DECIMAL', 'YES', 'Sum total spent across all orders.', 'Finance'),
            ('DEMO_DB', 'ANALYTICS', 'CUSTOMER_LTV', 'LAST_ACTIVE', 'DATE', 'YES', 'Latest order date from transactions.', 'Finance'),
            
            ('DEMO_DB', 'PUBLIC', 'LINEITEM', 'ITEM_ID', 'INTEGER', 'NO', 'Primary key identifying line record.', 'Sathish (Data Arch)'),
            ('DEMO_DB', 'PUBLIC', 'LINEITEM', 'ORDER_ID', 'INTEGER', 'NO', 'Foreign key mapping back to ORDERS.', 'Sathish (Data Arch)'),
            ('DEMO_DB', 'PUBLIC', 'LINEITEM', 'PRODUCT_NAME', 'VARCHAR', 'NO', 'Item description name.', 'Product Ops'),
            ('DEMO_DB', 'PUBLIC', 'LINEITEM', 'QUANTITY', 'INTEGER', 'NO', 'Quantity count ordered.', 'Product Ops'),
            ('DEMO_DB', 'PUBLIC', 'LINEITEM', 'PRICE', 'DECIMAL', 'NO', 'Individual item price listing.', 'Product Ops'),
            
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'INVOICES', 'INVOICE_ID', 'INTEGER', 'NO', 'Unique identifying primary key for each invoice.', 'Finance System'),
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'INVOICES', 'AMOUNT', 'DECIMAL', 'NO', 'Total monetary invoice sum in USD.', 'Finance Admin'),
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'INVOICES', 'DUE_DATE', 'DATE', 'NO', 'Calendar date of invoice maturity.', 'Finance Admin'),
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'PAYMENTS', 'PAYMENT_ID', 'INTEGER', 'NO', 'Primary key identifier for payments.', 'Treasury'),
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'PAYMENTS', 'INVOICE_ID', 'INTEGER', 'NO', 'Foreign key reference to invoices table.', 'Treasury'),
            ('ENTERPRISE_DATA_HUB', 'FINANCIALS', 'PAYMENTS', 'METHOD', 'VARCHAR', 'NO', 'Payment method: ACH, WIRE, CARD.', 'Treasury'),
            
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'SHIPMENTS', 'SHIPMENT_ID', 'INTEGER', 'NO', 'Unique identifier for shipments.', 'Logistics Admin'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'SHIPMENTS', 'ORDER_ID', 'INTEGER', 'NO', 'Reference to order ID.', 'Logistics Admin'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'SHIPMENTS', 'STATUS', 'VARCHAR', 'NO', 'Current shipment status: SHIPPED, DELIVERED, IN_TRANSIT.', 'Logistics Admin'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'SHIPMENTS', 'SHIP_DATE', 'DATE', 'YES', 'Calendar date of shipping.', 'Logistics Admin'),
            
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'WAREHOUSES', 'WAREHOUSE_ID', 'VARCHAR', 'NO', 'Unique warehouse identifier.', 'Logistics Admin'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'WAREHOUSES', 'LOCATION', 'VARCHAR', 'NO', 'Geographic location region.', 'Logistics Admin'),
            ('ENTERPRISE_DATA_HUB', 'LOGISTICS', 'WAREHOUSES', 'CAPACITY', 'INTEGER', 'YES', 'Total stock capacity count.', 'Logistics Admin'),

            ('REDSHIFT_DEV', 'SALES', 'TICKIT_USERS', 'USER_ID', 'INTEGER', 'NO', 'Unique identifying primary key for each Redshift user.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_USERS', 'USERNAME', 'VARCHAR', 'NO', 'User login profile handle.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_USERS', 'STATE', 'VARCHAR', 'YES', 'US State code where user resides.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_USERS', 'EMAIL', 'VARCHAR', 'YES', 'Primary user registration email address.', 'AWS Admin'),

            ('REDSHIFT_DEV', 'SALES', 'TICKIT_SALES', 'SALES_ID', 'INTEGER', 'NO', 'Transaction purchase sales ticket identifier.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_SALES', 'PRICEPAID', 'DECIMAL', 'NO', 'Total cost paid for the sales tickets in USD.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_SALES', 'SALETIME', 'DATE', 'NO', 'Calendar date of execution.', 'AWS Admin'),

            ('REDSHIFT_DEV', 'SALES', 'TICKIT_EVENT', 'EVENT_ID', 'INTEGER', 'NO', 'Event index key.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_EVENT', 'EVENTNAME', 'VARCHAR', 'NO', 'Official name of concert, play, or sports game.', 'AWS Admin'),
            ('REDSHIFT_DEV', 'SALES', 'TICKIT_EVENT', 'STARTTIME', 'DATE', 'NO', 'Scheduled event kickoff datetime.', 'AWS Admin'),

            ('REDSHIFT_DEV', 'MARKETING', 'CAMPAIGNS', 'CAMPAIGN_ID', 'INTEGER', 'NO', 'Marketing promotional identifier key.', 'Marketing Ops'),
            ('REDSHIFT_DEV', 'MARKETING', 'CAMPAIGNS', 'NAME', 'VARCHAR', 'NO', 'Campaign project code name.', 'Marketing Ops'),
            ('REDSHIFT_DEV', 'MARKETING', 'CAMPAIGNS', 'STATUS', 'VARCHAR', 'NO', 'Operational campaign state: ACTIVE, INACTIVE, SUSPENDED.', 'Marketing Ops'),

            ('REDSHIFT_DEV', 'MARKETING', 'LEADS', 'LEAD_ID', 'INTEGER', 'NO', 'Leads ingestion key.', 'Marketing Ops'),
            ('REDSHIFT_DEV', 'MARKETING', 'LEADS', 'CAMPAIGN_ID', 'INTEGER', 'NO', 'Foreign key mapping back to campaign.', 'Marketing Ops'),
            ('REDSHIFT_DEV', 'MARKETING', 'LEADS', 'EMAIL', 'VARCHAR', 'YES', 'Lead record contact email address.', 'Marketing Ops'),

            ('POSTGRES_DB', 'PUBLIC', 'APP_USERS', 'USER_ID', 'INTEGER', 'NO', 'Registered customer user account ID.', 'DBA Admin'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_USERS', 'EMAIL', 'VARCHAR', 'NO', 'Registered user login email address.', 'DBA Admin'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_USERS', 'STATE', 'VARCHAR', 'YES', 'US State code where account was initialized.', 'DBA Admin'),

            ('POSTGRES_DB', 'PUBLIC', 'APP_EVENTS', 'EVENT_ID', 'INTEGER', 'NO', 'Click event action log ID.', 'DBA Admin'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_EVENTS', 'USER_ID', 'INTEGER', 'NO', 'Foreign key mapping back to App User.', 'DBA Admin'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_EVENTS', 'EVENT_DATE', 'DATE', 'NO', 'Click action execution calendar date.', 'DBA Admin'),

            ('POSTGRES_DB', 'PUBLIC', 'APP_PRODUCTS', 'PRODUCT_ID', 'INTEGER', 'NO', 'Unique stock keeping product inventory ID.', 'Product Ops'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_PRODUCTS', 'NAME', 'VARCHAR', 'NO', 'Inventory retail product description name.', 'Product Ops'),
            ('POSTGRES_DB', 'PUBLIC', 'APP_PRODUCTS', 'STATUS', 'VARCHAR', 'NO', 'Inventory catalog availability: ACTIVE, OUT_OF_STOCK, INACTIVE.', 'Product Ops')
        ]
        cursor.executemany("INSERT INTO INFORMATION_SCHEMA_COLUMNS VALUES (?,?,?,?,?,?,?,?)", columns)

        # Seed Access Control
        grants = [
            ('TABLE', 'CUSTOMER', 'ROLE_DATA_ENG', 'ALL', 'SECURITYADMIN', 'Sathish'),
            ('TABLE', 'CUSTOMER', 'ROLE_BI_ANALYST', 'SELECT', 'ROLE_DATA_ENG', 'John'),
            ('TABLE', 'CUSTOMER', 'ROLE_MARKETING', 'SELECT', 'ROLE_DATA_ENG', 'Emma'),
            ('TABLE', 'ORDERS', 'ROLE_DATA_ENG', 'ALL', 'SECURITYADMIN', 'Sathish'),
            ('TABLE', 'ORDERS', 'ROLE_BI_ANALYST', 'SELECT', 'ROLE_DATA_ENG', 'John'),
            ('TABLE', 'ORDERS', 'ROLE_FINANCE', 'ALL', 'SECURITYADMIN', 'Robert'),
            ('SCHEMA', 'PUBLIC', 'ROLE_DATA_ENG', 'USAGE', 'SECURITYADMIN', 'Sathish'),
            ('SCHEMA', 'PUBLIC', 'ROLE_BI_ANALYST', 'USAGE', 'SECURITYADMIN', 'John'),
            ('SCHEMA', 'ANALYTICS', 'ROLE_BI_ANALYST', 'ALL', 'SECURITYADMIN', 'John'),
            ('SCHEMA', 'STAGING', 'ROLE_DATA_ENG', 'ALL', 'SECURITYADMIN', 'Sathish')
        ]
        cursor.executemany("INSERT INTO ACCESS_CONTROL VALUES (?,?,?,?,?,?)", grants)

        # Seed Query History (Last 14 days)
        queries = [
            ('q100912', 'SELECT count(*) FROM customer WHERE state = \'CA\';', 'John', 'ROLE_BI_ANALYST', 'WH_BI_MEDIUM', 'SUCCESS', None, None, '2026-06-12 10:15:30', '2026-06-12 10:15:31', 0.8, 0.05),
            ('q100913', 'SELECT sum(amount), date_trunc(\'month\', order_date) FROM orders GROUP BY 2;', 'John', 'ROLE_BI_ANALYST', 'WH_BI_MEDIUM', 'SUCCESS', None, None, '2026-06-12 11:20:00', '2026-06-12 11:20:04', 4.1, 0.12),
            ('q100914', 'SELECT c.name, sum(o.amount) FROM customer c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY 1 ORDER BY 2 DESC;', 'Emma', 'ROLE_MARKETING', 'WH_BI_MEDIUM', 'SUCCESS', None, None, '2026-06-12 14:02:11', '2026-06-12 14:02:19', 8.2, 0.20),
            ('q100915', 'COPY INTO staging.raw_logins FROM @stage_s3/logins_20260611.json;', 'Sathish', 'ROLE_DATA_ENG', 'WH_ELT_XL', 'SUCCESS', None, None, '2026-06-12 02:00:00', '2026-06-12 02:05:45', 345.0, 16.50),
            ('q100916', 'MERGE INTO customer USING staging.raw_logins ... ON ... WHEN MATCHED THEN UPDATE ...', 'Sathish', 'ROLE_DATA_ENG', 'WH_LOAD_LARGE', 'SUCCESS', None, None, '2026-06-12 02:10:00', '2026-06-12 02:13:30', 210.0, 4.20),
            ('q100917', 'SELECT * FROM staging.raw_logins WHERE customer_id = 9999 LIMIT 10;', 'John', 'ROLE_BI_ANALYST', 'WH_BI_MEDIUM', 'SUCCESS', None, None, '2026-06-12 16:30:15', '2026-06-12 16:30:18', 3.1, 0.08),
            # Inefficient full scan query
            ('q100918', 'SELECT * FROM LINEITEM l JOIN ORDERS o ON l.order_id = o.order_id WHERE o.order_date > \'2023-01-01\';', 'John', 'ROLE_BI_ANALYST', 'WH_BI_MEDIUM', 'SUCCESS', None, None, '2026-06-11 09:12:00', '2026-06-11 09:14:15', 135.0, 3.40),
            # Failed query
            ('q100919', 'SELECT count(*), state_name FROM customer GROUP BY state_name;', 'Emma', 'ROLE_MARKETING', 'WH_BI_MEDIUM', 'FAILED', 'SQL_ERROR_1002', 'SQL Compilation Error: Column \'STATE_NAME\' does not exist.', '2026-06-12 17:45:10', '2026-06-12 17:45:10', 0.1, 0.00)
        ]
        cursor.executemany("INSERT INTO QUERY_HISTORY VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", queries)

        # Seed Warehouse metering history
        metering = []
        whs = ['WH_BI_MEDIUM', 'WH_LOAD_LARGE', 'WH_ELT_XL']
        # Past 7 days
        for day in range(7):
            date_str = (datetime.now() - timedelta(days=day)).strftime("%Y-%m-%d")
            metering.append((date_str + " 00:00:00", date_str + " 23:59:59", 'WH_BI_MEDIUM', 4.5, 4.0, 0.5))
            metering.append((date_str + " 00:00:00", date_str + " 23:59:59", 'WH_LOAD_LARGE', 12.0, 11.2, 0.8))
            metering.append((date_str + " 00:00:00", date_str + " 23:59:59", 'WH_ELT_XL', 32.0, 30.5, 1.5))
        cursor.executemany("INSERT INTO WAREHOUSE_METERING_HISTORY VALUES (?,?,?,?,?,?)", metering)

        # Seed Data Quality Metrics
        dq = [
            ('CUSTOMER', 'CUSTOMER_ID', 'NULL_CHECK', 'PASS', 0, 7, '2026-06-13 06:00:00'),
            ('CUSTOMER', 'CUSTOMER_ID', 'DUPLICATE_CHECK', 'PASS', 0, 7, '2026-06-13 06:00:00'),
            ('CUSTOMER', 'EMAIL', 'NULL_CHECK', 'FAIL', 2, 7, '2026-06-13 06:00:00'),
            ('CUSTOMER', 'STATUS', 'VALID_VALUE_CHECK', 'PASS', 0, 7, '2026-06-13 06:00:00'),
            
            ('ORDERS', 'ORDER_ID', 'NULL_CHECK', 'PASS', 0, 10, '2026-06-13 06:05:00'),
            ('ORDERS', 'ORDER_ID', 'DUPLICATE_CHECK', 'PASS', 0, 10, '2026-06-13 06:05:00'),
            ('ORDERS', 'AMOUNT', 'NEGATIVE_CHECK', 'PASS', 0, 10, '2026-06-13 06:05:00'),
            ('ORDERS', 'CUSTOMER_ID', 'ORPHANED_FOREIGN_KEY', 'PASS', 0, 10, '2026-06-13 06:05:00'),
            
            ('LINEITEM', 'ITEM_ID', 'NULL_CHECK', 'PASS', 0, 9, '2026-06-13 06:10:00'),
            ('LINEITEM', 'PRICE', 'NEGATIVE_CHECK', 'FAIL', 1, 9, '2026-06-13 06:10:00')
        ]
        cursor.executemany("INSERT INTO DATA_QUALITY_METRICS VALUES (?,?,?,?,?,?,?)", dq)

        # Seed RAG documents
        docs = [
            ('Customer Ingestion Pipeline Runbook', 'Confluence', 
             'Customer data is loaded nightly at 02:00 AM UTC via an AWS S3 integration. The RAW logins and updates are saved in STAGING.RAW_LOGINS. A merge statement in main_pipeline.py processes changes, updates existing records in PUBLIC.CUSTOMER, and inserts new records. The pipeline uses the WH_LOAD_LARGE warehouse which automatically suspends after 60 seconds of inactivity to save costs.', 
             '{"author": "Sathish", "version": "2.4", "updated": "2026-04-10"}'),
            
            ('Warehouse Pausing and Auto-Suspend Standards', 'Standard Operating Procedure', 
             'To manage costs, all Snowflake warehouses must have an auto-suspend policy: WH_BI_MEDIUM must suspend after 5 minutes, WH_LOAD_LARGE after 60 seconds, and WH_ELT_XL after 3 minutes. Warehouses are set to auto-resume on incoming queries. Any warehouse found running continuously without active queries will be flagged in the Query Cost Analyzer.', 
             '{"author": "Architecture Board", "status": "Approved", "version": "1.1"}'),
             
            ('Enterprise Data Governance and Owner Policies', 'Standard Operating Procedure', 
             'Tables containing PII (like customer email, phone, and name) must belong to the PUBLIC schema, and SELECT grants are strictly restricted to ROLE_BI_ANALYST and ROLE_MARKETING. Any access audits are logged in ACCOUNT_USAGE.GRANTS_TO_ROLES. Sathish is the primary owner and Data Architect for these core tables.', 
             '{"author": "Data Governance Committee", "version": "3.0", "updated": "2025-11-12"}')
        ]
        cursor.executemany("INSERT INTO RAG_DOCUMENTS VALUES (?,?,?,?)", docs)

        # Seed Incident Logs
        incidents = [
            ('INC-44910', '2026-06-12 02:15:00', 'Nightly Revenue Merge Job', 'RESOLVED', 
             'Merge query failed: SQL Compilation Error: Column STATE_NAME does not exist in STAGING.RAW_LOGINS.',
             'Marketing added a new column "STATE_NAME" to the staging S3 JSON files, causing schema drift. The customer MERGE pipeline was expecting "STATE" and threw a compilation error during execution.',
             'Sathish rolled back S3 stream parser configuration and altered the customer merge query to map STATE_NAME to STATE field safely. Re-ran pipeline successfully at 04:30 AM.'),
            ('INC-44911', '2026-06-13 02:05:00', 'Nightly Revenue Merge Job', 'OPEN',
             'Pipeline delay: ETL queue wait time exceeded 1200 seconds.',
             'The warehouse WH_ELT_XL was locked by a long-running full table scan query (q100918) from an analyst, which blocked the ETL pipeline from obtaining warehouse resources and starting execution.',
             'Investigation in progress. Recommending auto-kill on user queries exceeding 10 minutes in WH_ELT_XL.')
        ]
        cursor.executemany("INSERT INTO INCIDENT_LOGS VALUES (?,?,?,?,?,?,?)", incidents)

        # Seed Invoices
        invoices = [
            (8001, 1200.50, '2026-06-15'),
            (8002, 24500.00, '2026-06-18'),
            (8003, 350.00, '2026-06-20'),
            (8004, 8900.00, '2026-06-22'),
            (8005, 15400.00, '2026-06-25')
        ]
        cursor.executemany("INSERT INTO MOCK_INVOICES VALUES (?,?,?)", invoices)

        # Seed Payments
        payments = [
            (9001, 8001, 'ACH'),
            (9002, 8002, 'WIRE'),
            (9003, 8003, 'CARD'),
            (9004, 8004, 'ACH'),
            (9005, 8005, 'WIRE')
        ]
        cursor.executemany("INSERT INTO MOCK_PAYMENTS VALUES (?,?,?)", payments)

        # Seed Shipments
        shipments = [
            (7001, 1001, 'DELIVERED', '2026-06-03'),
            (7002, 1003, 'IN_TRANSIT', '2026-06-05'),
            (7003, 1006, 'SHIPPED', '2026-06-09'),
            (7004, 1007, 'PROCESSING', '2026-06-12')
        ]
        cursor.executemany("INSERT INTO MOCK_SHIPMENTS VALUES (?,?,?,?)", shipments)

        # Seed Warehouses
        warehouses = [
            ('WH_BI_MEDIUM', 'US-EAST', 100),
            ('WH_LOAD_LARGE', 'US-WEST', 500),
            ('WH_ELT_XL', 'US-EAST', 1000)
        ]
        cursor.executemany("INSERT INTO MOCK_WAREHOUSES VALUES (?,?,?)", warehouses)

        # Seed Redshift Tickit Users
        tickit_users = [
            (201, 'john_doe', 'NY', 'john.doe@example.com'),
            (202, 'alice_smith', 'CA', 'alice@example.com'),
            (203, 'bob_jones', 'TX', 'bob@example.com'),
            (204, 'charlie_brown', 'FL', 'charlie@example.com'),
            (205, 'david_miller', 'WA', 'david@example.com'),
            (206, 'emily_davis', 'IL', 'emily@example.com'),
            (207, 'frank_wilson', 'MA', 'frank@example.com'),
            (208, 'grace_taylor', 'GA', 'grace@example.com'),
            (209, 'henry_thomas', 'MI', 'henry@example.com'),
            (210, 'ivy_jackson', 'OH', 'ivy@example.com'),
            (211, 'jack_white', 'CO', 'jack@example.com'),
            (212, 'karen_black', 'NC', 'karen@example.com')
        ]
        cursor.executemany("INSERT INTO MOCK_TICKIT_USERS VALUES (?,?,?,?)", tickit_users)

        # Seed Redshift Tickit Sales
        tickit_sales = [
            (3001, 150.00, '2026-06-01'),
            (3002, 299.50, '2026-06-02'),
            (3003, 80.00, '2026-06-03'),
            (3004, 450.00, '2026-06-04'),
            (3005, 120.00, '2026-06-05'),
            (3006, 95.00, '2026-06-06'),
            (3007, 310.00, '2026-06-07'),
            (3008, 180.00, '2026-06-08'),
            (3009, 220.00, '2026-06-09'),
            (3010, 60.00, '2026-06-10'),
            (3011, 400.00, '2026-06-11'),
            (3012, 115.00, '2026-06-12'),
            (3013, 275.00, '2026-06-13'),
            (3014, 85.00, '2026-06-14'),
            (3015, 350.00, '2026-06-15')
        ]
        cursor.executemany("INSERT INTO MOCK_TICKIT_SALES VALUES (?,?,?)", tickit_sales)

        # Seed Redshift Tickit Event
        tickit_event = [
            (401, 'Taylor Swift Concert', '2026-06-20'),
            (402, 'Hamilton Musical', '2026-06-22'),
            (403, 'NBA Finals Game 1', '2026-06-25'),
            (404, 'MLB Red Sox vs Yankees', '2026-06-26'),
            (405, 'Coldplay Tour', '2026-06-28'),
            (406, 'Phantom of the Opera', '2026-06-30'),
            (407, 'Super Bowl Event', '2026-07-02'),
            (408, 'Wimbledon Finals', '2026-07-05')
        ]
        cursor.executemany("INSERT INTO MOCK_TICKIT_EVENT VALUES (?,?,?)", tickit_event)

        # Seed Redshift Campaigns
        campaigns = [
            (501, 'Summer Promo 2026', 'ACTIVE'),
            (502, 'Email Newsletter', 'ACTIVE'),
            (503, 'Spring Clearance', 'INACTIVE'),
            (504, 'Retargeting Ad Campaign', 'ACTIVE'),
            (505, 'Holiday Early Bird', 'INACTIVE')
        ]
        cursor.executemany("INSERT INTO MOCK_CAMPAIGNS VALUES (?,?,?)", campaigns)

        # Seed Redshift Leads
        leads = [
            (601, 501, 'lead1@example.com'),
            (602, 501, 'lead2@example.com'),
            (603, 502, 'lead3@example.com'),
            (604, 502, 'lead4@example.com'),
            (605, 503, 'lead5@example.com'),
            (606, 504, 'lead6@example.com'),
            (607, 504, 'lead7@example.com'),
            (608, 504, 'lead8@example.com'),
            (609, 505, 'lead9@example.com'),
            (610, 505, 'lead10@example.com')
        ]
        cursor.executemany("INSERT INTO MOCK_LEADS VALUES (?,?,?)", leads)

        # Seed Postgres App Users
        app_users = [
            (701, 'user1@postgres.org', 'NY'),
            (702, 'user2@postgres.org', 'CA'),
            (703, 'user3@postgres.org', 'TX'),
            (704, 'user4@postgres.org', 'FL'),
            (705, 'user5@postgres.org', 'WA'),
            (706, 'user6@postgres.org', 'MA'),
            (707, 'user7@postgres.org', 'IL'),
            (708, 'user8@postgres.org', 'GA'),
            (709, 'user9@postgres.org', 'CO'),
            (710, 'user10@postgres.org', 'OH'),
            (711, 'user11@postgres.org', 'NC'),
            (712, 'user12@postgres.org', 'MI')
        ]
        cursor.executemany("INSERT INTO MOCK_APP_USERS VALUES (?,?,?)", app_users)

        # Seed Postgres App Events
        app_events = [
            (8001, 701, '2026-06-01'),
            (8002, 701, '2026-06-02'),
            (8003, 702, '2026-06-03'),
            (8004, 703, '2026-06-04'),
            (8005, 704, '2026-06-05'),
            (8006, 705, '2026-06-06'),
            (8007, 706, '2026-06-07'),
            (8008, 707, '2026-06-08'),
            (8009, 708, '2026-06-09'),
            (8010, 709, '2026-06-10'),
            (8011, 710, '2026-06-11'),
            (8012, 711, '2026-06-12'),
            (8013, 712, '2026-06-13'),
            (8014, 701, '2026-06-14'),
            (8015, 702, '2026-06-15'),
            (8016, 703, '2026-06-15'),
            (8017, 704, '2026-06-15'),
            (8018, 705, '2026-06-15')
        ]
        cursor.executemany("INSERT INTO MOCK_APP_EVENTS VALUES (?,?,?)", app_events)

        # Seed Postgres App Products
        app_products = [
            (901, 'Postgres Pro Support Subscription', 'ACTIVE'),
            (902, 'Cloud Hosting Premium Plan', 'ACTIVE'),
            (903, 'Enterprise Migration Tooling License', 'ACTIVE'),
            (904, 'Developer Training E-Book Series', 'OUT_OF_STOCK'),
            (905, 'DB Performance Diagnostics Suite', 'INACTIVE')
        ]
        cursor.executemany("INSERT INTO MOCK_APP_PRODUCTS VALUES (?,?,?)", app_products)

    def add_rag_document(self, title: str, source_type: str, content: str, metadata: dict):
        try:
            import json
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO RAG_DOCUMENTS (TITLE, SOURCE_TYPE, CONTENT, METADATA) VALUES (?, ?, ?, ?)",
                (title, source_type, content, json.dumps(metadata))
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error adding RAG document: {e}")
            return False

    def clear_rag_documents(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM RAG_DOCUMENTS")
            
            # Re-seed the default core RAG documents
            docs = [
                ('Customer Ingestion Pipeline Runbook', 'Confluence', 
                 'Customer data is loaded nightly at 02:00 AM UTC via an AWS S3 integration. The RAW logins and updates are saved in STAGING.RAW_LOGINS. A merge statement in main_pipeline.py processes changes, updates existing records in PUBLIC.CUSTOMER, and inserts new records. The pipeline uses the WH_LOAD_LARGE warehouse which automatically suspends after 60 seconds of inactivity to save costs.', 
                 '{"author": "Sathish", "version": "2.4", "updated": "2026-04-10"}'),
                
                ('Warehouse Pausing and Auto-Suspend Standards', 'Standard Operating Procedure', 
                 'To manage costs, all Snowflake warehouses must have an auto-suspend policy: WH_BI_MEDIUM must suspend after 5 minutes, WH_LOAD_LARGE after 60 seconds, and WH_ELT_XL after 3 minutes. Warehouses are set to auto-resume on incoming queries. Any warehouse found running continuously without active queries will be flagged in the Query Cost Analyzer.', 
                 '{"author": "Architecture Board", "status": "Approved", "version": "1.1"}'),
                 
                ('Enterprise Data Governance and Owner Policies', 'Standard Operating Procedure', 
                 'Tables containing PII (like customer email, phone, and name) must belong to the PUBLIC schema, and SELECT grants are strictly restricted to ROLE_BI_ANALYST and ROLE_MARKETING. Any access audits are logged in ACCOUNT_USAGE.GRANTS_TO_ROLES. Sathish is the primary owner and Data Architect for these core tables.', 
                 '{"author": "Data Governance Committee", "version": "3.0", "updated": "2025-11-12"}')
            ]
            cursor.executemany("INSERT INTO RAG_DOCUMENTS VALUES (?,?,?,?)", docs)
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error clearing RAG documents: {e}")
            return False

    def get_rag_documents_list(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT rowid, TITLE, SOURCE_TYPE, METADATA FROM RAG_DOCUMENTS ORDER BY rowid DESC")
            rows = cursor.fetchall()
            conn.close()
            
            docs = []
            for row in rows:
                meta = {}
                try:
                    import json
                    meta = json.loads(row[3]) if row[3] else {}
                except:
                    pass
                docs.append({
                    "id": row[0],
                    "title": row[1],
                    "source_type": row[2],
                    "metadata": meta
                })
            return docs
        except Exception as e:
            print(f"Error fetching RAG documents: {e}")
            return []

    def get_roles(self):
        if self.use_mock or self.active_platform != "SNOWFLAKE":
            return ["ACCOUNTADMIN", "SYSADMIN", "USERADMIN", "PUBLIC"]
        if self.conn_snowflake:
            try:
                cur = self.conn_snowflake.cursor()
                cur.execute("SHOW ROLES")
                rows = cur.fetchall()
                cur.close()
                return sorted(list(set([row[1] for row in rows])))
            except Exception as e:
                print(f"Error fetching Snowflake roles: {e}")
                try:
                    cur = self.conn_snowflake.cursor()
                    cur.execute("SELECT CURRENT_ROLE()")
                    row = cur.fetchone()
                    cur.close()
                    if row and row[0]:
                        return [row[0]]
                except:
                    pass
                return ["PUBLIC"]
        return ["PUBLIC"]

    def get_warehouses(self):
        if self.use_mock or self.active_platform != "SNOWFLAKE":
            return ["WH_BI_MEDIUM", "WH_LOAD_LARGE", "WH_ELT_XL"]
        if self.conn_snowflake:
            try:
                cur = self.conn_snowflake.cursor()
                cur.execute("SHOW WAREHOUSES")
                rows = cur.fetchall()
                cur.close()
                return sorted(list(set([row[0] for row in rows])))
            except Exception as e:
                print(f"Error fetching Snowflake warehouses: {e}")
                try:
                    cur = self.conn_snowflake.cursor()
                    cur.execute("SELECT CURRENT_WAREHOUSE()")
                    row = cur.fetchone()
                    cur.close()
                    if row and row[0]:
                        return [row[0]]
                except:
                    pass
                return ["DEMO_WH"]
        return ["DEMO_WH"]

    def update_snowflake_session(self, role=None, warehouse=None, database=None, schema=None):
        if self.active_platform != "SNOWFLAKE":
            return True, "Mock database session updated successfully."
            
        if self.conn_snowflake:
            try:
                cur = self.conn_snowflake.cursor()
                if role:
                    cur.execute(f'USE ROLE "{role.upper()}"')
                    self.snowflake_config["role"] = role
                if warehouse:
                    cur.execute(f'USE WAREHOUSE "{warehouse.upper()}"')
                    self.snowflake_config["warehouse"] = warehouse
                if database:
                    cur.execute(f'USE DATABASE "{database.upper()}"')
                    self.snowflake_config["database"] = database
                if schema:
                    # Clean Schema Use
                    cur.execute(f'USE SCHEMA "{database.upper()}"."{schema.upper()}"' if database else f'USE SCHEMA "{schema.upper()}"')
                    self.snowflake_config["schema"] = schema
                cur.close()
                return True, "Session context updated successfully."
            except Exception as e:
                print(f"Failed to update session context: {e}")
                return False, f"Failed to update Snowflake session context: {str(e)}"
        return False, "Snowflake connection not active."
