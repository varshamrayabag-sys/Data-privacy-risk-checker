import re
import logging
from typing import List, Optional, Tuple
from presidio_analyzer import AnalyzerEngine, RecognizerRegistry, RecognizerResult
from presidio_analyzer.nlp_engine import NlpEngineProvider, SpacyNlpEngine

from app.detectors.indian_recognizers import (
    AadhaarRecognizer,
    PanRecognizer,
    IndianPassportRecognizer,
    IfscRecognizer,
    IndianBankAccountRecognizer,
    IndianPhoneRecognizer,
    DateOfBirthRecognizer,
    AbhaHealthRecognizer
)
from app.detectors.validators import (
    validate_verhoeff,
    validate_pan,
    validate_luhn,
    validate_ifsc,
    validate_indian_phone,
    validate_date_of_birth,
    validate_abha,
    validate_indian_passport
)
from app.schemas.scan import DetectedEntity
from app.analyzers.classifier import classifier
from app.services.masking import masking_service

logger = logging.getLogger(__name__)


class PresidioDetectionEngine:
    """
    Production-ready PII Detection Engine combining Microsoft Presidio,
    spaCy NLP, and high-precision custom recognizers for Indian identifiers.
    """

    def __init__(self):
        self.analyzer = self._initialize_analyzer()

    def _initialize_analyzer(self) -> AnalyzerEngine:
        registry = RecognizerRegistry()
        
        # Load default presidio recognizers (Email, Credit Card, IP Address, etc.)
        registry.load_predefined_recognizers()

        # Register custom Indian & Specialized recognizers
        registry.add_recognizer(AadhaarRecognizer())
        registry.add_recognizer(PanRecognizer())
        registry.add_recognizer(IndianPassportRecognizer())
        registry.add_recognizer(IfscRecognizer())
        registry.add_recognizer(IndianBankAccountRecognizer())
        registry.add_recognizer(IndianPhoneRecognizer())
        registry.add_recognizer(DateOfBirthRecognizer())
        registry.add_recognizer(AbhaHealthRecognizer())

        try:
            # Try setting up spaCy NLP engine
            nlp_configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
            }
            provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
            nlp_engine = provider.create_engine()
            analyzer = AnalyzerEngine(registry=registry, nlp_engine=nlp_engine, supported_languages=["en"])
            logger.info("Presidio Analyzer initialized with spaCy en_core_web_sm engine.")
            return analyzer
        except Exception as e:
            logger.warning(f"spaCy model setup notice ({e}). Initializing AnalyzerEngine with default configuration.")
            return AnalyzerEngine(registry=registry, supported_languages=["en"])

    def _deduplicate_and_resolve_overlaps(
        self,
        results: List[RecognizerResult],
        text: str
    ) -> List[RecognizerResult]:
        """
        Resolves overlapping bounding spans.
        Prioritizes specific domain identifiers (e.g. AADHAAR, PAN, CREDIT_CARD) over generic tokens.
        """
        if not results:
            return []

        # High priority entity types
        priority_order = {
            "IN_AADHAAR": 100,
            "IN_PAN": 95,
            "CREDIT_CARD": 90,
            "PHONE_NUMBER": 85,
            "IN_PASSPORT": 80,
            "IN_BANK_ACCOUNT": 75,
            "IN_IFSC": 75,
            "EMAIL_ADDRESS": 70,
            "DATE_OF_BIRTH": 65,
            "MEDICAL_LICENSE": 55,
            "PERSON": 30,
            "LOCATION": 25,
            "IP_ADDRESS": 20,
            "ORGANIZATION": 5,
            "DATE_TIME": 5,
        }

        # Sort by priority descending, then score descending, then start
        sorted_results = sorted(
            results,
            key=lambda r: (
                -priority_order.get(r.entity_type, 10),
                -r.score,
                r.start,
                -(r.end - r.start)
            )
        )

        resolved: List[RecognizerResult] = []
        for curr in sorted_results:
            overlap = False
            for prev in resolved:
                # Check for overlap: not (curr ends before prev or curr starts after prev)
                if not (curr.end <= prev.start or curr.start >= prev.end):
                    overlap = True
                    break
            if not overlap:
                resolved.append(curr)

        # Sort by start offset
        return sorted(resolved, key=lambda r: r.start)

    def _validate_entity(self, entity_type: str, snippet: str) -> Tuple[bool, Optional[str], float]:
        """
        Validates entity mathematically or contextually.
        Returns (is_validated, validation_details, confidence_adjustment).
        """
        norm_type = entity_type.upper().strip()

        if norm_type == "IN_AADHAAR":
            clean_digits = re.sub(r"\D", "", snippet)
            if len(clean_digits) == 12:
                if validate_verhoeff(clean_digits):
                    return True, "Verified Aadhaar Checksum (Verhoeff Algorithm)", 0.98
                else:
                    return False, "12-digit format match (Failed Verhoeff Checksum)", 0.40
            return False, "Invalid Aadhaar digit length", 0.30

        elif norm_type == "IN_PAN":
            is_valid, entity_category = validate_pan(snippet)
            if is_valid:
                return True, f"Verified Indian PAN format ({entity_category})", 0.95
            return False, "Format mismatch for Indian PAN", 0.35

        elif norm_type in ("CREDIT_CARD", "DEBIT_CARD"):
            clean_digits = re.sub(r"\D", "", snippet)
            if validate_luhn(clean_digits):
                return True, "Verified Card Checksum (Luhn Algorithm Mod-10)", 0.96
            return False, "Card number failed Luhn checksum verification", 0.30

        elif norm_type == "IN_IFSC":
            if validate_ifsc(snippet):
                return True, "Verified RBI IFSC Code Format", 0.95
            return False, "Invalid IFSC Code Structure", 0.30

        elif norm_type == "IN_PASSPORT":
            if validate_indian_passport(snippet):
                return True, "Valid Indian Passport Format", 0.85
            return False, "Unverified Passport Number", 0.40

        elif norm_type == "PHONE_NUMBER":
            if validate_indian_phone(snippet):
                return True, "Valid Indian Telecom Number Format", 0.90
            # Standard international phone check
            clean = re.sub(r"[\s\-\(\)\+]", "", snippet)
            if 7 <= len(clean) <= 15 and clean.isdigit():
                return True, "Valid Phone Number Format", 0.80
            return False, "Potential phone number (Context match)", 0.50

        elif norm_type == "EMAIL_ADDRESS":
            if re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", snippet.strip()):
                return True, "Valid RFC Email Structure", 0.95
            return False, "Unverified Email Format", 0.60

        elif norm_type == "DATE_OF_BIRTH":
            is_valid, age = validate_date_of_birth(snippet)
            if is_valid:
                age_str = f" (Est. Age {age} yrs)" if age is not None else ""
                return True, f"Valid Calendar Date{age_str}", 0.85
            return False, "Unverified Date Format", 0.40

        elif norm_type == "MEDICAL_LICENSE":
            if validate_abha(snippet):
                return True, "Valid 14-digit ABHA / National Health ID", 0.95
            return True, "Medical / Health identifier format", 0.75

        elif norm_type == "IN_BANK_ACCOUNT":
            digits = re.sub(r"\D", "", snippet)
            if 9 <= len(digits) <= 18:
                return True, f"Valid Bank Account digit sequence ({len(digits)} digits)", 0.85
            return False, "Unverified Account Number", 0.40

        elif norm_type == "IP_ADDRESS":
            parts = snippet.strip().split(".")
            if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
                return True, "Valid IPv4 Address", 0.95
            return False, "Potential IP Address", 0.50

        return True, "Entity pattern identified", 0.70

    def detect_pii(self, text: str) -> List[DetectedEntity]:
        """
        Executes PII detection on input text, performs mathematical validation,
        resolves span collisions, classifies sensitivity, and generates masked previews.
        """
        if not text or not text.strip():
            return []

        # 1. Run Presidio Analyzer
        results: List[RecognizerResult] = self.analyzer.analyze(
            text=text,
            language="en",
            score_threshold=0.35
        )

        # 2. Resolve overlapping spans
        deduplicated_results = self._deduplicate_and_resolve_overlaps(results, text)

        detected_entities: List[DetectedEntity] = []

        # Common non-PII terms to filter out if caught by generic NLP/time models
        generic_time_words = {"today", "yesterday", "tomorrow", "morning", "afternoon", "evening", "night", "the sunny afternoon", "sunny afternoon", "now", "later"}

        for res in deduplicated_results:
            snippet = text[res.start:res.end]
            
            # Avoid empty or pure punctuation matches
            if not snippet.strip() or len(snippet.strip()) < 2:
                continue

            # Ignore generic time phrases that are not PII
            if res.entity_type == "DATE_TIME":
                if snippet.strip().lower() in generic_time_words or not any(char.isdigit() for char in snippet):
                    continue

            # Run validation logic
            is_valid, validation_details, adjusted_confidence = self._validate_entity(res.entity_type, snippet)
            
            # If the validator gave high or low confidence, combine it with Presidio score
            final_confidence = min(1.0, max(0.1, round((res.score * 0.4) + (adjusted_confidence * 0.6), 2)))

            # If Aadhaar failed Verhoeff and has no other context, discard to avoid false 12-digit number positives
            if res.entity_type == "IN_AADHAAR" and not is_valid and res.score < 0.75:
                continue

            sensitivity = classifier.classify(res.entity_type)
            masked_snippet = masking_service.mask_value_by_type(res.entity_type, snippet)

            detected_entities.append(
                DetectedEntity(
                    entity_type=res.entity_type,
                    text=snippet,
                    start=res.start,
                    end=res.end,
                    confidence_score=final_confidence,
                    sensitivity_level=sensitivity,
                    is_validated=is_valid,
                    validation_details=validation_details,
                    masked_text=masked_snippet
                )
            )

        return detected_entities


detection_engine = PresidioDetectionEngine()
