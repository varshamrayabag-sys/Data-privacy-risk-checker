from typing import Dict, List, Optional
from app.core.config import settings


class SensitivityClassifier:
    """
    Classifies detected PII entities into HIGH, MEDIUM, and LOW sensitivity categories.
    Rules are configurable via application settings or custom overrides.
    """

    def __init__(
        self,
        high_entities: Optional[List[str]] = None,
        medium_entities: Optional[List[str]] = None,
        low_entities: Optional[List[str]] = None,
    ):
        self.high_entities = set(high_entities or settings.HIGH_SENSITIVITY_ENTITIES)
        self.medium_entities = set(medium_entities or settings.MEDIUM_SENSITIVITY_ENTITIES)
        self.low_entities = set(low_entities or settings.LOW_SENSITIVITY_ENTITIES)

    def classify(self, entity_type: str) -> str:
        """
        Returns 'HIGH', 'MEDIUM', or 'LOW' for a given entity type.
        """
        normalized = entity_type.upper().strip()
        if normalized in self.high_entities:
            return "HIGH"
        elif normalized in self.medium_entities:
            return "MEDIUM"
        elif normalized in self.low_entities:
            return "LOW"
        else:
            # Fallback based on substrings
            if any(term in normalized for term in ["AADHAAR", "PAN", "PASSPORT", "CARD", "ACCOUNT", "SSN"]):
                return "HIGH"
            elif any(term in normalized for term in ["PHONE", "EMAIL", "LOCATION", "ADDRESS", "DOB", "BIRTH", "IFSC", "MEDICAL"]):
                return "MEDIUM"
            return "LOW"


classifier = SensitivityClassifier()
