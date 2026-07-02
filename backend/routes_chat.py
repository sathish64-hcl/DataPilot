from fastapi import APIRouter, HTTPException
from common import db, ai, ChatRequest, SQLRequest
from semantic_resolver import resolve_semantic_schema, semantic_summary_text
from typing import Optional
from routes_table_apps import log_query
import asyncio
import re
import time

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


def _chat_schema_context(req: ChatRequest):
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
    if filters:
        query += " WHERE " + " AND ".join(filters)
    schema_res = db.execute_query(query)
    schema_rows = schema_res.get("data", []) if schema_res.get("success") else []
    semantic_resolution = resolve_semantic_schema(req.message or "", schema_rows, table_name)
    semantic_tables = [match["table"] for match in semantic_resolution.get("top_matches", [])]
    if table_name and database and schema_name:
        semantic_terms = [
            "CARD", "CREDIT", "LIMIT", "CHIP", "ACCT", "ACCOUNT", "OPEN", "DATE", "TYPE", "AMOUNT",
            "CUST", "CUSTOMER", "CLIENT", "PARTY", "TXN", "TRANSACTION", "ORDER", "CLAIM", "POLICY",
            "EMP", "EMPLOYEE", "APP", "APPLICATION", "INCIDENT", "CHANGE", "DETAIL", "DTL", "PROFILE"
        ]
        related_filters = [
            f"table_schema = '{_sql_literal(schema_name)}'",
            f"table_name <> '{_sql_literal(table_name)}'",
            "(" + " OR ".join([f"UPPER(column_name) LIKE '%{term}%' OR UPPER(table_name) LIKE '%{term}%'" for term in semantic_terms]) + ")",
        ]
        related_query = (
            f"SELECT table_name, column_name, data_type FROM {db_prefix}information_schema.columns "
            f"WHERE {' AND '.join(related_filters)} LIMIT 200"
        )
        related_res = db.execute_query(related_query)
        if related_res.get("success") and related_res.get("data"):
            schema_rows = schema_rows + related_res.get("data", [])
    schema_summary = ""
    if schema_res.get("success"):
        should_scan_all = semantic_resolution.get("gate") in ("ai_schema_scan", "needs_confirmation")
        selected_rows = schema_rows if should_scan_all and not table_name else [
            row for row in schema_rows
            if (not table_name or (row.get("TABLE_NAME") or "").upper() == table_name)
            or (row.get("TABLE_NAME") or "").upper() in semantic_tables
        ]
        if should_scan_all and table_name:
            selected_names = {table_name.upper(), *semantic_tables}
            selected_rows = [row for row in schema_rows if (row.get("TABLE_NAME") or "").upper() in selected_names]
            other_rows = [row for row in schema_rows if (row.get("TABLE_NAME") or "").upper() not in selected_names]
            selected_rows += other_rows[:800]
        related_rows = [
            row for row in schema_rows
            if table_name and (row.get("TABLE_NAME") or "").upper() != table_name
            and (row.get("TABLE_NAME") or "").upper() not in semantic_tables
        ]
        if semantic_tables:
            order = {table: idx for idx, table in enumerate(semantic_tables)}
            selected_rows = sorted(selected_rows, key=lambda row: (order.get((row.get("TABLE_NAME") or "").upper(), 999), (row.get("TABLE_NAME") or ""), (row.get("COLUMN_NAME") or "")))
        selected_limit = 1200 if should_scan_all else 200
        selected_text = "\n".join([f"Table {row['TABLE_NAME']}: {row['COLUMN_NAME']} ({row['DATA_TYPE']})" for row in selected_rows[:selected_limit]])
        related_text = "\n".join([f"Table {row['TABLE_NAME']}: {row['COLUMN_NAME']} ({row['DATA_TYPE']})" for row in related_rows[:200]])
        schema_summary = selected_text
        resolver_text = semantic_summary_text(semantic_resolution)
        if resolver_text:
            schema_summary = resolver_text + "\n\n" + schema_summary
        if semantic_resolution.get("gate") in ("ai_schema_scan", "needs_confirmation"):
            schema_summary = (
                "Resolver Confidence Gate:\n"
                f"Gate={semantic_resolution.get('gate')}, Best score={semantic_resolution.get('best_score')}, Confidence={semantic_resolution.get('confidence')}.\n"
                "If AI is enabled, scan the full table/column list below and choose only real tables and fields. "
                "Do not invent table names or columns. Explain the chosen table/field mapping.\n\n"
                + schema_summary
            )
        if related_text:
            schema_summary += "\n\nRelated same-schema candidate fields that may better match the user question:\n" + related_text
        if database and schema_name:
            sample_hints = _schema_sample_hints(schema_rows, database, schema_name, table_name)
            if sample_hints:
                schema_summary += "\n\nColumn sample value hints:\n" + sample_hints
    db_ctx = f"Active DB Context: Database={database or 'None'}, Schema={schema_name or 'None'}, Table={table_name or 'None'}"
    return database, schema_name, table_name, schema_summary, db_ctx, semantic_resolution, schema_rows


