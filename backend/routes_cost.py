from datetime import date, datetime, timedelta

from fastapi import APIRouter, HTTPException, Query
from common import db
from collections import defaultdict

router = APIRouter()


def _get(row, name, default=None):
    return row.get(name) if name in row else row.get(name.upper(), row.get(name.lower(), default))


def _num(value, default=0.0):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def _date_key(value):
    if hasattr(value, "strftime"):
        return value.strftime("%Y-%m-%d")
    return str(value or "").split(" ")[0]


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD format.")


def _build_date_filters(days, start_date, end_date):
    try:
        days = max(1, min(int(days), 365))
    except (TypeError, ValueError):
        days = 30

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    if start and end and start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date.")

    if start or end:
        if not start:
            start = end - timedelta(days=days - 1)
        if not end:
            end = date.today()
        snowflake_filter = (
            f"start_time >= TO_TIMESTAMP_NTZ('{start.isoformat()}') "
            f"AND start_time < DATEADD(day, 1, TO_TIMESTAMP_NTZ('{end.isoformat()}'))"
        )
        mock_filter = (
            f"start_time >= datetime('{start.isoformat()}') "
            f"AND start_time < datetime('{(end + timedelta(days=1)).isoformat()}')"
        )
        range_days = (end - start).days + 1
        return snowflake_filter, mock_filter, range_days, start.isoformat(), end.isoformat()

    end = date.today()
    start = end - timedelta(days=days - 1)
    snowflake_filter = f"start_time >= DATEADD(day, -{days}, CURRENT_TIMESTAMP())"
    mock_filter = f"start_time >= datetime('now', '-{days} days')"
    return snowflake_filter, mock_filter, days, start.isoformat(), end.isoformat()


def _cost_query(query: str, mock_query: str = None):
    fallback_query = mock_query or query
    if db.use_mock:
        return db.execute_mock_query(fallback_query), "mock", "Cost Analyzer is using the local demo SQLite cost tables because the app is in mock mode."
    if db.active_platform != "SNOWFLAKE":
        return db.execute_mock_query(fallback_query), "mock", f"Cost Analyzer uses Snowflake ACCOUNT_USAGE views. Current platform is {db.active_platform}, so demo cost data is shown."
    if db.conn_snowflake is None:
        return db.execute_mock_query(fallback_query), "mock", "No active Snowflake connection was found, so demo cost data is shown."

    result = db.execute_snowflake_query(query)
    if result.get("success"):
        return result, "snowflake", "Reading from the connected Snowflake account via SNOWFLAKE.ACCOUNT_USAGE."

    return result, "snowflake_error", result.get("error", "Snowflake ACCOUNT_USAGE query failed.")


