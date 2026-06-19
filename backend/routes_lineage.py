from fastapi import APIRouter

router = APIRouter()

@router.get("/api/lineage")
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
