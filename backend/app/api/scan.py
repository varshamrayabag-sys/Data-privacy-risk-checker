from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from typing import Optional
from app.services.pipeline import pipeline
from app.schemas.scan import ScanResponse, TextScanRequest
from app.utils.file_extractor import document_extractor
from app.core.security import security

router = APIRouter(prefix="/scan", tags=["Scanning"])


@router.post("/text", response_model=ScanResponse, summary="Scan raw text for PII & privacy risks")
async def scan_text(request: TextScanRequest):
    """
    Scans submitted text for Personally Identifiable Information (PII),
    evaluates privacy risks, classifies sensitivity, and generates recommendations.
    """
    sanitized_text = security.sanitize_input(request.text)
    security.validate_text_size(sanitized_text)

    if not sanitized_text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty or pure whitespace.")

    response = await pipeline.execute_scan(
        text=sanitized_text,
        input_type="text",
        document_name=None,
        custom_weights=request.custom_weights
    )
    return response


@router.post("/document", response_model=ScanResponse, summary="Scan uploaded PDF, DOCX, or TXT document")
async def scan_document(file: UploadFile = File(...)):
    """
    Extracts text from uploaded PDF, DOCX, or TXT files,
    detects sensitive PII, evaluates privacy risks, and stores audit metadata.
    """
    extracted_text, filename, char_count = await document_extractor.extract_text(file)
    sanitized_text = security.sanitize_input(extracted_text)
    security.validate_text_size(sanitized_text)

    response = await pipeline.execute_scan(
        text=sanitized_text,
        input_type="document",
        document_name=filename
    )
    return response
