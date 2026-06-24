import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from common import db
from runtime_paths import data_path

router = APIRouter()

QUERY_LOG_PATH = data_path("query_log.jsonl")


def _safe_name(value: str) -> str:
    if not value:
        raise HTTPException(status_code=400, detail="Database, schema, table, and column values are required.")
    cleaned = value.strip()
    if not cleaned.replace("_", "").replace("$", "").isalnum():
        raise HTTPException(status_code=400, detail=f"Unsafe identifier: {value}")
    return cleaned.upper()


def _quote(value: str) -> str:
    return f'"{_safe_name(value)}"'


def _literal(value: str) -> str:
    return (value or "").replace("'", "''")


def _table_ref(database: str, schema: str, table: str) -> str:
    if db.use_mock:
        return _safe_name(table)
    if db.active_platform == "SNOWFLAKE":
        return f"{_quote(database)}.{_quote(schema)}.{_quote(table)}"
    return f"{_safe_name(schema).lower()}.{_safe_name(table).lower()}"


def log_query(query: str, purpose: str = "User query"):
    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "purpose": purpose,
        "query": query,
        "platform": db.active_platform,
        "source": "Mock" if db.use_mock else db.active_platform,
    }
    with QUERY_LOG_PATH.open("a", encoding="utf-8") as file:
        file.write(json.dumps(entry, default=str) + "\n")
    return entry


def _run(query: str, purpose: str):
    log_query(query, purpose)
    return db.execute_query(query)


def _get_columns(database: str, schema: str, table: str):
    database = _safe_name(database)
    schema = _safe_name(schema)
    table = _safe_name(table)
    if db.use_mock:
        query = (
            "SELECT table_name, column_name, data_type, is_nullable, description AS comment, "
            "NULL AS character_maximum_length, NULL AS numeric_precision "
            "FROM information_schema.columns "
            f"WHERE table_catalog = '{database}' AND table_schema = '{schema}' AND table_name = '{table}'"
        )
    elif db.active_platform == "SNOWFLAKE":
        query = (
            "SELECT table_name, column_name, data_type, is_nullable, character_maximum_length, "
            "numeric_precision, numeric_scale, comment "
            f"FROM {_quote(database)}.information_schema.columns "
            f"WHERE table_schema = '{schema}' AND table_name = '{table}' "
            "ORDER BY ordinal_position"
        )
    else:
        query = (
            "SELECT table_name, column_name, data_type, is_nullable, character_maximum_length, "
            "numeric_precision, numeric_scale, '' AS comment "
            "FROM information_schema.columns "
            f"WHERE table_schema = '{schema.lower()}' AND table_name = '{table.lower()}' "
            "ORDER BY ordinal_position"
        )
    res = _run(query, "Column metadata")
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to fetch columns."))
    return res.get("data", [])


def _col(row, name, default=None):
    return row.get(name) if name in row else row.get(name.upper(), default)


def _kind(data_type: str):
    dt = (data_type or "").upper()
    if any(x in dt for x in ("NUMBER", "INT", "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL")):
        return "numeric"
    if any(x in dt for x in ("DATE", "TIME")):
        return "date"
    return "text"


def _column_label(column_name: str, data_type: str):
    name = column_name.lower()
    kind = _kind(data_type)
    if name == "id" or name.endswith("_id"):
        return "PK" if name in ("id", "table_id") else "FK"
    if any(token in name for token in ("amount", "price", "cost", "credit", "revenue", "balance")):
        return "Amount"
    if kind == "date" or any(token in name for token in ("date", "time", "created", "updated", "modified")):
        return "Date"
    if any(token in name for token in ("flag", "is_", "has_")):
        return "Flag"
    if any(token in name for token in ("status", "type", "category", "state", "country")):
        return "Category"
    if any(token in name for token in ("email", "phone", "name", "address")):
        return "PII"
    return "Measure" if kind == "numeric" else "Attribute"


def _description(column_name: str, data_type: str):
    label = _column_label(column_name, data_type)
    return f"{column_name} is classified as {label}. It stores {data_type} values used for table analysis and filtering."


def _pii_reason(column_name: str, data_type: str):
    name = column_name.lower()
    checks = [
        ("email", "Column name indicates email addresses."),
        ("phone", "Column name indicates phone numbers."),
        ("mobile", "Column name indicates phone numbers."),
        ("address", "Column name indicates street or mailing addresses."),
        ("ssn", "Column name indicates social security or national identifier data."),
        ("name", "Column name indicates personal names."),
        ("dob", "Column name indicates date of birth."),
        ("birth", "Column name indicates birth date or birth details."),
    ]
    for token, reason in checks:
        if token in name:
            return reason
    if _kind(data_type) == "text" and any(token in name for token in ("user", "customer", "employee", "worker")):
        return "Column may identify a person or account."
    return ""


def _safe_number(value, default=0.0):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def _median(values):
    if not values:
        return 0
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


def _volume_bucket_sql(col_ref: str, granularity: str):
    granularity = (granularity or "day").lower()
    if db.active_platform == "SNOWFLAKE" and not db.use_mock:
        date_part = {
            "hour": "HOUR",
            "day": "DAY",
            "week": "WEEK",
            "month": "MONTH",
        }.get(granularity, "DAY")
        return f"DATE_TRUNC('{date_part}', {col_ref})"
    if granularity == "hour":
        return f"strftime('%Y-%m-%d %H:00:00', {col_ref})"
    if granularity == "month":
        return f"strftime('%Y-%m-01', {col_ref})"
    return f"DATE({col_ref})"


def _volume_window_filter(col_ref: str, table_ref: str, time_window: str):
    time_window = (time_window or "all").lower()
    if time_window in ("all", "all_time"):
        return ""
    if db.active_platform == "SNOWFLAKE" and not db.use_mock:
        window_parts = {
            "24h": ("HOUR", 24),
            "7d": ("DAY", 7),
            "30d": ("DAY", 30),
            "90d": ("DAY", 90),
        }
        part, amount = window_parts.get(time_window, ("DAY", 90))
        return f"AND {col_ref} >= DATEADD('{part}', -{amount}, (SELECT MAX({col_ref}) FROM {table_ref}))"
    days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}.get(time_window, 90)
    return f"AND {col_ref} >= datetime((SELECT MAX({col_ref}) FROM {table_ref}), '-{days} day')"


