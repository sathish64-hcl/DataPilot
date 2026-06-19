from fastapi import APIRouter, HTTPException
from common import db

router = APIRouter()

@router.get("/api/quality/dashboard")
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