@router.get("/api/cost/dashboard")
async def get_cost_dashboard(
    days: int = 30,
    start_date: str = Query(default=None),
    end_date: str = Query(default=None)
):
    snowflake_date_filter, mock_date_filter, range_days, effective_start, effective_end = _build_date_filters(days, start_date, end_date)
    # Fetch query history
    qh_res, qh_source, qh_message = _cost_query(
        "SELECT query_id, query_text, user_name, role_name, warehouse_name, execution_status, "
        "start_time, total_elapsed_time, credits_used_cloud_services AS credits_used "
        f"FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY WHERE {snowflake_date_filter} ORDER BY credits_used DESC",
        "SELECT query_id, query_text, user_name, role_name, warehouse_name, execution_status, "
        "start_time, total_elapsed_time, credits_used "
        f"FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY WHERE {mock_date_filter} ORDER BY credits_used DESC"
    )
    # Fetch daily warehouse billing
    metering_res, metering_source, metering_message = _cost_query(
        "SELECT start_time, warehouse_name, credits_used, credits_used_compute, credits_used_cloud_services AS credits_used_cloud "
        f"FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY WHERE {snowflake_date_filter} ORDER BY start_time DESC",
        "SELECT start_time, warehouse_name, credits_used, credits_used_compute, credits_used_cloud "
        f"FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY WHERE {mock_date_filter} ORDER BY start_time DESC"
    )
    
    if not qh_res.get("success") or not metering_res.get("success"):
         raise HTTPException(
             status_code=500,
             detail=f"Failed to query Snowflake cost views. Query history: {qh_message}. Warehouse metering: {metering_message}"
         )
         
    metering_data = metering_res.get("data", [])
    query_data = qh_res.get("data", [])

    total_credits = sum(_num(_get(row, "CREDITS_USED")) for row in metering_data)
    compute_credits = sum(_num(_get(row, "CREDITS_USED_COMPUTE")) for row in metering_data)
    cloud_credits = sum(_num(_get(row, "CREDITS_USED_CLOUD")) for row in metering_data)

    warehouse_metering = defaultdict(lambda: {"credits": 0.0, "compute": 0.0, "cloud": 0.0})
    daily_costs = defaultdict(lambda: {"credits": 0.0, "compute": 0.0, "cloud": 0.0, "queries": 0})
    for row in metering_data:
        warehouse = _get(row, "WAREHOUSE_NAME", "UNKNOWN") or "UNKNOWN"
        credits = _num(_get(row, "CREDITS_USED"))
        compute = _num(_get(row, "CREDITS_USED_COMPUTE"))
        cloud = _num(_get(row, "CREDITS_USED_CLOUD"))
        date_str = _date_key(_get(row, "START_TIME"))
        warehouse_metering[warehouse]["credits"] += credits
        warehouse_metering[warehouse]["compute"] += compute
        warehouse_metering[warehouse]["cloud"] += cloud
        daily_costs[date_str]["credits"] += credits
        daily_costs[date_str]["compute"] += compute
        daily_costs[date_str]["cloud"] += cloud

    warehouse_queries = defaultdict(lambda: {"queries": 0, "elapsed": 0.0, "credits": 0.0, "failures": 0})
    user_credits = defaultdict(lambda: {"queries": 0, "credits": 0.0, "elapsed": 0.0})
    expensive_queries = []
    query_scatter = []
    failed_queries = 0
    query_credits_total = 0.0

    sorted_queries = sorted(query_data, key=lambda row: _num(_get(row, "CREDITS_USED")), reverse=True)
    for row in sorted_queries:
        warehouse = _get(row, "WAREHOUSE_NAME", "UNKNOWN") or "UNKNOWN"
        user = _get(row, "USER_NAME", "UNKNOWN") or "UNKNOWN"
        credits = _num(_get(row, "CREDITS_USED"))
        elapsed = _num(_get(row, "TOTAL_ELAPSED_TIME"))
        status = (_get(row, "EXECUTION_STATUS", "") or "").upper()
        query_id = _get(row, "QUERY_ID", "")
        query_text = _get(row, "QUERY_TEXT", "")
        date_str = _date_key(_get(row, "START_TIME"))

        warehouse_queries[warehouse]["queries"] += 1
        warehouse_queries[warehouse]["elapsed"] += elapsed
        warehouse_queries[warehouse]["credits"] += credits
        warehouse_queries[warehouse]["failures"] += 1 if status == "FAILED" else 0
        user_credits[user]["queries"] += 1
        user_credits[user]["credits"] += credits
        user_credits[user]["elapsed"] += elapsed
        daily_costs[date_str]["queries"] += 1
        failed_queries += 1 if status == "FAILED" else 0
        query_credits_total += credits

        query_scatter.append({
            "query_id": query_id,
            "user": user,
            "warehouse": warehouse,
            "elapsed_seconds": round(elapsed, 2),
            "credits": round(credits, 3),
            "status": status or "UNKNOWN",
        })
        expensive_queries.append({
            "QUERY_ID": query_id,
            "QUERY_TEXT": query_text,
            "USER_NAME": user,
            "ROLE_NAME": _get(row, "ROLE_NAME", ""),
            "WAREHOUSE_NAME": warehouse,
            "EXECUTION_STATUS": status or "UNKNOWN",
            "START_TIME": str(_get(row, "START_TIME", "")),
            "TOTAL_ELAPSED_TIME": round(elapsed, 2),
            "CREDITS_USED": round(credits, 3),
            "COST_USD": round(credits * 3, 2),
        })

    wh_breakdown = []
    for warehouse, usage in warehouse_metering.items():
        q_usage = warehouse_queries[warehouse]
        credits = usage["credits"]
        wh_breakdown.append({
            "warehouse": warehouse,
            "credits": round(credits, 2),
            "compute": round(usage["compute"], 2),
            "cloud": round(usage["cloud"], 2),
            "share_pct": round((credits / total_credits) * 100, 1) if total_credits else 0,
            "queries": q_usage["queries"],
            "avg_elapsed_seconds": round(q_usage["elapsed"] / q_usage["queries"], 2) if q_usage["queries"] else 0,
            "failures": q_usage["failures"],
        })
    wh_breakdown.sort(key=lambda row: row["credits"], reverse=True)

    daily_trend = [
        {
            "date": date,
            "credits": round(values["credits"], 2),
            "compute": round(values["compute"], 2),
            "cloud": round(values["cloud"], 2),
            "queries": values["queries"],
            "cost_usd": round(values["credits"] * 3, 2),
        }
        for date, values in sorted(daily_costs.items())
    ]

    user_breakdown = [
        {
            "user": user,
            "credits": round(values["credits"], 2),
            "queries": values["queries"],
            "avg_elapsed_seconds": round(values["elapsed"] / values["queries"], 2) if values["queries"] else 0,
            "cost_usd": round(values["credits"] * 3, 2),
        }
        for user, values in user_credits.items()
    ]
    user_breakdown.sort(key=lambda row: row["credits"], reverse=True)

    peak_day = max(daily_trend, key=lambda row: row["credits"], default={})
    top_warehouse = wh_breakdown[0] if wh_breakdown else {}
    avg_daily_credits = round(total_credits / len(daily_trend), 2) if daily_trend else 0
    avg_credit_per_query = round(query_credits_total / len(query_data), 3) if query_data else 0

    recommendations = []
    if top_warehouse:
        recommendations.append(f"{top_warehouse['warehouse']} is the largest consumer at {top_warehouse['share_pct']}% of metered credits. Review sizing and auto-suspend settings first.")
    long_queries = [row for row in expensive_queries if row["TOTAL_ELAPSED_TIME"] >= 120]
    if long_queries:
        recommendations.append(f"{len(long_queries)} long-running queries exceeded 120 seconds. Check joins, filters, clustering, and result caching.")
    if failed_queries:
        recommendations.append(f"{failed_queries} failed queries used session time. Add validation or saved SQL templates for repeat failures.")
    if cloud_credits and total_credits and (cloud_credits / total_credits) > 0.1:
        recommendations.append("Cloud services credits are above 10% of total usage. Review metadata-heavy workloads and small repeated queries.")
    if not recommendations:
        recommendations.append("Cost pattern looks stable. Keep monitoring peak days, expensive SQL, and warehouse share changes.")

    return {
        "data_source": "snowflake" if qh_source == "snowflake" and metering_source == "snowflake" else "mock",
        "source_message": qh_message if qh_source != "snowflake" else metering_message,
        "source_queries": {
            "query_history": "SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY",
            "warehouse_metering": "SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY"
        },
        "query_cost_note": "Query-level rows use CREDITS_USED_CLOUD_SERVICES from QUERY_HISTORY. Warehouse totals use WAREHOUSE_METERING_HISTORY credits.",
        "date_range_days": range_days,
        "date_range": {
            "start_date": effective_start,
            "end_date": effective_end,
        },
        "summary": {
            "total_credits_used": round(total_credits, 2),
            "estimated_cost_usd": round(total_credits * 3, 2),
            "compute_credits": round(compute_credits, 2),
            "cloud_credits": round(cloud_credits, 2),
            "active_warehouses_count": len(wh_breakdown),
            "query_count": len(query_data),
            "failed_queries": failed_queries,
            "avg_daily_credits": avg_daily_credits,
            "avg_credit_per_query": avg_credit_per_query,
            "peak_day": peak_day,
            "top_warehouse": top_warehouse,
        },
        "total_credits_used": round(total_credits, 2),
        "active_warehouses_count": len(wh_breakdown),
        "most_expensive_queries": expensive_queries[:20],
        "warehouse_credits": wh_breakdown,
        "daily_trend": daily_trend,
        "user_credits": user_breakdown,
        "query_scatter": query_scatter[:120],
        "recommendations": recommendations
    }
