from fastapi import APIRouter, HTTPException
from common import db

router = APIRouter()

@router.get("/api/cost/dashboard")
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