def _schema_sample_hints(schema_rows, database: str, schema_name: str, selected_table: str = ""):
    table_columns = {}
    for row in schema_rows:
        table = (row.get("TABLE_NAME") or "").upper()
        col = (row.get("COLUMN_NAME") or "").upper()
        dtype = (row.get("DATA_TYPE") or "").upper()
        if not table or not col:
            continue
        table_columns.setdefault(table, []).append({"name": col, "type": dtype})

    if not table_columns:
        return ""

    priority_terms = (
        "AMOUNT", "LIMIT", "CREDIT", "DEBIT", "CARD", "TYPE", "CHIP",
        "DATE", "OPEN", "ACCT", "ACCOUNT", "BALANCE", "STATUS"
    )
    selected = selected_table.upper() if selected_table else ""
    ordered_tables = []
    if selected and selected in table_columns:
        ordered_tables.append(selected)
    for table in table_columns:
        if table not in ordered_tables and any(term in table for term in ("CARD", "ACCOUNT", "TRANSACTION", "CUSTOMER")):
            ordered_tables.append(table)
    for table in table_columns:
        if table not in ordered_tables:
            ordered_tables.append(table)

    hints = []
    for table in ordered_tables[:8]:
        columns = table_columns[table]
        sample_cols = [
            col["name"] for col in columns
            if any(term in col["name"] for term in priority_terms)
            or col["type"] in ("VARCHAR", "TEXT", "STRING", "BOOLEAN", "DATE", "TIMESTAMP", "NUMBER", "FLOAT", "INTEGER")
        ][:10]
        if not sample_cols:
            continue
        select_list = ", ".join([_quote_identifier(col) for col in sample_cols[:8]])
        query = f'SELECT {select_list} FROM {_quote_identifier(database)}.{_quote_identifier(schema_name)}.{_quote_identifier(table)} LIMIT 8'
        try:
            res = db.execute_query(query)
        except Exception:
            continue
        if not res.get("success") or not res.get("data"):
            continue
        parts = []
        for col in sample_cols[:8]:
            values = []
            for row in res.get("data", []):
                value = row.get(col)
                if value is not None and value not in values:
                    values.append(value)
                if len(values) >= 3:
                    break
            if not values:
                continue
            parts.append(f"{col} samples={values}")
        if parts:
            marker = "selected table" if table == selected else "candidate table"
            hints.append(f"{table} ({marker}): " + "; ".join(parts))
    return "\n".join(hints[:8])


def _qualify_generated_sql(sql: str, database: str, schema_name: str):
    if not sql or not database or not schema_name:
        return sql
    if database.lower() in sql.lower():
        return sql
    tables_list = db.get_tables(database, schema_name)
    qualified = sql
    for t in tables_list:
        pattern = re.compile(rf"\b{t}\b", re.IGNORECASE)
        qualified = pattern.sub(f"{database}.{schema_name}.{t}", qualified)
        qualified = qualified.replace(f"{database}.{schema_name}.{database}", database)
    return qualified


SQL_KEYWORDS = {
    "select", "from", "where", "join", "left", "right", "inner", "outer", "full", "cross", "on", "as", "and", "or",
    "group", "by", "order", "having", "limit", "offset", "case", "when", "then", "else", "end", "distinct", "with",
    "count", "sum", "avg", "min", "max", "round", "cast", "try_cast", "try_to_date", "try_to_timestamp",
    "regexp_replace", "replace", "dateadd", "current_date", "true", "false", "null", "is", "not", "in", "between",
    "like", "desc", "asc", "number", "varchar", "date", "timestamp",
}


def _schema_map(schema_rows):
    mapping = {}
    for row in schema_rows or []:
        table = (row.get("TABLE_NAME") or row.get("table_name") or "").upper()
        column = (row.get("COLUMN_NAME") or row.get("column_name") or "").upper()
        if table and column:
            mapping.setdefault(table, set()).add(column)
    return mapping


def _strip_sql_literals(sql: str):
    no_strings = re.sub(r"'(?:''|[^'])*'", "''", sql or "")
    return re.sub(r"--.*?$|/\*.*?\*/", " ", no_strings, flags=re.MULTILINE | re.DOTALL)


