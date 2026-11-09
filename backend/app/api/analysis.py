from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.detectors.presidio_engine import detection_engine
from app.analyzers.risk_scorer import risk_engine
from app.services.recommendations import recommendation_engine
from app.services.masking import masking_service
from app.schemas.scan import (
    RiskAssessment,
    Recommendation,
    AnonymizeRequest,
    AnonymizeResponse,
    DetectedEntity
)

router = APIRouter(prefix="", tags=["Analysis & Anonymization"])


class RiskAnalysisRequest(BaseModel):
    text: Optional[str] = None
    entities: Optional[List[DetectedEntity]] = None
    custom_weights: Optional[Dict[str, int]] = None


class RecommendationRequest(BaseModel):
    entities: List[DetectedEntity]
    risk_score: int
    risk_category: str


@router.post("/analyze/risk", response_model=RiskAssessment, summary="Calculate explainable risk score")
async def analyze_risk(request: RiskAnalysisRequest):
    if request.entities is not None:
        entities = request.entities
    elif request.text:
        entities = detection_engine.detect_pii(request.text)
    else:
        raise HTTPException(status_code=400, detail="Either 'text' or 'entities' must be provided.")

    return risk_engine.calculate_risk(entities, request.custom_weights)


@router.post("/analyze/recommendations", response_model=List[Recommendation], summary="Generate privacy recommendations")
async def analyze_recommendations(request: RecommendationRequest):
    return recommendation_engine.generate_recommendations(
        request.entities,
        request.risk_score,
        request.risk_category
    )


@router.post("/anonymize", response_model=AnonymizeResponse, summary="Mask and anonymize sensitive text")
async def anonymize_text(request: AnonymizeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    detected_entities = detection_engine.detect_pii(request.text)
    
    if request.entities_to_mask:
        filter_set = set(e.upper() for e in request.entities_to_mask)
        filtered_entities = [e for e in detected_entities if e.entity_type.upper() in filter_set]
    else:
        filtered_entities = detected_entities

    masked_text = masking_service.mask_full_text(
        request.text,
        filtered_entities,
        mask_char=request.masking_char or "*"
    )

    return AnonymizeResponse(
        original_length=len(request.text),
        masked_text=masked_text,
        entities_masked_count=len(filtered_entities),
        masked_entities=list({e.entity_type for e in filtered_entities})
    )
