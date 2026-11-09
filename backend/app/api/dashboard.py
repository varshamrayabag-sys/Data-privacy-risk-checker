from fastapi import APIRouter
from app.database.repository import scan_repository
from app.schemas.scan import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary, summary="Get aggregate dashboard statistics")
async def get_dashboard_summary():
    """
    Retrieves real aggregated analytics computed strictly from stored scan metadata:
    - Total scans performed
    - Average risk score
    - Severity distribution (High / Medium / Low)
    - PII entity occurrence counts
    - Recent audit activity
    """
    return await scan_repository.get_dashboard_summary()