def _sql_validation_firewall(sql: str, schema_rows, database: str = "", schema_name: str = ""):
    schema = _schema_map(schema_rows)
    validation = {
        "status": "passed",
        "blocked": False,
        "checked_tables": [],
        "checked_columns": [],
        "missing_tables": [],
        "missing_columns": [],
        "warnings": [],
    }
    if not sql:
        validation.update({"status": "blocked", "blocked": True, "warnings": ["No SQL was generated."]})
        return validation
    cleaned = _strip_sql_literals(sql)
    table_refs = _extract_table_refs(sql)
    table_by_alias = {}
    for ref in table_refs:
        table = (ref.get("table") or "").upper()
        if not table:
            continue
        validation["checked_tables"].append(table)
        if schema and table not in schema:
            validation["missing_tables"].append(table)
    for match in re.finditer(r"\b(?:from|join)\s+([\"A-Za-z0-9_.$]+)(?:\s+(?:as\s+)?([A-Za-z_][A-Za-z0-9_]*))?", cleaned, flags=re.IGNORECASE):
        raw_table = match.group(1).strip('"')
        alias = (match.group(2) or "").upper()
        table = raw_table.split(".")[-1].strip('"').upper()
        if alias and alias.lower() not in SQL_KEYWORDS:
            table_by_alias[alias] = table
        table_by_alias[table] = table

    for qualifier, column in re.findall(r"\b([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b", cleaned):
        q_upper = qualifier.upper()
        col_upper = column.upper()
        if q_upper in (database or "").upper() or q_upper in (schema_name or "").upper():
            continue
        table = table_by_alias.get(q_upper, q_upper)
        validation["checked_columns"].append(f"{q_upper}.{col_upper}")
        if schema and table in schema and col_upper not in schema[table]:
            validation["missing_columns"].append(f"{table}.{col_upper}")

    if not validation["checked_tables"]:
        validation["warnings"].append("No table reference was detected in generated SQL.")
    if validation["missing_tables"] or validation["missing_columns"]:
        validation["status"] = "blocked"
        validation["blocked"] = True
    elif validation["warnings"]:
        validation["status"] = "warning"
    return validation


def _execute_preview(sql: str, limit: int = 100):
    if not sql:
        return {"success": False, "error": "No SQL was generated.", "execution_time_ms": 0, "rows_returned": 0, "preview": []}
    started = time.perf_counter()
    try:
        res = db.execute_query(_limited_sql(sql, limit))
        elapsed = (time.perf_counter() - started) * 1000
        if res.get("success"):
            rows = res.get("data", [])[:limit]
            return {
                "success": True,
                "execution_time_ms": round(elapsed, 1),
                "rows_returned": len(rows),
                "columns": res.get("columns") or (list(rows[0].keys()) if rows else []),
                "preview": rows[:10],
                "row_limit": limit,
            }
        return {"success": False, "error": res.get("error", "SQL execution failed."), "execution_time_ms": round(elapsed, 1), "rows_returned": 0, "preview": []}
    except Exception as exc:
        return {"success": False, "error": str(exc), "execution_time_ms": round((time.perf_counter() - started) * 1000, 1), "rows_returned": 0, "preview": []}


def _timeline_step(step_id: str, label: str, status: str, detail: str, metrics=None):
    return {
        "id": step_id,
        "label": label,
        "status": status,
        "detail": detail,
        "metrics": metrics or {},
    }


