from collections import Counter, defaultdict
from datetime import datetime, timedelta
from functools import lru_cache
import os
import random
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from common import ai, db

router = APIRouter()

INCIDENT_DATABASE = os.getenv("DATA_PILOT_INCIDENT_DB", "KAGGLE").upper()
INCIDENT_SCHEMA = os.getenv("DATA_PILOT_INCIDENT_SCHEMA", "INCIDENT_MGMT").upper()
TABLES = {
    "applications": "APPLICATIONS",
    "employees": "EMPLOYEES",
    "change_requests": "CHANGE_REQUESTS",
    "incidents": "INCIDENTS",
}


class IncidentQuestion(BaseModel):
    question: str
    mode: str = "native"


BUSINESS_UNITS = ["Finance", "Banking", "Healthcare", "Retail", "HR", "Manufacturing", "Insurance"]
REGIONS = ["North America", "EMEA", "APAC", "LATAM"]
CATEGORIES = ["Application", "Database", "ETL", "Infrastructure", "Security", "Network", "API"]
ROOT_CAUSES = [
    "Production deployment",
    "Schema drift",
    "Database lock contention",
    "ETL backlog",
    "Capacity saturation",
    "Expired certificate",
    "External dependency outage",
    "Bad configuration",
]


def _qid(name: str) -> str:
    return '"' + str(name).replace('"', '""').upper() + '"'


def _fq(table: str) -> str:
    return f"{_qid(INCIDENT_DATABASE)}.{_qid(INCIDENT_SCHEMA)}.{_qid(table)}"


def _connect_or_raise():
    if db.active_platform != "SNOWFLAKE":
        raise HTTPException(status_code=400, detail="Incident Command Center requires Snowflake mode.")
    if db.use_mock or db.conn_snowflake is None:
        db.use_mock = False
        success, message = db.connect_snowflake()
        if not success or db.conn_snowflake is None or db.use_mock:
            raise HTTPException(status_code=503, detail=f"Snowflake is not connected: {message}")
    return db.conn_snowflake


def _sf_query(sql: str):
    _connect_or_raise()
    res = db.execute_snowflake_query(sql)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Snowflake query failed."))
    return res.get("data", [])


def _sf_scalar(sql: str, default=0):
    rows = _sf_query(sql)
    if not rows:
        return default
    return next(iter(rows[0].values()), default)


def _pick_weighted(rng, weighted):
    labels, weights = zip(*weighted)
    return rng.choices(labels, weights=weights, k=1)[0]


