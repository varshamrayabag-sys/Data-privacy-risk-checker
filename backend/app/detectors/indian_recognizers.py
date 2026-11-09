import re
from typing import List, Optional
from presidio_analyzer import Pattern, PatternRecognizer, RecognizerResult
from app.detectors.validators import (
    validate_verhoeff,
    validate_pan,
    validate_ifsc,
    validate_indian_passport,
    validate_indian_phone,
    validate_date_of_birth,
    validate_abha,
    validate_luhn
)


class AadhaarRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Indian Aadhaar Numbers (12 digits).
    Includes Verhoeff checksum algorithm validation to guarantee accuracy.
    """
    ENTITIES = ["IN_AADHAAR"]
    
    PATTERNS = [
        Pattern(
            name="aadhaar_formatted_space",
            regex=r"\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b",
            score=0.85
        ),
        Pattern(
            name="aadhaar_formatted_hyphen",
            regex=r"\b[2-9]{1}[0-9]{3}-[0-9]{4}-[0-9]{4}\b",
            score=0.85
        ),
        Pattern(
            name="aadhaar_continuous",
            regex=r"\b[2-9]{1}[0-9]{11}\b",
            score=0.60
        )
    ]
    
    CONTEXT = [
        "aadhaar", "aadhar", "adhaar", "uidai", "uid",
        "identity card", "mera aadhaar", "aadhaar no",
        "aadhar card", "unique identification"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_AADHAAR",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="AadhaarRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        """
        Validates the extracted candidate using Verhoeff checksum.
        """
        clean_num = re.sub(r"\D", "", pattern_text)
        if len(clean_num) != 12:
            return False
        return validate_verhoeff(clean_num)


class PanRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Indian Permanent Account Number (PAN).
    Format: 5 letters, 4 digits, 1 letter. Validates taxpayer entity type.
    """
    ENTITIES = ["IN_PAN"]
    
    PATTERNS = [
        Pattern(
            name="pan_standard",
            regex=r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",
            score=0.85
        )
    ]
    
    CONTEXT = [
        "pan", "pan card", "permanent account number",
        "income tax", "nsdl", "uti", "pan no", "tax id"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PAN",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="PanRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        clean = pattern_text.strip().upper()
        is_valid, _ = validate_pan(clean)
        return is_valid


class IndianPassportRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Indian Passport numbers.
    Format: 1 letter followed by 7 digits.
    Context is heavily weighted to avoid matching random 8-character codes.
    """
    ENTITIES = ["IN_PASSPORT"]
    
    PATTERNS = [
        Pattern(
            name="indian_passport_pattern",
            regex=r"\b[A-Za-z][1-9][0-9]{6}\b",
            score=0.55
        )
    ]
    
    CONTEXT = [
        "passport", "ppt", "ppt no", "passport number",
        "republic of india", "travel document", "immigration",
        "visa", "consular"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PASSPORT",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="IndianPassportRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        return validate_indian_passport(pattern_text)


class IfscRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Indian Financial System Code (IFSC).
    Format: 4 letters, 0, 6 alphanumeric chars (e.g., SBIN0001234, HDFC0000123).
    """
    ENTITIES = ["IN_IFSC"]
    
    PATTERNS = [
        Pattern(
            name="ifsc_standard",
            regex=r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
            score=0.85
        )
    ]
    
    CONTEXT = [
        "ifsc", "ifsc code", "rtgs", "neft", "imps",
        "branch code", "bank branch", "bank transfer"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_IFSC",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="IfscRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        return validate_ifsc(pattern_text)


class IndianBankAccountRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Indian Bank Account Numbers (9 to 18 digits).
    Requires surrounding banking context to avoid false positives with phone numbers.
    """
    ENTITIES = ["IN_BANK_ACCOUNT"]
    
    PATTERNS = [
        Pattern(
            name="indian_bank_account_num",
            regex=r"\b[0-9]{9,18}\b",
            score=0.35
        )
    ]
    
    CONTEXT = [
        "account", "account number", "account no", "a/c no", "acct no", "acct #",
        "bank a/c", "bank account", "savings a/c", "current a/c",
        "beneficiary a/c", "sbi a/c", "hdfc", "icici", "axis",
        "pnb", "bob", "kotak", "canara", "union bank", "bank details", "salary a/c"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_BANK_ACCOUNT",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="IndianBankAccountRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        # Discard if it starts with +91 or common telecom country codes
        clean = re.sub(r"\D", "", pattern_text)
        if len(clean) == 10 and clean[0] in "6789":
            # 10 digit number starting with 6-9 without strong context is more likely a phone
            return None
        return len(clean) >= 9 and len(clean) <= 18


class IndianPhoneRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Indian Phone Numbers.
    Avoids treating arbitrary 10 digit sequences as phone numbers.
    Validates starting digits (6, 7, 8, 9) and optional country prefixes (+91, 0).
    """
    ENTITIES = ["PHONE_NUMBER"]
    
    PATTERNS = [
        Pattern(
            name="indian_mobile_prefix",
            regex=r"(?:\+91[\-\s]?|91[\-\s]?|0)?[6-9]\d{4}[\-\s]?\d{5}\b",
            score=0.75
        ),
        Pattern(
            name="indian_landline",
            regex=r"\b0[1-9]{2,4}[\-\s]?[0-9]{6,8}\b",
            score=0.70
        )
    ]
    
    CONTEXT = [
        "phone", "mobile", "contact", "call", "whatsapp",
        "cell", "tel", "ph", "telephone", "phone number"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="PHONE_NUMBER",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="IndianPhoneRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        return validate_indian_phone(pattern_text)


class DateOfBirthRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Date of Birth.
    Requires DOB context tokens to distinguish general dates from DOB.
    """
    ENTITIES = ["DATE_OF_BIRTH"]
    
    PATTERNS = [
        Pattern(
            name="dob_slash_dash",
            regex=r"\b(?:0[1-9]|[12][0-9]|3[01])[\/\-\.](?:0[1-9]|1[012])[\/\-\.](?:19|20)\d\d\b",
            score=0.65
        ),
        Pattern(
            name="dob_iso",
            regex=r"\b(?:19|20)\d\d[\/\-\.](?:0[1-9]|1[012])[\/\-\.](?:0[1-9]|[12][0-9]|3[01])\b",
            score=0.65
        ),
        Pattern(
            name="dob_text_month",
            regex=r"\b(?:0[1-9]|[12][0-9]|3[01])\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(?:19|20)\d\d\b",
            score=0.70
        )
    ]
    
    CONTEXT = [
        "dob", "date of birth", "born on", "birth date",
        "d.o.b", "d.o.b.", "birthdate", "age"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="DATE_OF_BIRTH",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="DateOfBirthRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        is_valid, _ = validate_date_of_birth(pattern_text)
        return is_valid


class AbhaHealthRecognizer(PatternRecognizer):
    """
    Custom Presidio recognizer for Ayushman Bharat Health Account (ABHA / National Health ID).
    14 digits, typically formatted as XX-XXXX-XXXX-XXXX.
    """
    ENTITIES = ["MEDICAL_LICENSE"]
    
    PATTERNS = [
        Pattern(
            name="abha_formatted",
            regex=r"\b\d{2}-\d{4}-\d{4}-\d{4}\b",
            score=0.85
        )
    ]
    
    CONTEXT = [
        "abha", "health id", "ayushman bharat", "ndhm",
        "health account", "patient id", "medical record"
    ]

    def __init__(self):
        super().__init__(
            supported_entity="MEDICAL_LICENSE",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            name="AbhaHealthRecognizer"
        )

    def validate_result(self, pattern_text: str) -> Optional[bool]:
        return validate_abha(pattern_text)