def _build_explainability_timeline(
    label: str,
    semantic_resolution: dict,
    generated: dict,
    sql: str,
    sql_validation: dict,
    execution: dict,
    started: float,
    error=None,
):
    metadata = generated.get("ai_metadata", {}) if isinstance(generated, dict) else {}
    resolver_gate = (semantic_resolution or {}).get("gate") or "not_available"
    resolver_status = "passed" if resolver_gate == "native_ready" else ("review" if resolver_gate in ("ai_schema_scan", "needs_confirmation") else "info")
    validation_blocked = bool((sql_validation or {}).get("blocked"))
    validation_status = "blocked" if validation_blocked else ("passed" if sql_validation else "not_run")
    cache_status = "hit" if metadata.get("cache_hit") else ("miss" if metadata.get("cache_hit") is False else "not_used")
    token_total = int(metadata.get("prompt_tokens", 0) or 0) + int(metadata.get("completion_tokens", 0) or 0)
    repair = generated.get("repair") if isinstance(generated, dict) else None
    mode = metadata.get("processing_mode") or label
    provider = metadata.get("provider") or ("Native" if label == "Native" else "AI")
    model = metadata.get("model") or ("Rules" if provider == "Native" else "Configured model")
    steps = [
        _timeline_step(
            "schema_scope",
            "Schema Scope",
            "passed" if (semantic_resolution or {}).get("best_table") else "review",
            f"{(semantic_resolution or {}).get('best_table') or 'All available tables'} selected from {(semantic_resolution or {}).get('confidence', 'unknown')} resolver confidence.",
            {
                "gate": resolver_gate,
                "candidate_count": len((semantic_resolution or {}).get("top_matches", []) or []),
            },
        ),
        _timeline_step(
            "resolver_gate",
            "Resolver Confidence Gate",
            resolver_status,
            "Native can proceed directly." if resolver_gate == "native_ready" else "Confidence was low enough to require broader AI/schema review or user confirmation.",
            {
                "best_score": (semantic_resolution or {}).get("best_score"),
                "threshold": (semantic_resolution or {}).get("thresholds", {}).get("native_ready"),
            },
        ),
        _timeline_step(
            "generation",
            "SQL Generation Path",
            "passed" if sql else ("blocked" if error else "review"),
            f"{mode} generated SQL using {provider} / {model}.",
            {
                "time_ms": metadata.get("processing_time_ms"),
                "confidence": metadata.get("confidence"),
                "fallback_used": bool(metadata.get("fallback_used")),
            },
        ),
        _timeline_step(
            "cache_budget",
            "Cache and Budget Check",
            "passed" if cache_status == "hit" else ("review" if cache_status == "miss" else "info"),
            "Prompt Reuse Cache served this response with zero provider tokens." if cache_status == "hit" else "Provider tokens were allowed by the Token Budget Guardrail." if cache_status == "miss" else "No provider cache/budget check was needed for this native step.",
            {
                "cache": cache_status,
                "cache_key": metadata.get("cache_key"),
                "tokens": token_total,
                "tokens_saved": int(metadata.get("cached_prompt_tokens_saved", 0) or 0) + int(metadata.get("cached_completion_tokens_saved", 0) or 0),
            },
        ),
        _timeline_step(
            "sql_firewall",
            "SQL Validation Firewall",
            validation_status,
            "SQL references matched live metadata." if validation_status == "passed" else "SQL was blocked because it referenced unknown tables or fields." if validation_status == "blocked" else "Validation did not run because no SQL was available.",
            {
                "tables_checked": len((sql_validation or {}).get("checked_tables", []) or []),
                "fields_checked": len((sql_validation or {}).get("checked_columns", []) or []),
                "warnings": len((sql_validation or {}).get("warnings", []) or []),
            },
        ),
    ]
    if repair:
        steps.append(_timeline_step(
            "repair",
            "Auto Repair Loop",
            "passed" if repair.get("success") else "review",
            "AI repaired the SQL after validation or execution feedback." if repair.get("success") else "AI attempted repair but the query still needs review.",
            {"attempted": True},
        ))
    steps.append(_timeline_step(
        "execution",
        "Execution Preview",
        "passed" if execution.get("success") else ("blocked" if validation_blocked else "review"),
        f"Returned {execution.get('rows_returned', 0)} preview rows." if execution.get("success") else execution.get("error", "Execution was skipped or did not complete."),
        {
            "execution_time_ms": execution.get("execution_time_ms", 0),
            "rows": execution.get("rows_returned", 0),
        },
    ))
    if error:
        steps.append(_timeline_step("error", "Pipeline Error", "blocked", str(error), {}))
    return {
        "label": label,
        "total_time_ms": round((time.perf_counter() - started) * 1000, 1),
        "status": "blocked" if validation_blocked or error else ("passed" if execution.get("success") else "review"),
        "steps": steps,
    }


def _pipeline_result(label: str, generated: dict, sql: str, started: float, execution: dict, error=None, sql_validation=None, semantic_resolution=None):
    metadata = generated.get("ai_metadata", {}) if isinstance(generated, dict) else {}
    total_ms = (time.perf_counter() - started) * 1000
    suggestions = []
    if sql:
        if re.search(r"select\s+\*", sql, flags=re.IGNORECASE):
            suggestions.append("Replace SELECT * with only the fields needed for the answer.")
        if not re.search(r"\bwhere\b", sql, flags=re.IGNORECASE):
            suggestions.append("Add a selective WHERE clause, preferably on a date or partition-like field.")
        if not re.search(r"\blimit\s+\d+\b", sql, flags=re.IGNORECASE):
            suggestions.append("Use a LIMIT for exploration and demos.")
    return {
        "label": label,
        "success": not error and bool(sql) and not (sql_validation or {}).get("blocked"),
        "generated_sql": sql or "",
        "explanation": (generated or {}).get("explanation") or (generated or {}).get("reply") or "",
        "optimization_suggestions": suggestions or ["No obvious SQL-shape issues detected."],
        "total_processing_time_ms": round(total_ms, 1),
        "sql_execution_time_ms": execution.get("execution_time_ms", 0),
        "rows_returned": execution.get("rows_returned", 0),
        "columns": execution.get("columns", []),
        "preview": execution.get("preview", []),
        "execution_success": execution.get("success", False),
        "execution_error": execution.get("error", ""),
        "confidence": (generated or {}).get("confidence") or metadata.get("confidence") or ("Heuristic" if label == "Native" else "Provider response"),
        "tokens": {
            "prompt": metadata.get("prompt_tokens", 0),
            "completion": metadata.get("completion_tokens", 0),
            "total": int(metadata.get("prompt_tokens", 0) or 0) + int(metadata.get("completion_tokens", 0) or 0),
        },
        "estimated_api_cost": round(((int(metadata.get("prompt_tokens", 0) or 0) + int(metadata.get("completion_tokens", 0) or 0)) / 1000) * 0.002, 6),
        "ai_metadata": metadata,
        "error": str(error) if error else "",
        "repair": generated.get("repair") if isinstance(generated, dict) else None,
        "sql_validation": sql_validation or {},
        "explainability_timeline": _build_explainability_timeline(label, semantic_resolution or {}, generated or {}, sql or "", sql_validation or {}, execution or {}, started, error),
    }


