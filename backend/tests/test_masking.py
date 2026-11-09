import pytest
from app.services.masking import masking_service
from app.schemas.scan import DetectedEntity


def test_individual_masking_helpers():
    # Aadhaar masking
    assert masking_service.mask_aadhaar("9999 4105 1548") == "XXXX XXXX 1548"
    assert masking_service.mask_aadhaar("999941051548") == "XXXX XXXX 1548"

    # PAN masking
    assert masking_service.mask_pan("ABCDE1234F") == "ABCDE****F"

    # Phone masking
    assert masking_service.mask_phone("9876543210") == "******3210"

    # Email masking
    assert masking_service.mask_email("rahul.sharma@example.com") == "r***a@example.com"

    # Card masking
    assert masking_service.mask_card("4532 0150 0000 0004") == "**** **** **** 0004"

    # Bank account masking
    assert masking_service.mask_bank_account("123456789012") == "********9012"


def test_full_text_masking():
    raw_text = "Contact Alice at alice@cyber.io or phone 9876543210."
    entities = [
        DetectedEntity(
            entity_type="EMAIL_ADDRESS",
            text="alice@cyber.io",
            start=17,
            end=31,
            confidence_score=0.95,
            sensitivity_level="MEDIUM",
            is_validated=True,
            validation_details="RFC match",
            masked_text="a***e@cyber.io"
        ),
        DetectedEntity(
            entity_type="PHONE_NUMBER",
            text="9876543210",
            start=41,
            end=51,
            confidence_score=0.90,
            sensitivity_level="MEDIUM",
            is_validated=True,
            validation_details="Telecom match",
            masked_text="******3210"
        )
    ]
    masked = masking_service.mask_full_text(raw_text, entities)
    assert "alice@cyber.io" not in masked
    assert "9876543210" not in masked
    assert "a***e@cyber.io" in masked
    assert "******3210" in masked
