import re
from typing import List, Optional
from app.schemas.scan import DetectedEntity


class DataMaskingService:
    """
    High-fidelity data masking service providing context-aware redaction:
    - Aadhaar: XXXX XXXX 9012
    - Email: r***@domain.com
    - Phone: ******3210
    - PAN: ABCDE****F
    - Credit Card: **** **** **** 1234
    - Bank Account: *******1234
    - Name: J*** D**
    - Date of Birth: **/**/YYYY
    - General: [REDACTED_ENTITY] or customized mask
    """

    @staticmethod
    def mask_aadhaar(val: str) -> str:
        digits = re.sub(r"\D", "", val)
        if len(digits) >= 12:
            last4 = digits[-4:]
            return f"XXXX XXXX {last4}"
        return "XXXX XXXX " + digits[-4:] if len(digits) >= 4 else "XXXX XXXX XXXX"

    @staticmethod
    def mask_pan(val: str) -> str:
        clean = val.strip().upper()
        if len(clean) == 10:
            # Format: First 5 letters, 4 masked digits, last letter: ABCDE****F
            return f"{clean[:5]}****{clean[-1]}"
        return "ABCDE****F"

    @staticmethod
    def mask_phone(val: str) -> str:
        clean = re.sub(r"[\s\-\(\)]", "", val)
        if len(clean) >= 10:
            last4 = clean[-4:]
            masked_prefix = "*" * (len(clean) - 4)
            return f"{masked_prefix}{last4}"
        return "******" + (clean[-4:] if len(clean) >= 4 else "****")

    @staticmethod
    def mask_email(val: str) -> str:
        val = val.strip()
        if "@" in val:
            parts = val.split("@", 1)
            name_part = parts[0]
            domain_part = parts[1]
            if len(name_part) <= 2:
                masked_name = name_part[0] + "***" if len(name_part) > 0 else "***"
            else:
                masked_name = name_part[0] + "***" + name_part[-1]
            return f"{masked_name}@{domain_part}"
        return "e***@domain.com"

    @staticmethod
    def mask_card(val: str) -> str:
        digits = re.sub(r"\D", "", val)
        if len(digits) >= 4:
            last4 = digits[-4:]
            return f"**** **** **** {last4}"
        return "**** **** **** ****"

    @staticmethod
    def mask_bank_account(val: str) -> str:
        digits = re.sub(r"\D", "", val)
        if len(digits) >= 4:
            last4 = digits[-4:]
            masked_count = max(4, len(digits) - 4)
            return ("*" * masked_count) + last4
        return "*******1234"

    @staticmethod
    def mask_passport(val: str) -> str:
        clean = val.strip().upper()
        if len(clean) >= 8:
            return f"{clean[0]}******{clean[-1]}"
        return "A******9"

    @staticmethod
    def mask_dob(val: str) -> str:
        # Keep year or mask day and month: **/**/1995
        match = re.search(r"(19\d\d|20\d\d)", val)
        if match:
            year = match.group(1)
            return f"**/**/{year}"
        return "**/**/****"

    @staticmethod
    def mask_name(val: str) -> str:
        words = val.strip().split()
        masked_words = []
        for w in words:
            if len(w) <= 2:
                masked_words.append(w[0] + "*")
            else:
                masked_words.append(w[0] + ("*" * (len(w) - 1)))
        return " ".join(masked_words) if masked_words else "J*** D**"

    @staticmethod
    def mask_generic(val: str, char: str = "*") -> str:
        val = val.strip()
        if len(val) <= 2:
            return char * len(val)
        return val[0] + (char * (len(val) - 2)) + val[-1]

    def mask_value_by_type(self, entity_type: str, raw_text: str) -> str:
        normalized = entity_type.upper().strip()
        if normalized == "IN_AADHAAR":
            return self.mask_aadhaar(raw_text)
        elif normalized == "IN_PAN":
            return self.mask_pan(raw_text)
        elif normalized == "PHONE_NUMBER":
            return self.mask_phone(raw_text)
        elif normalized == "EMAIL_ADDRESS":
            return self.mask_email(raw_text)
        elif normalized in ("CREDIT_CARD", "DEBIT_CARD"):
            return self.mask_card(raw_text)
        elif normalized in ("IN_BANK_ACCOUNT", "IBAN_CODE"):
            return self.mask_bank_account(raw_text)
        elif normalized == "IN_PASSPORT":
            return self.mask_passport(raw_text)
        elif normalized == "DATE_OF_BIRTH":
            return self.mask_dob(raw_text)
        elif normalized == "PERSON":
            return self.mask_name(raw_text)
        elif normalized in ("LOCATION", "ADDRESS"):
            return "[REDACTED_ADDRESS]"
        elif normalized == "IP_ADDRESS":
            return "xxx.xxx.xxx.xxx"
        elif normalized == "IN_IFSC":
            clean = raw_text.strip().upper()
            return f"{clean[:4]}0******" if len(clean) >= 4 else "BANK0******"
        return self.mask_generic(raw_text)

    def mask_full_text(
        self,
        text: str,
        detected_entities: List[DetectedEntity],
        mask_char: str = "*"
    ) -> str:
        """
        Replaces detected sensitive spans with masked representations.
        Entities must be sorted in reverse order of start position to prevent offset drifting.
        """
        if not text or not detected_entities:
            return text

        # Sort descending by start offset
        sorted_entities = sorted(detected_entities, key=lambda e: e.start, reverse=True)

        result_text = text
        for ent in sorted_entities:
            start = ent.start
            end = ent.end
            
            # Ensure valid indices
            if 0 <= start < len(result_text) and start < end <= len(result_text):
                replacement = ent.masked_text or self.mask_value_by_type(ent.entity_type, ent.text)
                result_text = result_text[:start] + replacement + result_text[end:]

        return result_text


masking_service = DataMaskingService()