def _compare_summary(prompt: str, native: dict, ai_result: dict):
    native_ok = native.get("success") and native.get("execution_success")
    ai_ok = ai_result.get("success") and ai_result.get("execution_success")
    native_sql = native.get("generated_sql", "")
    ai_sql = ai_result.get("generated_sql", "")
    prompt_text = (prompt or "").lower()
    ai_has_where = bool(re.search(r"\bwhere\b", ai_sql, flags=re.IGNORECASE))
    native_select_star = bool(re.search(r"select\s+\*", native_sql, flags=re.IGNORECASE))
    ai_select_star = bool(re.search(r"select\s+\*", ai_sql, flags=re.IGNORECASE))
    native_is_preview = native_select_star and not re.search(r"\b(count|sum|avg|min|max|group\s+by|where|join|having)\b", native_sql, flags=re.IGNORECASE)
    ai_is_targeted = bool(re.search(r"\b(count|sum|avg|min|max|group\s+by|where|join|having)\b", ai_sql, flags=re.IGNORECASE))
    question_needs_logic = any(token in prompt_text for token in (
        "how many", "count", "more than", "less than", "within", "last", "trend", "average",
        "total", "highest", "lowest", "with ", "where", "by ", "opened", "limit", "credit"
    ))
    ai_suggestions = [s for s in ai_result.get("optimization_suggestions", []) if "No obvious" not in s]
    native_time = float(native.get("total_processing_time_ms") or 0)
    ai_time = float(ai_result.get("total_processing_time_ms") or 0)
    time_delta = round(ai_time - native_time, 1)

    def intent_score(sql: str):
        lowered_sql = (sql or "").lower()
        score = 0
        matched = []
        if not lowered_sql:
            return score, matched
        if re.search(r"\bcount\s*\(", lowered_sql) and any(token in prompt_text for token in ("how many", "count")):
            score += 25
            matched.append("uses COUNT for a count question")
        if re.search(r"\bwhere\b", lowered_sql):
            score += 20
            matched.append("applies filtering criteria")
        if re.search(r"select\s+\*", lowered_sql):
            score -= 25
            matched.append("uses broad SELECT * instead of an answer-shaped projection")
        if any(token in prompt_text for token in ("more than", "less than", "within", "last", "opened", "10k", "10000")) and re.search(r"(>|<|between|dateadd|try_to_date|try_to_timestamp|current_date)", lowered_sql):
            score += 20
            matched.append("models threshold or date-window logic")
        if any(token in prompt_text for token in ("credit", "limit")) and "credit" in lowered_sql and "limit" in lowered_sql:
            score += 15
            matched.append("uses the credit-limit field concept")
        if "chip" in prompt_text and "chip" in lowered_sql:
            score += 10
            matched.append("uses chip criteria")
        if "debit" in prompt_text and "debit" in lowered_sql:
            score += 10
            matched.append("uses debit-card criteria")
        if any(token in prompt_text for token in ("card", "cards", "debit", "credit")) and "card" in lowered_sql:
            score += 10
            matched.append("selects a card-oriented table or field")
        if any(token in prompt_text for token in ("$", "10k", "10000", "amount", "credit limit")) and re.search(r"(regexp_replace|replace|try_cast|try_to_number)", lowered_sql):
            score += 15
            matched.append("handles formatted numeric text safely")
        if any(token in prompt_text for token in ("opened", "last", "year", "date")) and re.search(r"(try_to_date|try_to_timestamp|dateadd|current_date)", lowered_sql):
            score += 15
            matched.append("handles date logic safely")
        return score, matched

    native_score, native_matches = intent_score(native_sql)
    ai_score, ai_matches = intent_score(ai_sql)
    ai_quality_lead = ai_score > native_score + 15

    reasons = []
    if ai_ok and native_ok and (ai_quality_lead or (native_is_preview and ai_is_targeted and question_needs_logic)):
        recommended = "AI"
        if native_is_preview:
            reasons.append("Native returned a broad table preview instead of answering the business question.")
        else:
            reasons.append(f"AI matched the user's intent more closely than Native (AI score {ai_score}, Native score {native_score}).")
        reasons.append("AI translated the prompt into targeted SQL with filters, aggregation, table choice, or conversion logic aligned to the requested criteria.")
    elif ai_ok and not native_ok:
        recommended = "AI"
        reasons.append("AI produced executable SQL while the native pipeline did not complete successfully.")
    elif native_ok and not ai_ok:
        recommended = "Native"
        reasons.append("Native completed successfully while the AI pipeline failed or returned non-executable SQL.")
    elif ai_sql and (native_select_star and not ai_select_star):
        recommended = "AI"
        reasons.append("AI generated more selective SQL by avoiding SELECT *.")
    elif ai_sql and ai_has_where and not re.search(r"\bwhere\b", native_sql, flags=re.IGNORECASE):
        recommended = "AI"
        reasons.append("AI added filtering logic that can reduce scanned data.")
    elif native_time and ai_time and native_time < ai_time * 0.55 and native_score >= ai_score - 5:
        recommended = "Native"
        reasons.append("Native was materially faster and produced a result with similar intent coverage.")
    else:
        recommended = "AI" if ai_ok else "Native"
        reasons.append("AI provides richer explanations and optimization context for demo and analyst workflows." if ai_ok else "Native is the reliable fallback for this prompt.")

    if ai_suggestions:
        reasons.append("AI surfaced optimization suggestions that the native path does not deeply reason about.")
    if time_delta > 0:
        perf = f"AI took {time_delta} ms longer overall, mostly due to provider response time."
    elif time_delta < 0:
        perf = f"AI was {abs(time_delta)} ms faster overall for this run."
    else:
        perf = "Both pipelines had similar total processing time."

    if recommended == "AI" and (ai_quality_lead or (native_is_preview and ai_is_targeted and question_needs_logic)):
        ai_strengths = ", ".join(ai_matches[:4]) if ai_matches else "it matched the requested business logic"
        native_gaps = ", ".join(native_matches[:2]) if native_matches else "it did not encode the requested criteria"
        why_ai = (
            "AI won because it matched the user's question more closely than the native path. "
            f"The AI SQL {ai_strengths}, while the native SQL {native_gaps}. "
            "Execution speed is secondary here because a fast generic preview is still the wrong answer when the user asked for a filtered business count."
        )
    elif recommended == "AI":
        why_ai = "AI won because it added analyst-friendly explanation, optimization guidance, and business context around the SQL."
        if ai_suggestions:
            why_ai += f" It also surfaced practical SQL improvements such as: {' '.join(ai_suggestions[:2])}"
    else:
        why_ai = "AI did not win this run because native execution was faster or more reliable for the specific prompt."

    return {
        "prompt": prompt,
        "recommended": recommended,
        "readability": "AI SQL is more useful here because it encodes the requested business logic instead of returning a raw row sample." if native_is_preview and ai_is_targeted else ("AI SQL is usually easier to present when it includes concise aliases, filters, and explanation." if ai_sql else "AI SQL was not available."),
        "performance": perf,
        "ai_optimization": "Yes" if ai_suggestions else "No clear extra AI optimization suggestions were generated.",
        "business_insights": "AI converted the natural-language criteria into executable business logic; native focused on deterministic schema-driven SQL." if native_is_preview and ai_is_targeted else "AI can translate the result into narrative insights after execution; native focuses on deterministic SQL/result generation.",
        "cost_savings": "Potential savings are strongest when AI avoids SELECT *, adds date filters, or suggests pre-aggregation.",
        "summary": " ".join(reasons),
        "why_ai_won": why_ai,
        "intent_scores": {
            "native": native_score,
            "ai": ai_score,
            "native_matches": native_matches,
            "ai_matches": ai_matches,
            "native_sql_excerpt": native_sql[:300],
            "ai_sql_excerpt": ai_sql[:300],
        },
    }


