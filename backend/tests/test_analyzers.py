import pytest
from app.analyzers.classifier import classifier
from app.analyzers.risk_scorer import risk_engine
from app.schemas.scan import DetectedEntity


def test_sensitivity_classification():
    assert classifier.classify("IN_AADHAAR") == "HIGH"
    assert classifier.classify("IN_PAN") == "HIGH"
    assert classifier.classify("CREDIT_CARD") == "HIGH"
    assert classifier.classify("IN_BANK_ACCOUNT") == "HIGH"
    assert classifier.classify("PHONE_NUMBER") == "MEDIUM"
    assert classifier.classify("EMAIL_ADDRESS") == "MEDIUM"
    assert classifier.classify("LOCATION") == "MEDIUM"
    assert classifier.classify("PERSON") == "LOW"
    assert classifier.classify("IP_ADDRESS") == "LOW"


def test_risk_scoring_empty():
    assessment = risk_engine.calculate_risk([])
    assert assessment.score == 0
    assert assessment.category == "LOW"
    assert len(assessment.breakdown) == 0


def test_risk_scoring_high_exposure():
    entities = [
        DetectedEntity(
            entity_type="IN_AADHAAR",
            text="9999 4105 1548",
            start=0,
            end=14,
            confidence_score=0.98,
            sensitivity_level="HIGH",
            is_validated=True,
            validation_details="Valid Aadhaar",
            masked_text="XXXX XXXX 1548"
        ),
        DetectedEntity(
            entity_type="IN_BANK_ACCOUNT",
            text="123456789012",
            start=20,
            end=32,
            confidence_score=0.90,
            sensitivity_level="HIGH",
            is_validated=True,
            validation_details="Valid Bank Account",
            masked_text="********9012"
        ),
        DetectedEntity(
            entity_type="PHONE_NUMBER",
            text="9876543210",
            start=40,
            end=50,
            confidence_score=0.90,
            sensitivity_level="MEDIUM",
            is_validated=True,
            validation_details="Valid Phone",
            masked_text="******3210"
        )
    ]
    assessment = risk_engine.calculate_risk(entities)
    assert assessment.score >= 61
    assert assessment.category == "HIGH"
    assert assessment.score <= 100
    assert len(assessment.breakdown) >= 3


def test_risk_scoring_low_exposure():
    entities = [
        DetectedEntity(
            entity_type="PERSON",
            text="Alice Smith",
            start=0,
            end=11,
            confidence_score=0.85,
            sensitivity_level="LOW",
            is_validated=True,
            validation_details="Entity pattern",
            masked_text="A**** S****"
        )
    ]
    assessment = risk_engine.calculate_risk(entities)
    assert assessment.score <= 30
    assert assessment.category == "LOW"
