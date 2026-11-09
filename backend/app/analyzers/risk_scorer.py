from typing import Dict, List, Optional
from app.core.config import settings
from app.schemas.scan import DetectedEntity, RiskAssessment, RiskBreakdownItem
from app.analyzers.classifier import classifier


class RiskScoringEngine:
    """
    Explainable, mathematical privacy risk scoring engine.
    Calculates a privacy risk score from 0 to 100 based on detected PII,
    sensitivity classification, quantity, correlation exposure, and configurable weights.
    """

    def __init__(self, weights: Optional[Dict[str, int]] = None):
        self.weights = weights or dict(settings.RISK_WEIGHTS)
        self.low_threshold = settings.RISK_THRESHOLD_LOW_MAX
        self.medium_threshold = settings.RISK_THRESHOLD_MEDIUM_MAX

    def get_weight_for_entity(self, entity_type: str) -> int:
        normalized = entity_type.upper().strip()
        if normalized in self.weights:
            return self.weights[normalized]
        # Fallback mappings
        if "AADHAAR" in normalized:
            return self.weights.get("IN_AADHAAR", 30)
        if "PAN" in normalized:
            return self.weights.get("IN_PAN", 25)
        if "BANK" in normalized:
            return self.weights.get("IN_BANK_ACCOUNT", 30)
        if "CARD" in normalized:
            return self.weights.get("CREDIT_CARD", 30)
        if "PASSPORT" in normalized:
            return self.weights.get("IN_PASSPORT", 25)
        if "PHONE" in normalized:
            return self.weights.get("PHONE_NUMBER", 15)
        if "EMAIL" in normalized:
            return self.weights.get("EMAIL_ADDRESS", 10)
        if "ADDRESS" in normalized or "LOCATION" in normalized:
            return self.weights.get("LOCATION", 20)
        if "PERSON" in normalized:
            return self.weights.get("PERSON", 5)
        if "BIRTH" in normalized or "DOB" in normalized:
            return self.weights.get("DATE_OF_BIRTH", 15)
        if "IFSC" in normalized:
            return self.weights.get("IN_IFSC", 15)
        if "MEDICAL" in normalized:
            return self.weights.get("MEDICAL_LICENSE", 20)
        return self.weights.get("DEFAULT", 10)

    def calculate_risk(
        self,
        detected_entities: List[DetectedEntity],
        custom_weights: Optional[Dict[str, int]] = None
    ) -> RiskAssessment:
        if not detected_entities:
            return RiskAssessment(
                score=0,
                category="LOW",
                summary="No Personally Identifiable Information (PII) was detected in the submitted input. Privacy risk is negligible.",
                raw_points=0,
                capped_points=0,
                breakdown=[]
            )

        active_weights = dict(self.weights)
        if custom_weights:
            active_weights.update(custom_weights)

        # Group detected entities by type
        entity_groups: Dict[str, List[DetectedEntity]] = {}
        for ent in detected_entities:
            entity_groups.setdefault(ent.entity_type, []).append(ent)

        breakdown_items: List[RiskBreakdownItem] = []
        total_raw_points = 0
        has_identity_id = False
        has_contact_info = False
        has_financial_info = False

        for ent_type, group in entity_groups.items():
            count = len(group)
            base_weight = self.get_weight_for_entity(ent_type)
            sensitivity = classifier.classify(ent_type)

            # Mathematical model:
            # First instance contributes 100% of base weight.
            # Additional instances contribute 25% of weight (diminishing marginal risk) up to 2.0x base weight.
            if count == 1:
                item_points = base_weight
            else:
                additional_factor = min(1.0, (count - 1) * 0.25)
                item_points = int(round(base_weight * (1.0 + additional_factor)))

            total_raw_points += item_points

            # Check correlation risk factors
            if ent_type in ("IN_AADHAAR", "IN_PAN", "IN_PASSPORT", "US_SSN"):
                has_identity_id = True
            if ent_type in ("PHONE_NUMBER", "EMAIL_ADDRESS", "LOCATION", "ADDRESS"):
                has_contact_info = True
            if ent_type in ("IN_BANK_ACCOUNT", "CREDIT_CARD", "IN_IFSC"):
                has_financial_info = True

            explanation = (
                f"{count} instance(s) detected. Base weight {base_weight} pts"
                f"{f' + volume scaling ({item_points - base_weight} pts)' if count > 1 else ''}. "
                f"Classified as {sensitivity} sensitivity."
            )

            breakdown_items.append(
                RiskBreakdownItem(
                    entity_type=ent_type,
                    count=count,
                    weight_per_item=base_weight,
                    total_points=item_points,
                    sensitivity_level=sensitivity,
                    explanation=explanation
                )
            )

        # Correlation Risk Bonus:
        # If identity + contact + financial are all present, correlation risk drastically multiplies identity theft vulnerability
        correlation_bonus = 0
        correlation_reasons = []
        if has_identity_id and has_financial_info:
            correlation_bonus += 15
            correlation_reasons.append("Identity identifiers coupled with financial accounts")
        if has_identity_id and has_contact_info:
            correlation_bonus += 10
            correlation_reasons.append("Government IDs paired with direct contact information")

        if correlation_bonus > 0:
            total_raw_points += correlation_bonus
            breakdown_items.append(
                RiskBreakdownItem(
                    entity_type="CORRELATION_VULNERABILITY",
                    count=1,
                    weight_per_item=correlation_bonus,
                    total_points=correlation_bonus,
                    sensitivity_level="HIGH",
                    explanation=f"Correlated multi-vector risk: {'; '.join(correlation_reasons)}. Enables targeted identity theft or fraud."
                )
            )

        # Cap score between 0 and 100
        final_score = max(0, min(100, total_raw_points))

        # Determine category
        if final_score <= self.low_threshold:
            category = "LOW"
            summary = (
                f"Low privacy risk score ({final_score}/100). Minimal sensitive data detected. "
                "Exposure risk is low under normal handling conditions."
            )
        elif final_score <= self.medium_threshold:
            category = "MEDIUM"
            summary = (
                f"Medium privacy risk score ({final_score}/100). Detectable personal contact details "
                "or sensitive data found. Actionable masking and selective redaction is strongly advised."
            )
        else:
            category = "HIGH"
            summary = (
                f"Critical/High privacy risk score ({final_score}/100). Significant sensitive identifiers "
                "(such as government IDs, financial accounts, or correlated personal records) detected. "
                "Immediate redaction and access restriction required before sharing or storing."
            )

        return RiskAssessment(
            score=final_score,
            category=category,
            summary=summary,
            raw_points=total_raw_points,
            capped_points=final_score,
            breakdown=breakdown_items
        )


risk_engine = RiskScoringEngine()