def _native_gate_result(question: str, semantic_resolution: dict, started: float):
    candidates = semantic_resolution.get("top_matches", [])[:5]
    candidate_text = ", ".join([f"{item['table']} ({item['score']})" for item in candidates]) or "no strong candidates"
    return _pipeline_result(
        "Native",
        {
            "explanation": (
                "Native SQL generation was paused by the Resolver Confidence Gate. "
                f"Candidate tables: {candidate_text}. Switch to AI/Compare mode or choose a specific table to continue."
            ),
            "ai_metadata": {
                "processing_mode": "Native",
                "provider": "Native",
                "model": "Resolver Confidence Gate",
                "processing_time_ms": round((time.perf_counter() - started) * 1000, 1),
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "confidence": semantic_resolution.get("confidence", "Low"),
                "assumptions": "SQL was not generated because table resolution confidence was below the native threshold.",
                "fallback_used": True,
            },
        },
        "",
        started,
        {"success": False, "error": "Resolver confidence below Native threshold.", "execution_time_ms": 0, "rows_returned": 0, "preview": []},
        sql_validation={"status": "blocked", "blocked": True, "warnings": ["Resolver confidence below Native threshold."]},
        semantic_resolution=semantic_resolution,
    )


def _run_native_compare(schema_summary: str, question: str, database: str, schema_name: str, semantic_resolution: dict, schema_rows: list):
    started = time.perf_counter()
    try:
        if semantic_resolution.get("gate") != "native_ready":
            return _native_gate_result(question, semantic_resolution, started)
        generated = ai._native_generate_sql(schema_summary, question, database, schema_name)
        sql = _qualify_generated_sql(generated.get("sql", ""), database, schema_name)
        validation = _sql_validation_firewall(sql, schema_rows, database, schema_name)
        if validation.get("blocked"):
            return _pipeline_result("Native", generated, sql, started, {"success": False, "error": "SQL validation firewall blocked this query.", "execution_time_ms": 0, "rows_returned": 0, "preview": []}, sql_validation=validation, semantic_resolution=semantic_resolution)
        execution = _execute_preview(sql)
        return _pipeline_result("Native", generated, sql, started, execution, sql_validation=validation, semantic_resolution=semantic_resolution)
    except Exception as exc:
        return _pipeline_result("Native", {}, "", started, {"success": False, "error": str(exc), "execution_time_ms": 0, "rows_returned": 0, "preview": []}, exc, semantic_resolution=semantic_resolution)


