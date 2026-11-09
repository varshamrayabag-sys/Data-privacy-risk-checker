import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional
from app.detectors.presidio_engine import detection_engine
from app.analyzers.risk_scorer import risk_engine
from app.services.recommendations import recommendation_engine
from app.services.masking import masking_service
from app.database.repository import scan_repository
from app.schemas.scan import ScanResponse


class PrivacyAnalysisPipeline:
    """
    Core orchestrator coordinating:
    Input Ingestion -> PII Detection -> Sensitivity Classification ->
    Explainable Risk Scoring -> Contextual Recommendations -> Data Masking -> Metadata Persistence.
    """

    async def execute_scan(
        self,
        text: str,
        input_type: str = "text",
        document_name: Optional[str] = None,
        custom_weights: Optional[Dict[str, int]] = None
    ) -> ScanResponse:
        start_time = time.perf_counter()

        # 1. Generate unique identifier and timestamp
        scan_id = f"SCAN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        # 2. Run PII detection & validation
        detected_entities = detection_engine.detect_pii(text)

        # 3. Count sensitivity categories
        high_count = sum(1 for e in detected_entities if e.sensitivity_level == "HIGH")
        medium_count = sum(1 for e in detected_entities if e.sensitivity_level == "MEDIUM")
        low_count = sum(1 for e in detected_entities if e.sensitivity_level == "LOW")

        # 4. Calculate explainable risk score
        risk_assessment = risk_engine.calculate_risk(detected_entities, custom_weights)

        # 5. Generate contextual recommendations
        recommendations = recommendation_engine.generate_recommendations(
            detected_entities,
            risk_assessment.score,
            risk_assessment.category
        )

        # 6. Apply high-fidelity text masking
        masked_text = masking_service.mask_full_text(text, detected_entities)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # 7. Construct complete response
        response = ScanResponse(
            scan_id=scan_id,
            timestamp=timestamp_str,
            input_type=input_type,
            document_name=document_name,
            character_count=len(text),
            total_entities_detected=len(detected_entities),
            high_sensitivity_count=high_count,
            medium_sensitivity_count=medium_count,
            low_sensitivity_count=low_count,
            detected_entities=detected_entities,
            risk_assessment=risk_assessment,
            recommendations=recommendations,
            original_text=text,  # Kept in session response for authorized user view
            masked_text=masked_text,
            processing_time_ms=duration_ms
        )

        # 8. Asynchronously persist scan metadata (excluding raw original_text for privacy)
        await scan_repository.save_scan(response.model_dump())

        return response


pipeline = PrivacyAnalysisPipeline()