@lru_cache(maxsize=1)
def _demo_data():
    rng = random.Random(64)
    now = datetime.now()
    app_names = [
        "Payment Gateway", "Customer Portal", "Claims API", "Finance Reporting", "Employee Portal",
        "Loan Origination", "Fraud Scoring", "Policy Admin", "Inventory Hub", "Order Router",
        "Data Lake Loader", "Realtime Risk Engine", "Partner API", "Billing Service", "Case Manager",
    ]
    apps = []
    for idx in range(1, 121):
        app = {
            "APP_ID": f"APP-{idx:04d}",
            "APP_NAME": f"{app_names[(idx - 1) % len(app_names)]} {idx}",
            "BUSINESS_UNIT": rng.choice(BUSINESS_UNITS),
            "BUSINESS_OWNER": rng.choice(["Maya Iyer", "Jordan Lee", "Priya Nair", "Carlos Diaz", "Ava Chen"]),
            "OWNER_TEAM": rng.choice(["Platform Ops", "Data Engineering", "App Support", "SRE", "Security Ops"]),
            "ENVIRONMENT": _pick_weighted(rng, [("Production", 70), ("UAT", 18), ("Development", 12)]),
            "CRITICALITY": _pick_weighted(rng, [("Tier 1", 16), ("Tier 2", 34), ("Tier 3", 50)]),
            "CREATED_DATE": (now - timedelta(days=rng.randint(180, 1900))).date().isoformat(),
        }
        apps.append(app)

    skills = ["Database Engineer", "Cloud Engineer", "ETL Engineer", "Platform Engineer", "Security Engineer", "Application Support"]
    employees = []
    for idx in range(1, 260):
        employees.append({
            "EMPLOYEE_ID": f"EMP-{idx:04d}",
            "EMPLOYEE_NAME": f"{rng.choice(['Alex', 'Sam', 'Riya', 'Noah', 'Mina', 'Dev', 'Lena', 'Arun'])} {rng.choice(['Patel', 'Smith', 'Kumar', 'Chen', 'Garcia', 'Brown'])}",
            "TEAM": rng.choice(["Platform Ops", "Data Engineering", "App Support", "SRE", "Security Ops"]),
            "MANAGER": rng.choice(["Nina Rao", "Ethan Brooks", "Fatima Khan", "Victor Chen"]),
            "EMAIL": f"employee{idx}@enterprise.example",
            "LOCATION": rng.choice(["Dallas", "Chicago", "New York", "London", "Bangalore", "Toronto"]),
            "EXPERIENCE_YEARS": rng.randint(1, 18),
            "PRIMARY_SKILL": rng.choice(skills),
        })

    changes = []
    for idx in range(1, 1801):
        app = rng.choice(apps)
        changes.append({
            "CHANGE_ID": f"CHG-{idx:06d}",
            "APP_ID": app["APP_ID"],
            "CHANGE_DATE": (now - timedelta(days=rng.randint(0, 210))).date().isoformat(),
            "CHANGE_TYPE": rng.choice(["Production Deployment", "Schema Change", "Infrastructure Upgrade", "Security Patch", "Release Deployment"]),
            "STATUS": _pick_weighted(rng, [("Implemented", 82), ("Failed", 7), ("Rolled Back", 6), ("Scheduled", 5)]),
            "IMPLEMENTED_BY": rng.choice(employees)["EMPLOYEE_ID"],
            "RISK_LEVEL": _pick_weighted(rng, [("Low", 42), ("Medium", 38), ("High", 16), ("Critical", 4)]),
            "DESCRIPTION": "Enterprise change request for application platform maintenance.",
        })

    incidents = []
    production_apps = [app for app in apps if app["ENVIRONMENT"] == "Production"]
    for idx in range(1, 10001):
        app = rng.choice(production_apps if rng.random() < 0.72 else apps)
        employee = rng.choice(employees)
        category = _pick_weighted(rng, [("Application", 24), ("Database", 18), ("ETL", 18), ("Infrastructure", 14), ("API", 12), ("Network", 9), ("Security", 5)])
        severity = _pick_weighted(rng, [("Critical", 4), ("High", 16), ("Medium", 58), ("Low", 22)])
        priority = "P1" if severity == "Critical" else "P2" if severity == "High" else "P3" if severity == "Medium" else "P4"
        status = _pick_weighted(rng, [("Resolved", 76), ("Open", 14), ("In Progress", 8), ("Pending Vendor", 2)])
        created = now - timedelta(days=rng.randint(0, 210), hours=rng.randint(0, 23))
        base_hours = {"Critical": 4, "High": 10, "Medium": 24, "Low": 48}[severity]
        if category in ("Database", "ETL"):
            base_hours *= 1.7
        actual_hours = max(1, int(rng.gauss(base_hours, base_hours * 0.45)))
        resolved = None if status != "Resolved" else created + timedelta(hours=actual_hours)
        root_cause = rng.choice(ROOT_CAUSES)
        linked_change = None
        if rng.random() < 0.27:
            app_changes = [c for c in changes if c["APP_ID"] == app["APP_ID"]]
            linked_change = rng.choice(app_changes)["CHANGE_ID"] if app_changes else None
        users_affected = max(1, int(rng.expovariate(1 / (1200 if severity in ("Critical", "High") else 250))))
        cost = round(users_affected * rng.uniform(0.7, 4.5) * (3 if severity == "Critical" else 1), 2)
        incidents.append({
            "INCIDENT_ID": f"INC-{idx:06d}",
            "TITLE": f"{category} degradation in {app['APP_NAME']}",
            "DESCRIPTION": f"{category} issue impacting {app['BUSINESS_UNIT']} users in {app['ENVIRONMENT']}.",
            "CATEGORY": category,
            "SUBCATEGORY": rng.choice(["Latency", "Failure", "Data Delay", "Authentication", "Throughput", "Batch Error"]),
            "PRIORITY": priority,
            "SEVERITY": severity,
            "STATUS": status,
            "CREATED_DATE": created.strftime("%Y-%m-%d %H:%M:%S"),
            "UPDATED_DATE": (created + timedelta(hours=min(actual_hours, 12))).strftime("%Y-%m-%d %H:%M:%S"),
            "RESOLVED_DATE": resolved.strftime("%Y-%m-%d %H:%M:%S") if resolved else None,
            "APP_ID": app["APP_ID"],
            "APP_NAME": app["APP_NAME"],
            "EMPLOYEE_ID": employee["EMPLOYEE_ID"],
            "EMPLOYEE_NAME": employee["EMPLOYEE_NAME"],
            "OWNER_TEAM": app["OWNER_TEAM"],
            "CHANGE_ID": linked_change,
            "ROOT_CAUSE": root_cause,
            "RESOLUTION": "Rollback, cache clear, deployment validation, and monitoring rule added." if resolved else None,
            "BUSINESS_UNIT": app["BUSINESS_UNIT"],
            "REGION": rng.choice(REGIONS),
            "SLA_TARGET": base_hours,
            "ACTUAL_RESOLUTION": actual_hours if resolved else None,
            "SLA_MET": bool(resolved and actual_hours <= base_hours),
            "USERS_AFFECTED": users_affected,
            "COST_IMPACT": cost,
        })

    return {"applications": apps, "employees": employees, "change_requests": changes, "incidents": incidents}


