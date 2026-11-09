from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database.repository import scan_repository
from app.schemas.scan import ScanHistoryItem

router = APIRouter(prefix="/history", tags=["Scan History"])


@router.get("", response_model=List[ScanHistoryItem], summary="List previous scans")
async def list_history(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0)
):
    """
    Returns historical scan metadata.
    Does not contain raw unmasked sensitive user text.
    """
    return await scan_repository.list_scans(limit=limit, skip=skip)


@router.get("/{scan_id}", summary="Get scan details by ID")
async def get_scan_details(scan_id: str):
    """
    Retrieves full audit record for a given scan ID.
    """
    scan = await scan_repository.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan record '{scan_id}' not found.")
    return scan


@router.delete("/{scan_id}", summary="Delete a scan record")
async def delete_scan_record(scan_id: str):
    """
    Permanently deletes a scan record from the database.
    """
    success = await scan_repository.delete_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found or could not be removed.")
    return {"message": f"Scan '{scan_id}' successfully deleted.", "scan_id": scan_id}


@router.delete("", summary="Clear all scan history")
async def clear_all_history():
    """
    Clears all saved audit metadata.
    """
    count = await scan_repository.clear_all()
    return {"message": f"Successfully cleared {count} scan records.", "cleared_count": count}
