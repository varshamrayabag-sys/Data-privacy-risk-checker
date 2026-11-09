import re
from datetime import datetime
from typing import Optional, Tuple


# Verhoeff Algorithm Tables for Aadhaar Checksum Validation
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_verhoeff(num_str: str) -> bool:
    """
    Validates a number string using the Verhoeff checksum algorithm (used by Aadhaar).
    Returns True if checksum matches 0.
    """
    clean_digits = re.sub(r"\D", "", num_str)
    if not clean_digits or not clean_digits.isdigit():
        return False
    
    # Aadhaar numbers cannot start with 0 or 1
    if clean_digits[0] in ("0", "1"):
        return False
    
    c = 0
    reversed_digits = [int(d) for d in reversed(clean_digits)]
    for i, digit in enumerate(reversed_digits):
        p_val = VERHOEFF_P[i % 8][digit]
        c = VERHOEFF_D[c][p_val]
    return c == 0


def validate_luhn(card_str: str) -> bool:
    """
    Validates credit/debit card numbers using the Luhn mod-10 algorithm.
    """
    clean_digits = re.sub(r"\D", "", card_str)
    if len(clean_digits) < 13 or len(clean_digits) > 19 or not clean_digits.isdigit():
        return False
    
    digits = [int(d) for d in clean_digits]
    checksum = 0
    reverse_digits = digits[::-1]
    
    for i, digit in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = digit * 2
            if doubled > 9:
                doubled -= 9
            checksum += doubled
        else:
            checksum += digit
            
    return checksum % 10 == 0


def validate_pan(pan_str: str) -> Tuple[bool, Optional[str]]:
    """
    Validates Indian Permanent Account Number (PAN) format.
    Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
    4th character designates taxpayer category:
    P - Individual
    C - Company
    H - Hindu Undivided Family (HUF)
    A - Association of Persons (AOP)
    B - Body of Individuals (BOI)
    G - Government Agency
    J - Artificial Juridical Person
    L - Local Authority
    F - Firm / Limited Liability Partnership
    T - Trust
    """
    clean = pan_str.strip().upper()
    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", clean):
        return False, None
    
    entity_types = {
        "P": "Individual",
        "C": "Company",
        "H": "HUF",
        "A": "Association of Persons",
        "B": "Body of Individuals",
        "G": "Government Agency",
        "J": "Artificial Juridical Person",
        "L": "Local Authority",
        "F": "Firm / LLP",
        "T": "Trust"
    }
    char4 = clean[3]
    entity = entity_types.get(char4, "Taxpayer")
    return True, entity


def validate_ifsc(ifsc_str: str) -> bool:
    """
    Validates Indian Financial System Code (IFSC).
    Format: 11 characters. First 4 letters (Bank code), 5th character '0', last 6 alphanumeric.
    """
    clean = ifsc_str.strip().upper()
    return bool(re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", clean))


def validate_indian_passport(ppt_str: str) -> bool:
    """
    Validates Indian Passport number.
    Format: 1 uppercase letter followed by 7 digits.
    Usually letters: A, B, C, D, E, F, G, H, J, K, L, M, N, P, R, S, T, U, V, W, Y, Z.
    """
    clean = ppt_str.strip().upper()
    return bool(re.match(r"^[A-Z][1-9][0-9]{6}$", clean))


def validate_indian_phone(phone_str: str) -> bool:
    """
    Validates an Indian mobile or landline phone number.
    Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9,
    optionally preceded by +91, 91, or 0.
    """
    clean = re.sub(r"[\s\-\(\)]", "", phone_str)
    
    # International prefix +91 or 91
    if clean.startswith("+91"):
        clean = clean[3:]
    elif clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]
    elif clean.startswith("0") and len(clean) == 11:
        clean = clean[1:]
        
    if len(clean) == 10 and clean.isdigit() and clean[0] in "6789":
        # Discard repeated digits like 9999999999 or 8888888888
        if len(set(clean)) == 1:
            return False
        # Discard consecutive sequences like 1234567890
        if clean in ("1234567890", "9876543210"):
            return False
        return True
    return False


def validate_date_of_birth(dob_str: str) -> Tuple[bool, Optional[int]]:
    """
    Validates if string represents a realistic Date of Birth.
    Returns (is_valid, age_years_estimate).
    """
    clean = dob_str.strip()
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
        "%Y-%m-%d", "%Y/%m/%d",
        "%d %b %Y", "%d %B %Y",
        "%b %d, %Y", "%B %d, %Y"
    ]
    
    current_year = datetime.now().year
    for fmt in formats:
        try:
            dt = datetime.strptime(clean, fmt)
            # Reasonable human age: born between 1905 and current year
            if 1905 <= dt.year <= current_year:
                age = current_year - dt.year
                return True, age
        except ValueError:
            continue
            
    return False, None


def validate_abha(abha_str: str) -> bool:
    """
    Validates Ayushman Bharat Health Account (ABHA) ID / National Health ID.
    Format: 14 digits, typically formatted as XX-XXXX-XXXX-XXXX or 14 continuous digits.
    """
    clean = re.sub(r"[\s\-]", "", abha_str)
    return len(clean) == 14 and clean.isdigit()
