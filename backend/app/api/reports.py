from fastapi import APIRouter, HTTPException, Response
from app.database.repository import scan_repository
from app.reports.pdf_generator import pdf_generator
from app.schemas.scan import ScanResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{scan_id}", summary="Download privacy audit report as PDF")
async def download_report(scan_id: str):
    """
    Generates and downloads a cybersecurity-grade PDF privacy audit report
    summarizing detected entities, sensitivity distribution, risk scores, and recommendations.
    Never exposes unmasked PII.
    """
    scan_doc = await scan_repository.get_scan(scan_id)
    if not scan_doc:
        raise HTTPException(
            status_code=404,
            detail=f"Scan record '{scan_id}' was not found. Please execute a scan before requesting a report."
        )

    try:
        # Rehydrate into ScanResponse schema
        scan_response = ScanResponse(**scan_doc)
        pdf_bytes = pdf_generator.generate_report(scan_response)

        filename = f"Privacy_Risk_Report_{scan_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating PDF report for '{scan_id}': {str(e)}"
        )