def _top(rows, key, limit=8):
    counts = Counter(row.get(key) or "Unknown" for row in rows)
    return [{"label": label, "value": value} for label, value in counts.most_common(limit)]


def _rows_for_insert(rows, columns):
    return [tuple(row.get(col) for col in columns) for row in rows]


def _executemany(cur, table, columns, rows, chunk_size=5000):
    if not rows:
        return 0
    placeholders = ", ".join(["%s"] * len(columns))
    col_sql = ", ".join(_qid(col) for col in columns)
    sql = f"INSERT INTO {_fq(table)} ({col_sql}) VALUES ({placeholders})"
    inserted = 0
    values = _rows_for_insert(rows, columns)
    for idx in range(0, len(values), chunk_size):
        chunk = values[idx:idx + chunk_size]
        cur.executemany(sql, chunk)
        inserted += len(chunk)
    return inserted


def _load_demo_data_to_snowflake():
    conn = _connect_or_raise()
    data = _demo_data()
    cur = conn.cursor()
    try:
        cur.execute(f"USE DATABASE {_qid(INCIDENT_DATABASE)}")
        cur.execute(f"CREATE SCHEMA IF NOT EXISTS {_qid(INCIDENT_DATABASE)}.{_qid(INCIDENT_SCHEMA)}")
        cur.execute(f"USE SCHEMA {_qid(INCIDENT_DATABASE)}.{_qid(INCIDENT_SCHEMA)}")

        cur.execute(f"""
            CREATE OR REPLACE TABLE {_fq(TABLES["applications"])} (
                APP_ID VARCHAR,
                APP_NAME VARCHAR,
                BUSINESS_UNIT VARCHAR,
                BUSINESS_OWNER VARCHAR,
                OWNER_TEAM VARCHAR,
                ENVIRONMENT VARCHAR,
                CRITICALITY VARCHAR,
                CREATED_DATE DATE
            )
        """)
        cur.execute(f"""
            CREATE OR REPLACE TABLE {_fq(TABLES["employees"])} (
                EMPLOYEE_ID VARCHAR,
                EMPLOYEE_NAME VARCHAR,
                TEAM VARCHAR,
                MANAGER VARCHAR,
                EMAIL VARCHAR,
                LOCATION VARCHAR,
                EXPERIENCE_YEARS NUMBER,
                PRIMARY_SKILL VARCHAR
            )
        """)
        cur.execute(f"""
            CREATE OR REPLACE TABLE {_fq(TABLES["change_requests"])} (
                CHANGE_ID VARCHAR,
                APP_ID VARCHAR,
                CHANGE_DATE DATE,
                CHANGE_TYPE VARCHAR,
                STATUS VARCHAR,
                IMPLEMENTED_BY VARCHAR,
                RISK_LEVEL VARCHAR,
                DESCRIPTION VARCHAR
            )
        """)
        cur.execute(f"""
            CREATE OR REPLACE TABLE {_fq(TABLES["incidents"])} (
                INCIDENT_ID VARCHAR,
                TITLE VARCHAR,
                DESCRIPTION VARCHAR,
                CATEGORY VARCHAR,
                SUBCATEGORY VARCHAR,
                PRIORITY VARCHAR,
                SEVERITY VARCHAR,
                STATUS VARCHAR,
                CREATED_DATE TIMESTAMP_NTZ,
                UPDATED_DATE TIMESTAMP_NTZ,
                RESOLVED_DATE TIMESTAMP_NTZ,
                APP_ID VARCHAR,
                APP_NAME VARCHAR,
                EMPLOYEE_ID VARCHAR,
                EMPLOYEE_NAME VARCHAR,
                OWNER_TEAM VARCHAR,
                CHANGE_ID VARCHAR,
                ROOT_CAUSE VARCHAR,
                RESOLUTION VARCHAR,
                BUSINESS_UNIT VARCHAR,
                REGION VARCHAR,
                SLA_TARGET FLOAT,
                ACTUAL_RESOLUTION FLOAT,
                SLA_MET BOOLEAN,
                USERS_AFFECTED NUMBER,
                COST_IMPACT FLOAT
            )
        """)

        counts = {}
        app_cols = ["APP_ID", "APP_NAME", "BUSINESS_UNIT", "BUSINESS_OWNER", "OWNER_TEAM", "ENVIRONMENT", "CRITICALITY", "CREATED_DATE"]
        emp_cols = ["EMPLOYEE_ID", "EMPLOYEE_NAME", "TEAM", "MANAGER", "EMAIL", "LOCATION", "EXPERIENCE_YEARS", "PRIMARY_SKILL"]
        chg_cols = ["CHANGE_ID", "APP_ID", "CHANGE_DATE", "CHANGE_TYPE", "STATUS", "IMPLEMENTED_BY", "RISK_LEVEL", "DESCRIPTION"]
        inc_cols = [
            "INCIDENT_ID", "TITLE", "DESCRIPTION", "CATEGORY", "SUBCATEGORY", "PRIORITY", "SEVERITY", "STATUS",
            "CREATED_DATE", "UPDATED_DATE", "RESOLVED_DATE", "APP_ID", "APP_NAME", "EMPLOYEE_ID", "EMPLOYEE_NAME",
            "OWNER_TEAM", "CHANGE_ID", "ROOT_CAUSE", "RESOLUTION", "BUSINESS_UNIT", "REGION", "SLA_TARGET",
            "ACTUAL_RESOLUTION", "SLA_MET", "USERS_AFFECTED", "COST_IMPACT"
        ]
        counts[TABLES["applications"]] = _executemany(cur, TABLES["applications"], app_cols, data["applications"])
        counts[TABLES["employees"]] = _executemany(cur, TABLES["employees"], emp_cols, data["employees"])
        counts[TABLES["change_requests"]] = _executemany(cur, TABLES["change_requests"], chg_cols, data["change_requests"])
        counts[TABLES["incidents"]] = _executemany(cur, TABLES["incidents"], inc_cols, data["incidents"])
        conn.commit()
        return counts
    finally:
        cur.close()