def _build_volume_anomaly_result(
    table_ref: str,
    column_name: str,
    purpose: str = "Volume anomaly scan",
    field_mode: str = "event",
    time_window: str = "all",
    granularity: str = "day",
):
    col_ref = _quote(column_name)
    field_mode = (field_mode or "event").lower()
    granularity = (granularity or "day").lower()
    time_window = (time_window or "all").lower()
    bucket_expr = _volume_bucket_sql(col_ref, granularity)
    window_filter = _volume_window_filter(col_ref, table_ref, time_window)
    query = (
        f"SELECT {bucket_expr} AS activity_bucket, COUNT(*) AS row_count "
        f"FROM {table_ref} "
        f"WHERE {col_ref} IS NOT NULL {window_filter} "
        f"GROUP BY {bucket_expr} "
        "ORDER BY activity_bucket"
    )
    res = _run(query, purpose)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Volume analysis failed."))

    rows = res.get("data", []) or []
    counts = [
        float(_col(row, "ROW_COUNT", row.get("row_count", 0)) or 0)
        for row in rows
    ]
    window = 7 if granularity in ("hour", "day") else 5
    threshold = 3
    plot_rows = []
    anomalies = []
    for idx, row in enumerate(rows):
        start = max(0, idx - window // 2)
        end = min(len(counts), idx + window // 2 + 1)
        local_values = counts[start:end]
        rolling_median = _median(local_values)
        mad = _median([abs(value - rolling_median) for value in local_values])
        current_count = counts[idx]
        modified_z = (0.6745 * (current_count - rolling_median) / mad) if mad else 0
        direction = "peak" if current_count > rolling_median else "drop" if current_count < rolling_median else "normal"
        enriched = {
            **row,
            "ACTIVITY_DATE": _col(row, "ACTIVITY_BUCKET", row.get("activity_bucket")),
            "ACTIVITY_BUCKET": _col(row, "ACTIVITY_BUCKET", row.get("activity_bucket")),
            "ROW_COUNT": int(current_count) if current_count.is_integer() else current_count,
            "ROLLING_MEDIAN": round(rolling_median, 4),
            "MAD": round(mad, 4),
            "MODIFIED_Z": round(modified_z, 4),
            "DIRECTION": direction,
            "IS_ANOMALY": abs(modified_z) > threshold,
        }
        plot_rows.append(enriched)
        if enriched["IS_ANOMALY"]:
            anomalies.append(enriched)

    peak_count = len([row for row in anomalies if row["DIRECTION"] == "peak"])
    drop_count = len([row for row in anomalies if row["DIRECTION"] == "drop"])
    avg_bucket_rows = round(sum(counts) / len(counts), 2) if counts else 0
    total_count = float(sum(counts))
    total_events = int(total_count) if total_count.is_integer() else round(total_count, 2)
    first_event = _col(rows[0], "ACTIVITY_BUCKET", rows[0].get("activity_bucket")) if rows else None
    last_event = _col(rows[-1], "ACTIVITY_BUCKET", rows[-1].get("activity_bucket")) if rows else None

    heatmap_query = None
    heatmap_rows = []
    if db.active_platform == "SNOWFLAKE" and not db.use_mock:
        heatmap_query = (
            "SELECT day_name, day_sort, hour_bucket, COUNT(*) AS row_count FROM ("
            f"SELECT DAYNAME({col_ref}) AS day_name, DAYOFWEEKISO({col_ref}) AS day_sort, "
            f"LPAD(EXTRACT(HOUR FROM TO_TIMESTAMP_NTZ({col_ref}))::VARCHAR, 2, '0') || ':00' AS hour_bucket "
            f"FROM {table_ref} WHERE {col_ref} IS NOT NULL {window_filter}"
            ") "
            "GROUP BY 1, 2, 3 "
            "ORDER BY day_sort, hour_bucket"
        )
    elif db.use_mock:
        heatmap_query = (
            f"SELECT strftime('%w', {col_ref}) AS day_sort, strftime('%H:00', {col_ref}) AS hour_bucket, COUNT(*) AS row_count "
            f"FROM {table_ref} WHERE {col_ref} IS NOT NULL {window_filter} "
            "GROUP BY day_sort, hour_bucket ORDER BY day_sort, hour_bucket"
        )
    if heatmap_query:
        heatmap_res = _run(heatmap_query, "Volume analyzer heatmap")
        if heatmap_res.get("success"):
            heatmap_rows = heatmap_res.get("data", []) or []

    return {
        "kind": "date",
        "summary": {
            "method": "Median Absolute Deviation",
            "formula": "Modified Z = 0.6745 * (x - rolling_median) / MAD",
            "threshold": f"|Modified Z| > {threshold}",
            "date_column": column_name,
            "field_mode": field_mode,
            "time_window": time_window,
            "granularity": granularity,
            "bucket_count": len(rows),
            "days": len(rows),
            "total_events": total_events,
            "anomaly_count": len(anomalies),
            "peak_count": peak_count,
            "drop_count": drop_count,
            "avg_daily_rows": avg_bucket_rows,
            "avg_bucket_rows": avg_bucket_rows,
            "first_event": first_event,
            "last_event": last_event,
            "rolling_window_days": window,
        },
        "rows": anomalies[:100],
        "plot_data": {"series": plot_rows, "heatmap": heatmap_rows},
        "sql": query,
        "heatmap_sql": heatmap_query,
        "custom_rules": [
            {"label": "Rows missing selected date", "sql": f"SELECT * FROM {table_ref} WHERE {col_ref} IS NULL LIMIT 100;"},
            {"label": "Bucketed row counts", "sql": query},
        ],
    }


@router.get("/api/workbench/table-details")
async def table_details(database: str, schema: str, table: str):
    columns = _get_columns(database, schema, table)
    table_ref = _table_ref(database, schema, table)
    sample_query = f"SELECT * FROM {table_ref} LIMIT 25"
    sample_res = _run(sample_query, "Sample rows")
    sample_rows = sample_res.get("data", []) if sample_res.get("success") else []

    ddl_columns = []
    ai_descriptions = []
    for row in columns:
        column_name = _col(row, "COLUMN_NAME", "")
        data_type = _col(row, "DATA_TYPE", "")
        nullable = _col(row, "IS_NULLABLE", "YES")
        comment = _col(row, "COMMENT", "") or _col(row, "DESCRIPTION", "")
        max_length = _col(row, "CHARACTER_MAXIMUM_LENGTH")
        precision = _col(row, "NUMERIC_PRECISION")
        scale = _col(row, "NUMERIC_SCALE")
        ddl_type = data_type
        if max_length and "CHAR" in data_type.upper():
            ddl_type = f"{data_type}({max_length})"
        elif precision and any(x in data_type.upper() for x in ("NUMBER", "DECIMAL", "NUMERIC")):
            ddl_type = f"{data_type}({precision}{',' + str(scale) if scale is not None else ''})"
        ddl_columns.append(f"  {_quote(column_name)} {ddl_type}{'' if nullable == 'YES' else ' NOT NULL'}")
        ai_descriptions.append({
            "column_name": column_name,
            "data_type": data_type,
            "label": _column_label(column_name, data_type),
            "description": comment or _description(column_name, data_type),
        })

    numeric_cols = [c for c in columns if _kind(_col(c, "DATA_TYPE", "")) == "numeric"]
    date_cols = [c for c in columns if _kind(_col(c, "DATA_TYPE", "")) == "date"]
    quick_queries = [
        {"label": "Full Select", "sql": f"SELECT * FROM {table_ref};"},
        {"label": "Row Count", "sql": f"SELECT COUNT(*) AS row_count FROM {table_ref};"},
        {"label": "Rows With Any Null Values", "sql": f"SELECT * FROM {table_ref} WHERE " + " OR ".join([f"{_quote(_col(c, 'COLUMN_NAME'))} IS NULL" for c in columns]) + " LIMIT 100;"},
    ]
    if date_cols:
        col_name = _quote(_col(date_cols[0], "COLUMN_NAME"))
        quick_queries.append({"label": "Most Recent Rows", "sql": f"SELECT * FROM {table_ref} ORDER BY {col_name} DESC LIMIT 100;"})
    if numeric_cols:
        pieces = [f"MIN({_quote(_col(c, 'COLUMN_NAME'))}) AS min_{_col(c, 'COLUMN_NAME').lower()}, MAX({_quote(_col(c, 'COLUMN_NAME'))}) AS max_{_col(c, 'COLUMN_NAME').lower()}, AVG({_quote(_col(c, 'COLUMN_NAME'))}) AS avg_{_col(c, 'COLUMN_NAME').lower()}" for c in numeric_cols[:5]]
        quick_queries.append({"label": "Numeric Column Summary", "sql": f"SELECT {', '.join(pieces)} FROM {table_ref};"})

    ddl = f"CREATE OR REPLACE TABLE {_table_ref(database, schema, table)} (\n" + ",\n".join(ddl_columns) + "\n);"
    return {
        "columns": columns,
        "sample_rows": sample_rows,
        "ai_descriptions": ai_descriptions,
        "ddl": ddl,
        "quick_queries": quick_queries,
    }


@router.get("/api/workbench/profile")
async def table_profile(database: str, schema: str, table: str):
    columns = _get_columns(database, schema, table)
    table_ref = _table_ref(database, schema, table)
    count_res = _run(f"SELECT COUNT(*) AS row_count FROM {table_ref}", "Profiler row count")
    total_rows = 0
    if count_res.get("success") and count_res.get("data"):
        total_rows = list(count_res["data"][0].values())[0] or 0

    stats = []
    for column in columns:
        column_name = _col(column, "COLUMN_NAME")
        data_type = _col(column, "DATA_TYPE")
        quoted = _quote(column_name)
        query = (
            f"SELECT COUNT(*) AS total_count, COUNT({quoted}) AS non_null_count, "
            f"COUNT(DISTINCT {quoted}) AS distinct_count, MIN({quoted}) AS min_value, MAX({quoted}) AS max_value "
            f"FROM {table_ref}"
        )
        res = _run(query, f"Profiler stats for {column_name}")
        row = res.get("data", [{}])[0] if res.get("success") else {}
        total = row.get("TOTAL_COUNT", total_rows) or total_rows or 0
        non_null = row.get("NON_NULL_COUNT", 0) or 0
        null_pct = round(((total - non_null) / total) * 100, 2) if total else 0
        stats.append({
            "column_name": column_name,
            "data_type": data_type,
            "null_pct": null_pct,
            "distinct_count": row.get("DISTINCT_COUNT"),
            "min": row.get("MIN_VALUE"),
            "max": row.get("MAX_VALUE"),
            "label": _column_label(column_name, data_type),
        })

    high_null = [s for s in stats if s["null_pct"] > 20]
    empty_cols = [s for s in stats if s["null_pct"] == 100]
    health_report = (
        f"{table} has {total_rows} rows across {len(columns)} columns. "
        f"{len(high_null)} columns have more than 20% nulls and {len(empty_cols)} columns appear empty. "
        "Review important identifiers, date columns, and amount columns before using this table in reporting."
    )
    dq_checks = []
    for stat in stats:
        if stat["label"] in ("PK", "FK"):
            dq_checks.append({"check": f"{stat['column_name']} should not be null", "sql": f"SELECT COUNT(*) AS failures FROM {table_ref} WHERE {_quote(stat['column_name'])} IS NULL;"})
        if stat["label"] == "Amount":
            dq_checks.append({"check": f"{stat['column_name']} should not be negative", "sql": f"SELECT COUNT(*) AS failures FROM {table_ref} WHERE {_quote(stat['column_name'])} < 0;"})

    date_cols = [s for s in stats if _kind(s["data_type"]) == "date"]
    volume = []
    volume_breakdown = {}
    if date_cols:
        date_stat = date_cols[0]
        date_col = _quote(date_stat["column_name"])
        volume_query = f"SELECT CAST({date_col} AS DATE) AS activity_date, COUNT(*) AS row_count FROM {table_ref} GROUP BY CAST({date_col} AS DATE) ORDER BY activity_date DESC LIMIT 90"
        volume_res = _run(volume_query, "Volume analysis")
        volume = volume_res.get("data", []) if volume_res.get("success") else []
        volume_breakdown["daily"] = volume

        if db.use_mock:
            volume_queries = {
                "monthly": (
                    f"SELECT strftime('%Y-%m', {date_col}) AS period, COUNT(*) AS row_count "
                    f"FROM {table_ref} GROUP BY strftime('%Y-%m', {date_col}) ORDER BY period"
                ),
                "weekday": (
                    "SELECT CASE strftime('%w', {col}) "
                    "WHEN '0' THEN 'Sun' WHEN '1' THEN 'Mon' WHEN '2' THEN 'Tue' WHEN '3' THEN 'Wed' "
                    "WHEN '4' THEN 'Thu' WHEN '5' THEN 'Fri' ELSE 'Sat' END AS period, COUNT(*) AS row_count, "
                    f"CAST(strftime('%w', {date_col}) AS INTEGER) AS sort_order FROM {table_ref} "
                    f"GROUP BY period, sort_order ORDER BY sort_order"
                ).format(col=date_col),
            }
            if "TIME" in (date_stat["data_type"] or "").upper():
                volume_queries["hourly"] = (
                    f"SELECT strftime('%H', {date_col}) || ':00' AS period, COUNT(*) AS row_count "
                    f"FROM {table_ref} GROUP BY strftime('%H', {date_col}) ORDER BY period"
                )
        elif db.active_platform == "SNOWFLAKE":
            volume_queries = {
                "monthly": (
                    f"SELECT TO_CHAR(DATE_TRUNC('MONTH', {date_col}), 'YYYY-MM') AS period, COUNT(*) AS row_count "
                    f"FROM {table_ref} GROUP BY DATE_TRUNC('MONTH', {date_col}) ORDER BY period"
                ),
                "weekday": (
                    f"SELECT DAYNAME({date_col}) AS period, COUNT(*) AS row_count, DAYOFWEEKISO({date_col}) AS sort_order "
                    f"FROM {table_ref} GROUP BY DAYNAME({date_col}), DAYOFWEEKISO({date_col}) ORDER BY sort_order"
                ),
            }
            if "TIME" in (date_stat["data_type"] or "").upper():
                volume_queries["hourly"] = (
                    f"SELECT LPAD(EXTRACT(HOUR FROM {date_col})::VARCHAR, 2, '0') || ':00' AS period, COUNT(*) AS row_count "
                    f"FROM {table_ref} GROUP BY EXTRACT(HOUR FROM {date_col}) ORDER BY period"
                )
        else:
            volume_queries = {}

        for key, query in volume_queries.items():
            res = _run(query, f"Volume analysis {key}")
            if res.get("success"):
                volume_breakdown[key] = res.get("data", [])

    return {
        "summary": {
            "total_rows": total_rows,
            "columns": len(columns),
            "high_null_columns": len(high_null),
            "empty_columns": len(empty_cols),
        },
        "column_stats": stats,
        "health_report": health_report,
        "volume_analysis": volume,
        "volume_breakdown": volume_breakdown,
        "dq_checks": dq_checks,
        "column_labels": [{"column_name": s["column_name"], "label": s["label"]} for s in stats],
    }


@router.get("/api/workbench/insights")
async def table_insights(database: str, schema: str, table: str):
    columns = _get_columns(database, schema, table)
    table_ref = _table_ref(database, schema, table)
    numeric_cols = [c for c in columns if _kind(_col(c, "DATA_TYPE", "")) == "numeric"]
    date_cols = [c for c in columns if _kind(_col(c, "DATA_TYPE", "")) == "date"]
    text_cols = [c for c in columns if _kind(_col(c, "DATA_TYPE", "")) == "text"]
    category_cols = [
        c for c in text_cols
        if any(token in _col(c, "COLUMN_NAME", "").lower() for token in ("status", "type", "category", "state", "country", "segment", "flag"))
    ]
    amount_cols = [
        c for c in numeric_cols
        if any(token in _col(c, "COLUMN_NAME", "").lower() for token in ("amount", "price", "cost", "credit", "revenue", "balance", "salary", "score", "rate"))
    ]

    insights = []
    recommended_sql = []

    count_query = f"SELECT COUNT(*) AS row_count FROM {table_ref}"
    count_res = _run(count_query, "Insight row count")
    row_count = 0
    if count_res.get("success") and count_res.get("data"):
        row_count = list(count_res["data"][0].values())[0] or 0
    insights.append({
        "category": "Business KPI",
        "title": "Table population",
        "summary": f"{table} currently has {row_count} rows across {len(columns)} columns.",
        "confidence": "High",
        "sql": count_query,
    })
    recommended_sql.append({"label": "Verify row count", "sql": count_query})

    for col in amount_cols[:3]:
        col_name = _col(col, "COLUMN_NAME")
        quoted = _quote(col_name)
        query = (
            f"SELECT COUNT({quoted}) AS populated_rows, MIN({quoted}) AS min_value, "
            f"MAX({quoted}) AS max_value, AVG({quoted}) AS avg_value, SUM({quoted}) AS total_value "
            f"FROM {table_ref}"
        )
        res = _run(query, f"Insight KPI summary for {col_name}")
        if res.get("success") and res.get("data"):
            row = res.get("data", [{}])[0]
            avg_value = _safe_number(row.get("AVG_VALUE") or row.get("avg_value"))
            total_value = _safe_number(row.get("TOTAL_VALUE") or row.get("total_value"))
            insights.append({
                "category": "Business KPI",
                "title": f"{col_name} summary",
                "summary": f"{col_name} has an average of {avg_value:,.2f} and total of {total_value:,.2f}.",
                "confidence": "Medium",
                "sql": query,
            })
            recommended_sql.append({"label": f"{col_name} KPI summary", "sql": query})

    if date_cols:
        date_name = _col(date_cols[0], "COLUMN_NAME")
        date_ref = _quote(date_name)
        trend_query = (
            f"SELECT TO_CHAR(DATE_TRUNC('MONTH', {date_ref}), 'YYYY-MM') AS period, COUNT(*) AS row_count "
            f"FROM {table_ref} WHERE {date_ref} IS NOT NULL "
            f"GROUP BY DATE_TRUNC('MONTH', {date_ref}) ORDER BY period DESC LIMIT 6"
        )
        if db.use_mock:
            trend_query = (
                f"SELECT strftime('%Y-%m', {date_ref}) AS period, COUNT(*) AS row_count "
                f"FROM {table_ref} WHERE {date_ref} IS NOT NULL GROUP BY strftime('%Y-%m', {date_ref}) ORDER BY period DESC LIMIT 6"
            )
        trend_res = _run(trend_query, f"Insight trend for {date_name}")
        trend_rows = trend_res.get("data", []) if trend_res.get("success") else []
        if len(trend_rows) >= 2:
            newest = trend_rows[0]
            previous = trend_rows[1]
            newest_count = _safe_number(newest.get("ROW_COUNT") or newest.get("row_count"))
            previous_count = _safe_number(previous.get("ROW_COUNT") or previous.get("row_count"))
            pct = ((newest_count - previous_count) / previous_count * 100) if previous_count else 0
            direction = "increased" if pct >= 0 else "decreased"
            insights.append({
                "category": "Trend",
                "title": f"Monthly volume {direction}",
                "summary": f"Rows by {date_name} {direction} {abs(pct):.1f}% in the latest month versus the previous month.",
                "confidence": "Medium",
                "sql": trend_query,
                "data": list(reversed(trend_rows)),
            })
        else:
            insights.append({
                "category": "Trend",
                "title": "Trend candidate found",
                "summary": f"{date_name} can be used for time-based volume trend analysis, but there were not enough monthly buckets to calculate MoM change.",
                "confidence": "Low",
                "sql": trend_query,
            })
        recommended_sql.append({"label": f"Monthly trend by {date_name}", "sql": trend_query})

    for col in category_cols[:3]:
        col_name = _col(col, "COLUMN_NAME")
        col_ref = _quote(col_name)
        query = (
            f"SELECT {col_ref} AS value, COUNT(*) AS row_count "
            f"FROM {table_ref} WHERE {col_ref} IS NOT NULL GROUP BY {col_ref} ORDER BY row_count DESC LIMIT 10"
        )
        res = _run(query, f"Insight category split for {col_name}")
        rows = res.get("data", []) if res.get("success") else []
        if rows:
            top = rows[0]
            top_value = top.get("VALUE") or top.get("value")
            top_count = _safe_number(top.get("ROW_COUNT") or top.get("row_count"))
            share = (top_count / row_count * 100) if row_count else 0
            insights.append({
                "category": "Business KPI",
                "title": f"{col_name} distribution",
                "summary": f"{top_value} is the most common {col_name} value, representing about {share:.1f}% of rows.",
                "confidence": "Medium",
                "sql": query,
                "data": rows,
            })
            recommended_sql.append({"label": f"Top {col_name} values", "sql": query})

    for col in numeric_cols[:4]:
        col_name = _col(col, "COLUMN_NAME")
        col_ref = _quote(col_name)
        query = (
            f"SELECT AVG({col_ref}) AS avg_value, STDDEV({col_ref}) AS std_value, "
            f"MIN({col_ref}) AS min_value, MAX({col_ref}) AS max_value FROM {table_ref} WHERE {col_ref} IS NOT NULL"
        )
        if db.use_mock:
            query = (
                f"SELECT AVG({col_ref}) AS avg_value, 0 AS std_value, MIN({col_ref}) AS min_value, MAX({col_ref}) AS max_value "
                f"FROM {table_ref} WHERE {col_ref} IS NOT NULL"
            )
        res = _run(query, f"Insight numeric anomaly candidate for {col_name}")
        if res.get("success") and res.get("data"):
            row = res.get("data", [{}])[0]
            min_value = _safe_number(row.get("MIN_VALUE") or row.get("min_value"))
            max_value = _safe_number(row.get("MAX_VALUE") or row.get("max_value"))
            avg_value = _safe_number(row.get("AVG_VALUE") or row.get("avg_value"))
            if max_value != min_value:
                insights.append({
                    "category": "Anomaly",
                    "title": f"{col_name} range check",
                    "summary": f"{col_name} ranges from {min_value:,.2f} to {max_value:,.2f}, with average {avg_value:,.2f}. Use this as a quick outlier screen.",
                    "confidence": "Medium",
                    "sql": query,
                })

    if len(numeric_cols) >= 2 and db.active_platform == "SNOWFLAKE" and not db.use_mock:
        first = _col(numeric_cols[0], "COLUMN_NAME")
        second = _col(numeric_cols[1], "COLUMN_NAME")
        corr_query = f"SELECT CORR({_quote(first)}, {_quote(second)}) AS correlation FROM {table_ref} WHERE {_quote(first)} IS NOT NULL AND {_quote(second)} IS NOT NULL"
        corr_res = _run(corr_query, f"Insight correlation {first} vs {second}")
        if corr_res.get("success") and corr_res.get("data"):
            corr = _safe_number(corr_res.get("data", [{}])[0].get("CORRELATION"))
            strength = "strong" if abs(corr) >= 0.7 else "moderate" if abs(corr) >= 0.4 else "weak"
            insights.append({
                "category": "Correlation",
                "title": f"{first} vs {second}",
                "summary": f"{first} and {second} show a {strength} correlation of {corr:.3f}.",
                "confidence": "Medium",
                "sql": corr_query,
            })
            recommended_sql.append({"label": f"Correlation: {first} vs {second}", "sql": corr_query})
    elif len(numeric_cols) >= 2:
        first = _col(numeric_cols[0], "COLUMN_NAME")
        second = _col(numeric_cols[1], "COLUMN_NAME")
        corr_query = f"SELECT {_quote(first)}, {_quote(second)} FROM {table_ref} WHERE {_quote(first)} IS NOT NULL AND {_quote(second)} IS NOT NULL LIMIT 1000"
        insights.append({
            "category": "Correlation",
            "title": "Correlation candidate",
            "summary": f"{first} and {second} are numeric columns that can be compared for correlation.",
            "confidence": "Low",
            "sql": corr_query,
        })
        recommended_sql.append({"label": f"Correlation sample: {first} vs {second}", "sql": corr_query})

    pii_columns = []
    for col in columns:
        column_name = _col(col, "COLUMN_NAME", "")
        reason = _pii_reason(column_name, _col(col, "DATA_TYPE", ""))
        if reason:
            pii_columns.append({"column": column_name, "reason": reason, "label": _column_label(column_name, _col(col, "DATA_TYPE", ""))})
    if pii_columns:
        insights.append({
            "category": "Sensitive Data",
            "title": f"{len(pii_columns)} likely sensitive columns",
            "summary": ", ".join([item["column"] for item in pii_columns[:6]]) + (" may contain PII or identifying data." if len(pii_columns) <= 6 else " and others may contain PII or identifying data."),
            "confidence": "Medium",
            "data": pii_columns,
        })

    if not insights:
        insights.append({
            "category": "Analyst Note",
            "title": "No strong insight candidates found",
            "summary": "The table did not expose obvious date, numeric, category, or sensitive columns for automatic insight generation.",
            "confidence": "Low",
        })

    return {
        "summary": {
            "row_count": row_count,
            "column_count": len(columns),
            "numeric_columns": len(numeric_cols),
            "date_columns": len(date_cols),
            "category_columns": len(category_cols),
            "pii_columns": len(pii_columns),
        },
        "insights": insights[:18],
        "recommended_sql": recommended_sql[:12],
    }


@router.get("/api/workbench/search")
async def catalog_search(database: str = "", schema: str = "", query: str = "", data_type: str = "", table_filter: str = ""):
    database = _safe_name(database) if database else ""
    schema = _safe_name(schema) if schema else ""
    query_literal = _literal(query.upper()) if query else ""
    table_filter_literal = _literal(table_filter.upper()) if table_filter else ""
    if db.use_mock:
        sql = "SELECT table_catalog, table_schema, table_name, column_name, data_type FROM information_schema.columns"
        filters = []
        if database:
            filters.append(f"table_catalog = '{database}'")
        if schema:
            filters.append(f"table_schema = '{_literal(schema)}'")
        if query:
            filters.append(f"(UPPER(table_name) LIKE '%{query_literal}%' OR UPPER(column_name) LIKE '%{query_literal}%')")
        if data_type:
            filters.append(f"UPPER(data_type) LIKE '%{_literal(data_type.upper())}%'")
        if filters:
            sql += " WHERE " + " AND ".join(filters)
    else:
        prefix = f"{_quote(database)}." if database and db.active_platform == "SNOWFLAKE" else ""
        sql = f"SELECT table_catalog, table_schema, table_name, column_name, data_type FROM {prefix}information_schema.columns"
        filters = []
        if schema:
            filters.append(f"table_schema = '{_literal(schema)}'")
        if query:
            filters.append(f"(UPPER(table_name) LIKE '%{query_literal}%' OR UPPER(column_name) LIKE '%{query_literal}%')")
        if data_type:
            filters.append(f"UPPER(data_type) LIKE '%{_literal(data_type.upper())}%'")
        if filters:
            sql += " WHERE " + " AND ".join(filters)
        sql += " LIMIT 500"
    res = _run(sql, "Catalog search")
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Search failed."))
    results = res.get("data", [])
    table_map = {}
    column_results = []
    for row in results:
        table_name = _col(row, "TABLE_NAME", "")
        column_name = _col(row, "COLUMN_NAME", "")
        data_type_value = _col(row, "DATA_TYPE", "")
        table_matches = bool(query_literal and query_literal in str(table_name).upper()) or not query_literal
        column_matches = bool(query_literal and query_literal in str(column_name).upper()) or not query_literal
        table_filter_matches = not table_filter_literal or table_filter_literal in str(table_name).upper()
        key = (
            _col(row, "TABLE_CATALOG", ""),
            _col(row, "TABLE_SCHEMA", ""),
            table_name,
        )
        if table_matches and key not in table_map:
            table_map[key] = {
                "TABLE_CATALOG": key[0],
                "TABLE_SCHEMA": key[1],
                "TABLE_NAME": key[2],
                "MATCHED_BY": "Table name",
            }
        if column_matches and table_filter_matches:
            column_results.append({
                "TABLE_CATALOG": _col(row, "TABLE_CATALOG", ""),
                "TABLE_SCHEMA": _col(row, "TABLE_SCHEMA", ""),
                "TABLE_NAME": table_name,
                "COLUMN_NAME": column_name,
                "DATA_TYPE": data_type_value,
                "MATCHED_BY": "Column name",
            })
    return {
        "results": results,
        "tables": list(table_map.values())[:250],
        "columns": column_results[:500],
    }


@router.get("/api/workbench/anomaly")
async def anomaly_scan(database: str, schema: str, table: str, column: str):
    columns = _get_columns(database, schema, table)
    target = next((c for c in columns if _col(c, "COLUMN_NAME", "").upper() == column.upper()), None)
    if not target:
        raise HTTPException(status_code=404, detail="Column not found.")
    table_ref = _table_ref(database, schema, table)
    col_ref = _quote(column)
    data_type = _col(target, "DATA_TYPE", "")
    kind = _kind(data_type)

    if kind == "numeric":
        query = f"SELECT {col_ref} AS value FROM {table_ref} WHERE {col_ref} IS NOT NULL LIMIT 10000"
        res = _run(query, "Numeric anomaly scan")
        values = sorted([float(r["VALUE"]) for r in res.get("data", []) if r.get("VALUE") is not None])
        if not values:
            return {"kind": kind, "summary": {}, "rows": [], "plot_data": {"points": [], "histogram": []}, "custom_rules": []}
        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        std = variance ** 0.5
        def is_anomaly(value):
            return bool(std and abs((value - mean) / std) > 3)

        rows = [{"value": v, "z_score": round((v - mean) / std, 4) if std else 0, "method": "|Z| > 3"} for v in values if is_anomaly(v)]
        sample_step = max(1, len(values) // 500)
        points = [
            {"index": idx, "value": value, "z_score": round((value - mean) / std, 4) if std else 0, "is_anomaly": is_anomaly(value)}
            for idx, value in enumerate(values[::sample_step])
        ]
        bin_count = min(24, max(8, int(len(values) ** 0.5)))
        min_value = min(values)
        max_value = max(values)
        bin_width = (max_value - min_value) / bin_count if max_value != min_value else 1
        bins = [{"min": min_value + i * bin_width, "max": min_value + (i + 1) * bin_width, "count": 0} for i in range(bin_count)]
        for value in values:
            bin_index = min(bin_count - 1, int((value - min_value) / bin_width)) if bin_width else 0
            bins[bin_index]["count"] += 1
        lower_z_threshold = mean - (3 * std) if std else None
        upper_z_threshold = mean + (3 * std) if std else None
        return {
            "kind": kind,
            "summary": {
                "method": "Z-Score",
                "formula": "Z = (x - mean) / stddev",
                "threshold": "|Z| > 3",
                "count": len(values),
                "mean": round(mean, 4),
                "stddev": round(std, 4),
                "lower_z_threshold": round(lower_z_threshold, 4) if lower_z_threshold is not None else None,
                "upper_z_threshold": round(upper_z_threshold, 4) if upper_z_threshold is not None else None,
            },
            "rows": rows[:100],
            "plot_data": {"points": points, "histogram": bins},
            "custom_rules": [
                {"label": "Negative amount", "sql": f"SELECT * FROM {table_ref} WHERE {col_ref} < 0 LIMIT 100;"},
                {"label": "Z-score anomalies", "sql": f"SELECT * FROM {table_ref} WHERE ABS(({col_ref} - {mean}) / NULLIF({std}, 0)) > 3 LIMIT 100;"},
            ],
        }
    if kind == "date":
        query = f"SELECT CAST({col_ref} AS DATE) AS activity_date, COUNT(*) AS row_count FROM {table_ref} WHERE {col_ref} IS NOT NULL GROUP BY CAST({col_ref} AS DATE) ORDER BY activity_date"
        res = _run(query, "Date anomaly scan")
        rows = res.get("data", []) if res.get("success") else []
        counts = [float(r.get("ROW_COUNT", 0) or 0) for r in rows]
        window = 7
        threshold = 3
        plot_rows = []
        anomalies = []
        for idx, row in enumerate(rows):
            start = max(0, idx - window // 2)
            end = min(len(counts), idx + window // 2 + 1)
            local_values = counts[start:end]
            rolling_median = _median(local_values)
            mad = _median([abs(value - rolling_median) for value in local_values])
            modified_z = (0.6745 * (counts[idx] - rolling_median) / mad) if mad else 0
            enriched = {
                **row,
                "ROLLING_MEDIAN": round(rolling_median, 4),
                "MAD": round(mad, 4),
                "MODIFIED_Z": round(modified_z, 4),
                "IS_ANOMALY": abs(modified_z) > threshold,
            }
            plot_rows.append(enriched)
            if enriched["IS_ANOMALY"]:
                anomalies.append(enriched)
        return {
            "kind": kind,
            "summary": {"method": "Median Absolute Deviation", "formula": "Modified Z = 0.6745 * (x - rolling_median) / MAD", "threshold": f"|Modified Z| > {threshold}", "days": len(rows), "rolling_window_days": window},
            "rows": anomalies[:100],
            "plot_data": {"series": plot_rows},
            "custom_rules": [{"label": "Missing date", "sql": f"SELECT * FROM {table_ref} WHERE {col_ref} IS NULL LIMIT 100;"}]
        }

    query = f"SELECT {col_ref} AS value, COUNT(*) AS count FROM {table_ref} WHERE {col_ref} IS NOT NULL GROUP BY {col_ref} ORDER BY count ASC LIMIT 100"
    res = _run(query, "Text rarity anomaly scan")
    rows = res.get("data", []) if res.get("success") else []
    total_query = f"SELECT COUNT(*) AS total_count FROM {table_ref} WHERE {col_ref} IS NOT NULL"
    total_res = _run(total_query, "Text anomaly population count")
    total = 0
    if total_res.get("success") and total_res.get("data"):
        total = total_res.get("data", [{}])[0].get("TOTAL_COUNT") or total_res.get("data", [{}])[0].get("total_count") or 0
    total = total or sum([r.get("COUNT", 0) or 0 for r in rows]) or 1
    probability_threshold = 0.01
    rare = [{**r, "probability": round(((r.get("COUNT", 0) or 0) / total), 6), "pct": round(((r.get("COUNT", 0) or 0) / total) * 100, 4)} for r in rows if ((r.get("COUNT", 0) or 0) / total) < probability_threshold]
    plot_rows = [{**r, "probability": round(((r.get("COUNT", 0) or 0) / total), 6), "pct": round(((r.get("COUNT", 0) or 0) / total) * 100, 4), "IS_RARE": ((r.get("COUNT", 0) or 0) / total) < probability_threshold} for r in rows]
    return {"kind": kind, "summary": {"method": "Frequency Probability", "formula": "P(value) = count(value) / total", "probability_threshold": probability_threshold, "rare_threshold_pct": 1.0, "values_scanned": len(rows), "total_events": total}, "rows": rare, "plot_data": {"categories": plot_rows}, "custom_rules": [{"label": "Blank text", "sql": f"SELECT * FROM {table_ref} WHERE {col_ref} IS NULL OR TRIM({col_ref}) = '' LIMIT 100;"}]}


@router.get("/api/workbench/volume-analyzer")
async def volume_analyzer(
    database: str,
    schema: str,
    table: str,
    column: str,
    field_mode: str = "event",
    time_window: str = "all",
    granularity: str = "day",
):
    columns = _get_columns(database, schema, table)
    target = next((c for c in columns if _col(c, "COLUMN_NAME", "").upper() == column.upper()), None)
    if not target:
        raise HTTPException(status_code=404, detail="Column not found.")
    if _kind(_col(target, "DATA_TYPE", "")) != "date":
        raise HTTPException(status_code=400, detail="Volume analyzer requires a date or timestamp column.")
    table_ref = _table_ref(database, schema, table)
    return _build_volume_anomaly_result(
        table_ref,
        _col(target, "COLUMN_NAME"),
        "Table Intelligence volume analyzer",
        field_mode,
        time_window,
        granularity,
    )


def _parse_freshness_datetime(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        try:
            return datetime.strptime(str(value)[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            return None


def _freshness_expected_hours(expected_frequency: str, custom_hours: int = 24):
    freq = (expected_frequency or "daily").lower()
    if freq == "hourly":
        return 1
    if freq == "weekly":
        return 24 * 7
    if freq == "monthly":
        return 24 * 31
    if freq == "custom":
        return max(1, int(custom_hours or 24))
    return 24


def _freshness_bucket_expr(column_ref: str, expected_frequency: str):
    freq = (expected_frequency or "daily").lower()
    if db.active_platform == "SNOWFLAKE" and not db.use_mock:
        if freq == "hourly":
            return f"DATE_TRUNC('HOUR', {column_ref})"
        if freq == "weekly":
            return f"DATE_TRUNC('WEEK', {column_ref})"
        if freq == "monthly":
            return f"DATE_TRUNC('MONTH', {column_ref})"
        return f"CAST({column_ref} AS DATE)"
    if freq == "hourly":
        return f"strftime('%Y-%m-%d %H:00:00', {column_ref})"
    if freq == "monthly":
        return f"strftime('%Y-%m-01', {column_ref})"
    return f"DATE({column_ref})"


def _detect_load_pattern(trend_rows):
    parsed = []
    for row in trend_rows:
        value = _col(row, "ACTIVITY_BUCKET")
        dt = _parse_freshness_datetime(value)
        if dt:
            parsed.append(dt)
    parsed = sorted(parsed)
    if len(parsed) < 3:
        return "Insufficient history"
    gaps = [(parsed[idx] - parsed[idx - 1]).total_seconds() / 3600 for idx in range(1, len(parsed))]
    median_gap = sorted(gaps)[len(gaps) // 2]
    if median_gap <= 2:
        return "Hourly / intraday load"
    if median_gap <= 30:
        return "Daily load"
    if median_gap <= 190:
        return "Weekly load"
    return "Monthly or irregular load"


def _daily_missing_dates(trend_rows):
    dates = []
    for row in trend_rows:
        dt = _parse_freshness_datetime(_col(row, "ACTIVITY_BUCKET"))
        if dt:
            dates.append(dt.date())
    dates = sorted(set(dates))
    if len(dates) < 2:
        return []
    expected = []
    cursor = dates[0]
    while cursor <= dates[-1]:
        expected.append(cursor)
        cursor += timedelta(days=1)
    present = set(dates)
    return [day.isoformat() for day in expected if day not in present][:30]


@router.get("/api/workbench/freshness")
async def freshness_scan(
    database: str,
    schema: str,
    table: str = "",
    frequency: str = "",
    date_column: str = "",
    expected_frequency: str = "daily",
    custom_hours: int = 24,
):
    database = _safe_name(database)
    schema = _safe_name(schema)
    targets = [_safe_name(table)] if table else db.get_tables(database, schema, "ALL")[:25]
    results = []
    expected_frequency = (expected_frequency or "daily").lower()
    expected_hours = _freshness_expected_hours(expected_frequency, custom_hours)
    now_utc = datetime.now(timezone.utc)
    for table_name in targets:
        columns = _get_columns(database, schema, table_name)
        date_cols = [c for c in columns if _kind(_col(c, "DATA_TYPE", "")) == "date"]
        if not date_cols:
            results.append({
                "table_name": table_name,
                "date_column": None,
                "last_seen": None,
                "age_days": None,
                "age_hours": None,
                "expected_frequency": expected_frequency,
                "expected_hours": expected_hours,
                "status": "no_date_field",
                "message": "No date or timestamp field found for freshness check.",
            })
            continue
        selected_date_col = None
        if table and date_column:
            selected_date_col = next((c for c in date_cols if _col(c, "COLUMN_NAME", "").upper() == date_column.upper()), None)
            if not selected_date_col:
                results.append({
                    "table_name": table_name,
                    "date_column": date_column,
                    "last_seen": None,
                    "age_days": None,
                    "age_hours": None,
                    "expected_frequency": expected_frequency,
                    "expected_hours": expected_hours,
                    "status": "invalid_date_field",
                    "message": "Selected freshness field is not a date or timestamp column.",
                })
                continue
        selected_date_col = selected_date_col or date_cols[0]
        date_col_name = _col(selected_date_col, "COLUMN_NAME")
        date_col = _quote(date_col_name)
        table_ref = _table_ref(database, schema, table_name)
        summary_sql = (
            f"SELECT MIN({date_col}) AS first_seen, MAX({date_col}) AS last_seen, "
            f"COUNT(*) AS total_rows FROM {table_ref} WHERE {date_col} IS NOT NULL"
        )
        res = _run(summary_sql, f"Freshness scan for {table_name}")
        summary_row = res.get("data", [{}])[0] if res.get("success") and res.get("data") else {}
        first_seen = _col(summary_row, "FIRST_SEEN")
        last_seen = _col(summary_row, "LAST_SEEN")
        total_rows = _col(summary_row, "TOTAL_ROWS", 0) or 0
        age_days = None
        age_hours = None
        expected_next_load = None
        status = "unknown"
        parsed_last_seen = _parse_freshness_datetime(last_seen)
        if parsed_last_seen:
            age_hours = round((now_utc - parsed_last_seen).total_seconds() / 3600, 2)
            age_days = round(age_hours / 24, 2)
            expected_next_load = (parsed_last_seen + timedelta(hours=expected_hours)).isoformat()
            if age_hours <= expected_hours:
                status = "fresh"
            elif age_hours <= expected_hours * 2:
                status = "warning"
            else:
                status = "stale"

        bucket_expr = _freshness_bucket_expr(date_col, expected_frequency)
        trend_sql = (
            f"SELECT {bucket_expr} AS activity_bucket, COUNT(*) AS row_count "
            f"FROM {table_ref} WHERE {date_col} IS NOT NULL "
            f"GROUP BY {bucket_expr} ORDER BY activity_bucket DESC LIMIT 60"
        )
        trend_res = _run(trend_sql, f"Freshness trend for {table_name}")
        trend_rows = list(reversed(trend_res.get("data", []) if trend_res.get("success") else []))
        latest_bucket = trend_rows[-1] if trend_rows else {}
        previous_bucket = trend_rows[-2] if len(trend_rows) > 1 else {}
        latest_rows = _col(latest_bucket, "ROW_COUNT", 0) or 0
        previous_rows = _col(previous_bucket, "ROW_COUNT", 0) or 0
        volume_change_pct = None
        if previous_rows:
            volume_change_pct = round(((latest_rows - previous_rows) / previous_rows) * 100, 2)

        missing_dates = _daily_missing_dates(trend_rows) if expected_frequency in ("daily", "custom") else []
        load_pattern = _detect_load_pattern(trend_rows)
        sql_checks = [
            {"check": "Last seen timestamp", "sql": summary_sql},
            {"check": "Volume trend by expected frequency", "sql": trend_sql},
            {"check": "Rows newer than SLA window", "sql": f"SELECT COUNT(*) AS rows_in_sla_window FROM {table_ref} WHERE {date_col} >= DATEADD('hour', -{expected_hours}, CURRENT_TIMESTAMP());"},
            {"check": "Latest period rows", "sql": f"SELECT * FROM {table_ref} WHERE {date_col} = (SELECT MAX({date_col}) FROM {table_ref}) LIMIT 100;"},
        ]
        if expected_frequency in ("daily", "custom"):
            sql_checks.append({
                "check": "Missing daily dates",
                "sql": (
                    f"WITH bounds AS (SELECT MIN(CAST({date_col} AS DATE)) AS start_date, MAX(CAST({date_col} AS DATE)) AS end_date FROM {table_ref}), "
                    f"calendar AS (SELECT DATEADD(day, seq, start_date) AS activity_date FROM bounds, (SELECT seq4() AS seq FROM TABLE(GENERATOR(ROWCOUNT => 366))) WHERE DATEADD(day, seq, start_date) <= end_date), "
                    f"actual AS (SELECT DISTINCT CAST({date_col} AS DATE) AS activity_date FROM {table_ref}) "
                    f"SELECT c.activity_date FROM calendar c LEFT JOIN actual a USING (activity_date) WHERE a.activity_date IS NULL ORDER BY c.activity_date LIMIT 100;"
                )
            })

        if status == "fresh":
            alert_recommendation = f"Healthy. Keep the {expected_frequency} freshness monitor active and alert only if age exceeds {expected_hours} hours."
        elif status == "warning":
            alert_recommendation = f"Watch closely. Trigger a warning if the next load is missed again or age crosses {expected_hours * 2} hours."
        elif status == "stale":
            alert_recommendation = "Investigate upstream load jobs, schedules, warehouse failures, or paused ingestion tasks before consumers use this table."
        else:
            alert_recommendation = "Select a valid date or timestamp field before creating an alert."

        ai_summary = (
            f"{table_name} uses {date_col_name} for freshness. Last seen is {last_seen or 'not available'}, "
            f"with age {age_hours if age_hours is not None else 'unknown'} hours against a {expected_hours}-hour SLA. "
            f"Latest bucket has {latest_rows} rows"
            f"{f', {volume_change_pct}% versus previous bucket' if volume_change_pct is not None else ''}. "
            f"Detected load pattern: {load_pattern}."
        )

        results.append({
            "table_name": table_name,
            "date_column": date_col_name,
            "first_seen": first_seen,
            "last_seen": last_seen,
            "age_days": age_days,
            "age_hours": age_hours,
            "expected_frequency": expected_frequency,
            "expected_hours": expected_hours,
            "expected_next_load": expected_next_load,
            "total_rows": total_rows,
            "latest_rows": latest_rows,
            "previous_rows": previous_rows,
            "volume_change_pct": volume_change_pct,
            "load_pattern": load_pattern,
            "missing_dates": missing_dates,
            "trend": trend_rows,
            "sql_checks": sql_checks,
            "alert_recommendation": alert_recommendation,
            "ai_summary": ai_summary,
            "status": status,
        })
    if frequency:
        freq = frequency.lower()
        if freq == "daily":
            results = [r for r in results if r["status"] in ("fresh", "warning")]
        elif freq == "weekly":
            results = [r for r in results if r["age_days"] is None or r["age_days"] <= 14]
        elif freq == "monthly":
            results = [r for r in results if r["age_days"] is None or r["age_days"] <= 45]
    status_order = {"stale": 0, "warning": 1, "fresh": 2, "unknown": 3, "invalid_date_field": 4, "no_date_field": 5}
    results = sorted(results, key=lambda row: (status_order.get(row.get("status"), 9), -(row.get("age_hours") or 0)))
    return {
        "summary": {
            "tables_scanned": len(results),
            "fresh": len([r for r in results if r.get("status") == "fresh"]),
            "warning": len([r for r in results if r.get("status") == "warning"]),
            "stale": len([r for r in results if r.get("status") == "stale"]),
            "no_date_field": len([r for r in results if r.get("status") == "no_date_field"]),
            "expected_frequency": expected_frequency,
            "expected_hours": expected_hours,
        },
        "results": results,
    }


@router.get("/api/workbench/query-log")
async def query_log():
    if not QUERY_LOG_PATH.exists():
        return {"queries": []}
    entries = []
    with QUERY_LOG_PATH.open("r", encoding="utf-8") as file:
        for line in file:
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return {"queries": list(reversed(entries[-500:]))}


@router.post("/api/workbench/query-log/clear")
async def clear_query_log():
    QUERY_LOG_PATH.write_text("", encoding="utf-8")
    return {"success": True, "message": "Query log cleared."}
