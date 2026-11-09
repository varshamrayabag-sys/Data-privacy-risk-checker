import os
from pathlib import Path
from typing import Dict, List
from dotenv import load_dotenv

# Load .env file from project root or backend folder
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Data Privacy Risk Checker")
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://data-privacy-checker.vercel.app",
        "*"
    ]

    # MongoDB connection
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "data_privacy_checker")
    COLLECTION_SCANS: str = "scans"

    # File restrictions
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: List[str] = [".txt", ".pdf", ".docx"]
    ALLOWED_MIME_TYPES: List[str] = [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream"
    ]

    # Risk weights as specified in Module 5
    RISK_WEIGHTS: Dict[str, int] = {
        "IN_AADHAAR": 30,
        "IN_PAN": 25,
        "IN_BANK_ACCOUNT": 30,
        "CREDIT_CARD": 30,
        "IN_PASSPORT": 25,
        "PHONE_NUMBER": 15,
        "EMAIL_ADDRESS": 10,
        "LOCATION": 20,
        "ADDRESS": 20,
        "PERSON": 5,
        "DATE_OF_BIRTH": 15,
        "IP_ADDRESS": 10,
        "IN_IFSC": 15,
        "MEDICAL_LICENSE": 20,
        "US_SSN": 30,
        "DEFAULT": 10
    }

    # Classification lists
    HIGH_SENSITIVITY_ENTITIES: List[str] = [
        "IN_AADHAAR",
        "IN_PAN",
        "IN_BANK_ACCOUNT",
        "CREDIT_CARD",
        "IN_PASSPORT",
        "US_SSN"
    ]

    MEDIUM_SENSITIVITY_ENTITIES: List[str] = [
        "PHONE_NUMBER",
        "EMAIL_ADDRESS",
        "LOCATION",
        "ADDRESS",
        "DATE_OF_BIRTH",
        "IN_IFSC",
        "MEDICAL_LICENSE"
    ]

    LOW_SENSITIVITY_ENTITIES: List[str] = [
        "PERSON",
        "IP_ADDRESS",
        "NRP",
        "URL"
    ]

    # Thresholds
    RISK_THRESHOLD_LOW_MAX: int = 30
    RISK_THRESHOLD_MEDIUM_MAX: int = 60


settings = Settings()