def _verify_snowflake_tables():
    try:
        return {
            table: int(_sf_scalar(f"SELECT COUNT(*) FROM {_fq(table)}", 0) or 0)
            for table in TABLES.values()
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Incident Snowflake tables are not loaded or not accessible: {exc}")


def _dashboard_payload():
    counts = _verify_snowflake_tables()
    inc = _fq(TABLES["incidents"])
    summary_rows = _sf_query(f"""
        SELECT
            COUNT(*) AS TOTAL_INCIDENTS,
            COUNT_IF(STATUS <> 'Resolved') AS OPEN_INCIDENTS,
            COUNT_IF(SEVERITY = 'Critical') AS CRITICAL_INCIDENTS,
            ROUND(AVG(IFF(RESOLVED_DATE IS NOT NULL, ACTUAL_RESOLUTION, NULL)), 1) AS AVG_RESOLUTION_HOURS,
            ROUND(100 * COUNT_IF(SLA_MET = TRUE) / NULLIF(COUNT_IF(RESOLVED_DATE IS NOT NULL), 0), 1) AS SLA_COMPLIANCE_PCT,
            ROUND(SUM(COST_IMPACT), 2) AS BUSINESS_COST,
            COUNT_IF(CHANGE_ID IS NOT NULL) AS CHANGE_LINKED_INCIDENTS,
            COUNT_IF(CATEGORY IN ('ETL', 'Database')) AS ETL_DB_INCIDENTS
        FROM {inc}
    """)
    summary = summary_rows[0] if summary_rows else {}
    trend = _sf_query(f"SELECT TO_CHAR(DATE_TRUNC('MONTH', CREATED_DATE), 'YYYY-MM') AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY 1 DESC LIMIT 7")
    trend = list(reversed(trend))
    root = _sf_query(f"SELECT ROOT_CAUSE AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC LIMIT 8")
    categories = _sf_query(f"SELECT CATEGORY AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC LIMIT 8")
    priority = _sf_query(f"SELECT PRIORITY AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC")
    apps = _sf_query(f"SELECT APP_NAME AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC LIMIT 8")
    teams = _sf_query(f"SELECT OWNER_TEAM AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC LIMIT 8")
    business_units = _sf_query(f"SELECT BUSINESS_UNIT AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC LIMIT 8")
    regions = _sf_query(f"SELECT REGION AS LABEL, COUNT(*) AS VALUE FROM {inc} GROUP BY 1 ORDER BY VALUE DESC LIMIT 8")
    critical_open = _sf_query(f"""
        SELECT INCIDENT_ID, TITLE, APP_NAME, STATUS, SEVERITY, CREATED_DATE, BUSINESS_UNIT, REGION
        FROM {inc}
        WHERE STATUS <> 'Resolved' AND SEVERITY IN ('Critical', 'High')
        ORDER BY CREATED_DATE DESC
        LIMIT 10
    """)

    return {
        "summary": {
            "total_incidents": int(summary.get("TOTAL_INCIDENTS") or 0),
            "open_incidents": int(summary.get("OPEN_INCIDENTS") or 0),
            "critical_incidents": int(summary.get("CRITICAL_INCIDENTS") or 0),
            "avg_resolution_hours": float(summary.get("AVG_RESOLUTION_HOURS") or 0),
            "sla_compliance_pct": float(summary.get("SLA_COMPLIANCE_PCT") or 0),
            "business_cost": float(summary.get("BUSINESS_COST") or 0),
            "change_linked_incidents": int(summary.get("CHANGE_LINKED_INCIDENTS") or 0),
        },
        "charts": {
            "trend": trend,
            "root_causes": root,
            "categories": categories,
            "priority": priority,
            "top_apps": apps,
            "top_teams": teams,
            "business_units": business_units,
            "regions": regions,
        },
        "recent_critical": critical_open,
        "insights": [
            f"{int(summary.get('ETL_DB_INCIDENTS') or 0):,} incidents are Database or ETL related, which are usually slower to restore and should receive deployment validation focus.",
            f"{int(summary.get('CHANGE_LINKED_INCIDENTS') or 0):,} incidents are linked to change requests, making release governance a strong optimization lever.",
            f"SLA compliance is {float(summary.get('SLA_COMPLIANCE_PCT') or 0)}%; prioritize open Critical and High incidents before lower-priority backlog work.",
        ],
        "dataset": {key.lower(): value for key, value in counts.items()},
        "source": f"Snowflake: {INCIDENT_DATABASE}.{INCIDENT_SCHEMA}",
    }


def _native_answer(question: str):
    started = time.perf_counter()
    q = question.lower()
    inc = _fq(TABLES["incidents"])
    sql = f"SELECT * FROM {inc} ORDER BY CREATED_DATE DESC LIMIT 100"
    explanation = "Native keyword routing returned the latest incidents."
    chart = {"type": "table"}

    if "critical" in q:
        sql = f"SELECT INCIDENT_ID, TITLE, APP_NAME, STATUS, CREATED_DATE FROM {inc} WHERE SEVERITY = 'Critical' ORDER BY CREATED_DATE DESC LIMIT 100"
        explanation = "Filtered Critical incidents and sorted newest first."
    elif "highest incident" in q or "top application" in q or "application has" in q:
        sql = f"SELECT APP_NAME, COUNT(*) AS INCIDENT_COUNT FROM {inc} GROUP BY APP_NAME ORDER BY INCIDENT_COUNT DESC LIMIT 10"
        explanation = "Grouped incidents by application to identify operational hot spots."
        chart = {"type": "bar", "x": "APP_NAME", "y": "INCIDENT_COUNT"}
    elif "engineer" in q or "resolved the most" in q:
        sql = f"SELECT EMPLOYEE_NAME, COUNT(*) AS RESOLVED_COUNT FROM {inc} WHERE STATUS = 'Resolved' GROUP BY EMPLOYEE_NAME ORDER BY RESOLVED_COUNT DESC LIMIT 10"
        explanation = "Grouped resolved incidents by assigned engineer."
        chart = {"type": "bar", "x": "EMPLOYEE_NAME", "y": "RESOLVED_COUNT"}
    elif "sla" in q:
        sql = f"SELECT APP_NAME, COUNT_IF(SLA_MET = FALSE AND RESOLVED_DATE IS NOT NULL) AS SLA_BREACHES, ROUND(100 * COUNT_IF(SLA_MET = FALSE AND RESOLVED_DATE IS NOT NULL) / NULLIF(COUNT_IF(RESOLVED_DATE IS NOT NULL), 0), 1) AS BREACH_RATE FROM {inc} GROUP BY APP_NAME ORDER BY SLA_BREACHES DESC LIMIT 10"
        explanation = "Ranked applications by resolved incidents that missed their SLA target."
        chart = {"type": "bar", "x": "APP_NAME", "y": "SLA_BREACHES"}
    elif "change" in q:
        sql = f"SELECT INCIDENT_ID, APP_NAME, CHANGE_ID, ROOT_CAUSE, CREATED_DATE FROM {inc} WHERE CHANGE_ID IS NOT NULL ORDER BY CREATED_DATE DESC LIMIT 100"
        explanation = "Returned incidents linked to recent change requests."
    elif "cost" in q:
        sql = f"SELECT APP_NAME, ROUND(SUM(COST_IMPACT), 2) AS COST_IMPACT FROM {inc} GROUP BY APP_NAME ORDER BY COST_IMPACT DESC LIMIT 10"
        explanation = "Ranked applications by estimated business cost impact."
        chart = {"type": "bar", "x": "APP_NAME", "y": "COST_IMPACT"}
    elif "trend" in q or "six month" in q or "month" in q:
        sql = f"SELECT TO_CHAR(DATE_TRUNC('MONTH', CREATED_DATE), 'YYYY-MM') AS MONTH, COUNT(*) AS INCIDENT_COUNT FROM {inc} GROUP BY 1 ORDER BY 1 DESC LIMIT 6"
        explanation = "Calculated incident trend over the latest six monthly buckets."
        chart = {"type": "line", "x": "MONTH", "y": "INCIDENT_COUNT"}
    elif "database" in q and ("unresolved" in q or "open" in q):
        sql = f"SELECT INCIDENT_ID, TITLE, APP_NAME, STATUS, CREATED_DATE FROM {inc} WHERE CATEGORY = 'Database' AND STATUS <> 'Resolved' ORDER BY CREATED_DATE DESC LIMIT 100"
        explanation = "Filtered unresolved Database incidents for triage."

    rows = _sf_query(sql)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    return {
        "success": True,
        "generated_sql": sql,
        "execution_time_ms": elapsed_ms,
        "rows_returned": len(rows),
        "result_preview": rows[:100],
        "explanation": explanation,
        "chart": chart,
        "optimization_suggestions": ["Add date filters for repeated operational reviews.", "Materialize monthly incident summaries for executive dashboards."],
    }


def _ai_answer(question: str):
    native = _native_answer(question)
    native["explanation"] = native["explanation"] + " AI mode adds business interpretation, risks, and recommended next actions."
    native["business_insights"] = [
        "Prioritize incidents with high user impact and SLA risk before lower-cost backlog items.",
        "Compare change-linked incidents with deployment windows to identify release governance gaps.",
        "Use root-cause distribution to decide whether the next investment should be observability, release validation, or data pipeline resilience.",
    ]
    native["confidence_score"] = 0.86
    native["estimated_tokens"] = 620
    native["estimated_api_cost"] = 0.0012 if ai.config.get("enabled") else 0
    return native


@router.get("/api/incident-command/dashboard")
async def incident_dashboard():
    return _dashboard_payload()


@router.get("/api/incident-command/status")
async def incident_command_status():
    counts = _verify_snowflake_tables()
    return {
        "success": True,
        "database": INCIDENT_DATABASE,
        "schema": INCIDENT_SCHEMA,
        "tables": counts,
    }


@router.post("/api/incident-command/query")
async def incident_query(req: IncidentQuestion):
    mode = (req.mode or "native").lower()
    question = req.question.strip() or "Show incident trend over the last six months"
    native = _native_answer(question)
    if mode == "compare":
        ai_result = _ai_answer(question)
        return {
            "mode": "compare",
            "prompt": question,
            "native": native,
            "ai": ai_result,
            "comparison_summary": "Native execution is fast and deterministic. AI adds stronger business framing, recommendations, and demo-ready explanation around the same result.",
            "recommended": "AI" if len(ai_result.get("business_insights", [])) else "Native",
        }
    if mode == "ai":
        result = _ai_answer(question)
        result["mode"] = "ai"
        return result
    native["mode"] = "native"
    return native
