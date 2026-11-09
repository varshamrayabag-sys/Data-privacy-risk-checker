import pytest
from app.detectors.validators import (
    validate_verhoeff,
    validate_pan,
    validate_luhn,
    validate_ifsc,
    validate_indian_phone,
    validate_indian_passport
)
from app.detectors.presidio_engine import detection_engine


def test_verhoeff_aadhaar_validation():
    # Valid Aadhaar number with correct Verhoeff checksum (99994105154 + 3)
    assert validate_verhoeff("9999 4105 1543") is True
    # Invalid checksum
    assert validate_verhoeff("9999 4105 1548") is False
    # Numbers starting with 0 or 1 are invalid in Aadhaar
    assert validate_verhoeff("0123 4567 8901") is False


def test_pan_validation():
    # Valid individual PAN (4th character 'P')
    valid, entity = validate_pan("ABCPE1234F")
    assert valid is True
    assert entity == "Individual"

    # Valid company PAN (4th character 'C')
    valid_c, entity_c = validate_pan("AAACC1234C")
    assert valid_c is True
    assert entity_c == "Company"

    # Invalid PAN format
    invalid, _ = validate_pan("12345ABCDE")
    assert invalid is False


def test_luhn_credit_card_validation():
    # Valid Luhn card (Mod 10 check)
    assert validate_luhn("4532 0150 0000 0007") is True
    # Invalid card
    assert validate_luhn("4532 0150 0000 0008") is False


def test_ifsc_validation():
    assert validate_ifsc("SBIN0001234") is True
    assert validate_ifsc("HDFC0000001") is True
    assert validate_ifsc("INVALIDIFSC") is False
    assert validate_ifsc("SBIN1001234") is False  # 5th char must be 0


def test_indian_phone_validation():
    assert validate_indian_phone("+91 9876512345") is True
    assert validate_indian_phone("8123456789") is True
    assert validate_indian_phone("09876512345") is True
    # Discard non-mobile starting with 2
    assert validate_indian_phone("2345678901") is False
    # Discard repeated digits
    assert validate_indian_phone("9999999999") is False


def test_indian_passport_validation():
    assert validate_indian_passport("A1234567") is True
    assert validate_indian_passport("P9876543") is True
    assert validate_indian_passport("12345678") is False


def test_detection_engine_with_real_input():
    sample_text = (
        "Applicant: Ramesh Kumar, Email: ramesh.k@example.com, "
        "Phone: +91 9876512345, PAN: ABCPE1234F, Aadhaar: 9999 4105 1543."
    )
    entities = detection_engine.detect_pii(sample_text)
    entity_types = [e.entity_type for e in entities]

    assert "EMAIL_ADDRESS" in entity_types
    assert "PHONE_NUMBER" in entity_types
    assert "IN_PAN" in entity_types
    assert "IN_AADHAAR" in entity_types

    # Verify positions and masked text
    for ent in entities:
        assert ent.start < ent.end
        assert ent.confidence_score > 0.0
        assert ent.masked_text is not None


def test_detection_engine_no_pii():
    text = "The quick brown fox jumps over the lazy dog in the sunny afternoon."
    entities = detection_engine.detect_pii(text)
    assert len(entities) == 0
