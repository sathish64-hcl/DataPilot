from fastapi import APIRouter, HTTPException
from common import db, ai

router = APIRouter()

@router.get("/api/incidents")
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