def _run_ai_compare(schema_summary: str, db_ctx: str, question: str, database: str, schema_name: str, schema_rows: list, semantic_resolution: dict):
    started = time.perf_counter()
    try:
        prompt = f"{question}\nGenerate Snowflake SQL that directly answers this dataset question. Prefer grouped, chart-friendly results with concise columns. Also explain what the SQL is doing in plain English."
        generated = ai.generate_sql_ai_only(schema_summary + "\n" + db_ctx, prompt, db=database, schema=schema_name)
        sql = _qualify_generated_sql(generated.get("sql", ""), database, schema_name)
        validation = _sql_validation_firewall(sql, schema_rows, database, schema_name)
        if validation.get("blocked") and sql:
            original_sql = sql
            original_error = "SQL validation firewall blocked generated SQL: " + "; ".join(validation.get("missing_tables", []) + validation.get("missing_columns", []) + validation.get("warnings", []))
            repaired = ai.repair_sql_ai_only(schema_summary + "\n" + db_ctx, prompt, original_sql, original_error, db=database, schema=schema_name)
            repaired_sql = _qualify_generated_sql(repaired.get("sql", ""), database, schema_name)
            repaired_validation = _sql_validation_firewall(repaired_sql, schema_rows, database, schema_name)
            if repaired_sql and not repaired_validation.get("blocked"):
                generated = repaired
                generated["repair"] = {
                    "attempted": True,
                    "success": True,
                    "original_sql": original_sql,
                    "original_error": original_error,
                    "repaired_sql": repaired_sql,
                }
                sql = repaired_sql
                validation = repaired_validation
            else:
                return _pipeline_result("AI", generated, sql, started, {"success": False, "error": original_error, "execution_time_ms": 0, "rows_returned": 0, "preview": []}, sql_validation=validation, semantic_resolution=semantic_resolution)
        execution = _execute_preview(sql)
        if not execution.get("success") and sql:
            original_sql = sql
            original_error = execution.get("error", "SQL execution failed.")
            repaired = ai.repair_sql_ai_only(schema_summary + "\n" + db_ctx, prompt, original_sql, original_error, db=database, schema=schema_name)
            repaired_sql = _qualify_generated_sql(repaired.get("sql", ""), database, schema_name)
            repaired_validation = _sql_validation_firewall(repaired_sql, schema_rows, database, schema_name)
            if repaired_validation.get("blocked"):
                return _pipeline_result("AI", generated, sql, started, {"success": False, "error": "SQL validation firewall blocked repaired SQL.", "execution_time_ms": 0, "rows_returned": 0, "preview": []}, sql_validation=repaired_validation, semantic_resolution=semantic_resolution)
            repaired_execution = _execute_preview(repaired_sql)
            if repaired_sql:
                generated = repaired
                generated["repair"] = {
                    "attempted": True,
                    "success": repaired_execution.get("success", False),
                    "original_sql": original_sql,
                    "original_error": original_error,
                    "repaired_sql": repaired_sql,
                }
                sql = repaired_sql
                execution = repaired_execution
                validation = repaired_validation
        return _pipeline_result("AI", generated, sql, started, execution, sql_validation=validation, semantic_resolution=semantic_resolution)
    except Exception as exc:
        return _pipeline_result("AI", {}, "", started, {"success": False, "error": str(exc), "execution_time_ms": 0, "rows_returned": 0, "preview": []}, exc, semantic_resolution=semantic_resolution)


