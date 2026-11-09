from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DetectedEntity(BaseModel):
    entity_type: str = Field(..., description="Entity category name (e.g. IN_AADHAAR, EMAIL_ADDRESS)")
    text: str = Field(..., description="Original detected text snippet")
    start: int = Field(..., description="Start character offset")
    end: int = Field(..., description="End character offset")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Detection confidence (0.0 to 1.0)")
    sensitivity_level: str = Field(..., description="Sensitivity classification: HIGH, MEDIUM, LOW")
    is_validated: bool = Field(False, description="Whether mathematical or format validation succeeded")
    validation_details: Optional[str] = Field(None, description="Details of validation like Verhoeff or entity type")
    masked_text: str = Field(..., description="Safely masked version of the detected text")


class RiskBreakdownItem(BaseModel):
    entity_type: str
    count: int
    weight_per_item: int
    total_points: int
    sensitivity_level: str
    explanation: str


class RiskAssessment(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Normalized risk score from 0 to 100")
    category: str = Field(..., description="LOW (0-30), MEDIUM (31-60), or HIGH (61-100)")
    summary: str
    raw_points: int
    capped_points: int
    breakdown: List[RiskBreakdownItem]


class Recommendation(BaseModel):
    id: str
    title: str
    description: str
    severity: str = Field(..., description="CRITICAL, WARNING, or INFO")
    entity_type: Optional[str] = None
    action_steps: List[str]


class ScanResponse(BaseModel):
    scan_id: str
    timestamp: str
    input_type: str = Field(..., description="'text' or 'document'")
    document_name: Optional[str] = None
    character_count: int
    total_entities_detected: int
    high_sensitivity_count: int
    medium_sensitivity_count: int
    low_sensitivity_count: int
    detected_entities: List[DetectedEntity]
    risk_assessment: RiskAssessment
    recommendations: List[Recommendation]
    original_text: Optional[str] = None
    masked_text: str
    processing_time_ms: float


class TextScanRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text to analyze for privacy risks")
    custom_weights: Optional[Dict[str, int]] = Field(None, description="Optional custom risk weights")


class AnonymizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to mask/anonymize")
    masking_char: Optional[str] = Field("*", max_length=1)
    entities_to_mask: Optional[List[str]] = None


class AnonymizeResponse(BaseModel):
    original_length: int
    masked_text: str
    entities_masked_count: int
    masked_entities: List[str]


class ScanHistoryItem(BaseModel):
    scan_id: str
    timestamp: str
    input_type: str
    document_name: Optional[str] = None
    risk_score: int
    risk_category: str
    total_entities: int
    high_count: int
    medium_count: int
    low_count: int
    entity_types_summary: Dict[str, int]
    character_count: int
    processing_time_ms: float


class DashboardSummary(BaseModel):
    total_scans: int
    average_risk_score: float
    high_risk_scans: int
    medium_risk_scans: int
    low_risk_scans: int
    total_pii_detected: int
    entity_distribution: Dict[str, int]
    sensitivity_distribution: Dict[str, int]
    recent_scans: List[ScanHistoryItem]