@router.post("/api/chat")
async def chat_assistant(req: ChatRequest):
    started = time.perf_counter()
    database, schema_name, table_name, schema_summary, db_ctx, semantic_resolution, schema_rows = _chat_schema_context(req)
    if ai.config.get("processing_mode") == "native" and semantic_resolution.get("gate") != "native_ready":
        gate_execution = {"success": False, "error": "Resolver confidence below Native threshold.", "execution_time_ms": 0, "rows_returned": 0, "preview": []}
        gate_validation = {"status": "blocked", "blocked": True, "warnings": ["Resolver confidence below Native threshold."]}
        gate_generated = {
            "explanation": "Native SQL generation was paused by the Resolver Confidence Gate.",
            "ai_metadata": {
                "processing_mode": "Native",
                "provider": "Native",
                "model": "Resolver Confidence Gate",
                "processing_time_ms": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "confidence": semantic_resolution.get("confidence", "Low"),
                "assumptions": "Native SQL generation was blocked until table resolution is confirmed.",
                "fallback_used": True,
            },
        }
        candidates = semantic_resolution.get("top_matches", [])[:5]
        candidate_text = ", ".join([f"{item['table']} ({item['confidence']}, score {item['score']})" for item in candidates]) or "no strong candidates"
        return {
            "success": True,
            "reply": (
                "I paused SQL generation because the Semantic Table Resolver confidence is below the Native threshold. "
                f"Candidate tables: {candidate_text}. Switch to AI or Compare mode to scan all tables, or choose a specific table/view."
            ),
            "sql": "",
            "visualization": {"type": "none"},
            "ai_metadata": gate_generated["ai_metadata"],
            "semantic_resolver": semantic_resolution,
            "sql_validation": gate_validation,
            "explainability_timeline": _build_explainability_timeline("Native", semantic_resolution, gate_generated, "", gate_validation, gate_execution, started),
        }
    res = ai.generate_sql(schema_summary + "\n" + db_ctx, req.message, db=database, schema=schema_name)
    sql = _qualify_generated_sql(res.get("sql", ""), database, schema_name)
    validation = _sql_validation_firewall(sql, schema_rows, database, schema_name)
    if validation.get("blocked") and ai.config.get("processing_mode") in ("ai", "compare") and sql:
        repair_error = "SQL validation firewall blocked generated SQL: " + "; ".join(validation.get("missing_tables", []) + validation.get("missing_columns", []) + validation.get("warnings", []))
        try:
            repaired = ai.repair_sql_ai_only(schema_summary + "\n" + db_ctx, req.message, sql, repair_error, db=database, schema=schema_name)
            repaired_sql = _qualify_generated_sql(repaired.get("sql", ""), database, schema_name)
            repaired_validation = _sql_validation_firewall(repaired_sql, schema_rows, database, schema_name)
            if repaired_sql and not repaired_validation.get("blocked"):
                res = repaired
                sql = repaired_sql
                validation = repaired_validation
            else:
                validation = repaired_validation
        except Exception as exc:
            validation.setdefault("warnings", []).append(f"AI repair failed: {exc}")
                
    return {
        "success": True,
        "reply": res.get("explanation", "") if not validation.get("blocked") else "SQL generation was blocked by the validation firewall because the query referenced missing tables or fields.",
        "sql": "" if validation.get("blocked") else sql,
        "visualization": res.get("visualization", {"type": "none"}),
        "ai_metadata": res.get("ai_metadata", {}),
        "semantic_resolver": semantic_resolution,
        "sql_validation": validation,
        "explainability_timeline": _build_explainability_timeline(
            res.get("ai_metadata", {}).get("processing_mode") or "Chat",
            semantic_resolution,
            res,
            "" if validation.get("blocked") else sql,
            validation,
            {"success": False, "error": "Manual execution pending.", "execution_time_ms": 0, "rows_returned": 0, "preview": []},
            started,
        ),
    }


@router.post("/api/chat/compare")
async def compare_chat_assistant(req: ChatRequest):
    database, schema_name, table_name, schema_summary, db_ctx, semantic_resolution, schema_rows = await asyncio.to_thread(_chat_schema_context, req)
    prompt = req.message.strip()
    native_task = asyncio.to_thread(_run_native_compare, schema_summary, prompt, database, schema_name, semantic_resolution, schema_rows)
    ai_task = asyncio.to_thread(_run_ai_compare, schema_summary, db_ctx, prompt, database, schema_name, schema_rows, semantic_resolution)
    native_result, ai_result = await asyncio.gather(native_task, ai_task)
    return {
        "success": True,
        "mode": "compare",
        "prompt": prompt,
        "context": {
            "database": database,
            "schema": schema_name,
            "table": table_name,
        },
        "semantic_resolver": semantic_resolution,
        "native": native_result,
        "ai": ai_result,
        "summary": _compare_summary(prompt, native_result, ai_result),
        "usage": ai.usage_snapshot(),
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
