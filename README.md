# DATA PRIVACY RISK CHECKER
### Full-Stack Cybersecurity & Privacy Risk Assessment Platform

![Version](https://img.shields.io/badge/version-1.0.0-cyan.svg)
![Python](https://img.shields.io/badge/python-3.13%2B-blue.svg)
![React](https://img.shields.io/badge/react-19-cyan.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-emerald.svg)
![Presidio](https://img.shields.io/badge/Microsoft-Presidio-blue.svg)
![License](https://img.shields.io/badge/license-Academic%20Research-purple.svg)

---

## 1. PROJECT OVERVIEW

The **Data Privacy Risk Checker** is an enterprise-grade cybersecurity and data privacy analysis web application. It automates the discovery, classification, and mathematical risk modeling of Personally Identifiable Information (PII) from user-entered text and uploaded documents (`.pdf`, `.docx`, `.txt`).

The system integrates **Microsoft Presidio Analyzer & Anonymizer**, **spaCy NLP**, custom algorithmic checksum verifiers (**Verhoeff** for Aadhaar, **Luhn** for payment cards), and statutory classification rules under the **Digital Personal Data Protection (DPDP) Act 2023**, **EU GDPR**, and **PCI-DSS**.

### Core Application Workflow:
```
USER INPUT (Text / Document)
     │
     ▼
TEXT EXTRACTION & SANITIZATION (PyMuPDF / python-docx / UTF-8)
     │
     ▼
PII DETECTION ENGINE (Presidio Analyzer + spaCy NLP + Custom Recognizers)
     │
     ▼
ALGORITHMIC VALIDATION (Verhoeff Checksum, Luhn Checksum, Format & Context)
     │
     ▼
DATA CLASSIFICATION (High, Medium, Low Sensitivity)
     │
     ▼
EXPLAINABLE RISK ASSESSMENT (0–100 Normalized Score & Correlation Bonus)
     │
     ▼
ACTIONABLE REMEDIATION ENGINE (Statutory & Security Best Practices)
     │
     ▼
DATA MASKING & OBFUSCATION (Aadhaar, Phone, Email, PAN Redaction)
     │
     ▼
AUDIT METADATA PERSISTENCE (MongoDB Atlas / Resilient Local Persistence)
     │
     ▼
INTERACTIVE DASHBOARD & PDF AUDIT REPORT GENERATION (ReportLab)
```

---

## 2. DETECTED IDENTIFIERS & VALIDATORS

| Entity Category | Classification | Detection Method | Validation Rule |
| :--- | :---: | :--- | :--- |
| **Indian Aadhaar** (`IN_AADHAAR`) | **HIGH** | Custom Regex + Context | **Verhoeff Checksum Algorithm** (Mod-10 non-commutative) |
| **Indian PAN** (`IN_PAN`) | **HIGH** | Custom Regex + Context | Taxpayer Entity Type Verification (4th char: P, C, H, F, etc.) |
| **Bank Account** (`IN_BANK_ACCOUNT`) | **HIGH** | Regex (9-18 digits) + Banking Keywords | Contextual Proximity Filtering |
| **Credit/Debit Card** (`CREDIT_CARD`) | **HIGH** | Presidio + Regex | **Luhn Algorithm** (Mod-10 Checksum) |
| **Indian Passport** (`IN_PASSPORT`) | **HIGH** | Custom Regex + Context | 1 Letter + 7 Digits with Travel Context |
| **Indian Phone** (`PHONE_NUMBER`) | **MEDIUM** | Telecom Prefix Regex | Valid Starting Digits (6-9) & Country Codes (+91, 0) |
| **Email Address** (`EMAIL_ADDRESS`) | **MEDIUM** | Presidio + RFC Regex | Domain & Syntax Verification |
| **Physical Address** (`LOCATION`) | **MEDIUM** | Presidio Location + PIN Code | Contextual Street/PIN/City Check |
| **Date of Birth** (`DATE_OF_BIRTH`) | **MEDIUM** | Calendar Regex + DOB Context | Realistic Calendar Date & Age Range Verification |
| **RBI IFSC Code** (`IN_IFSC`) | **MEDIUM** | Custom Regex | 4 Letters + '0' + 6 Alphanumeric Branch Code |
| **ABHA Health ID** (`MEDICAL_LICENSE`) | **MEDIUM** | 14-digit Formatted Regex | Ayushman Bharat Health Account Structure |
| **Person Name** (`PERSON`) | **LOW** | spaCy NLP Model | Named Entity Recognition (`en_core_web_sm`) |
| **IP Address** (`IP_ADDRESS`) | **LOW** | Presidio Regex | IPv4 Octet Validation (0-255) |

---

## 3. EXPLAINABLE RISK SCORING ALGORITHM

The privacy risk score is calculated via a deterministic, explainable mathematical model:

$$\text{Risk Score} = \min\left(100, \sum_{i} \text{Weight}(E_i) \times \text{Scaling}(C_i) + \text{Correlation Bonus}\right)$$

### Base Weights:
- **Aadhaar (`IN_AADHAAR`)**: 30 points
- **Bank Account (`IN_BANK_ACCOUNT`)**: 30 points
- **Payment Card (`CREDIT_CARD`)**: 30 points
- **PAN (`IN_PAN`)**: 25 points
- **Passport (`IN_PASSPORT`)**: 25 points
- **Physical Address (`LOCATION`)**: 20 points
- **Medical / ABHA (`MEDICAL_LICENSE`)**: 20 points
- **Phone (`PHONE_NUMBER`)**: 15 points
- **IFSC Code (`IN_IFSC`)**: 15 points
- **Date of Birth (`DATE_OF_BIRTH`)**: 15 points
- **Email (`EMAIL_ADDRESS`)**: 10 points
- **Person Name (`PERSON`)**: 5 points

### Volume Scaling:
First instance yields 100% of base weight. Additional instances scale at $+25\%$ diminishing marginal points up to $2.0\times$ base weight.

### Multi-Vector Correlation Bonus:
- **Identity ID + Financial Account**: $+15$ correlation risk points.
- **Identity ID + Direct Contact Details**: $+10$ correlation risk points.

### Risk Tiers:
- **0–30**: **LOW RISK** (Negligible exposure)
- **31–60**: **MEDIUM RISK** (Direct contact details; masking advised)
- **61–100**: **HIGH / CRITICAL RISK** (Severe exposure; immediate redaction required)

---

## 4. PREREQUISITES & INSTALLATION

### Prerequisites:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: 3.11, 3.12, or 3.13
- **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/data-privacy-risk-checker.git
cd "data-privacy-risk-checker"
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy English NLP model for Presidio
python -m spacy download en_core_web_sm
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install node dependencies
npm install
```

---

## 5. DATABASE CONFIGURATION (MONGODB & ATLAS)

The application natively supports **MongoDB** and **MongoDB Atlas** using `Motor` (async driver) and `PyMongo`.

### Connecting to MongoDB Atlas:
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist your IP (or allow access from anywhere `0.0.0.0/0`).
3. Obtain your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   ```
4. Place this URI in `backend/.env`:
   ```ini
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
   DATABASE_NAME="data_privacy_checker"
   ```

### Intelligent Local Fallback:
If a local MongoDB daemon is not running or no Atlas URI is provided, the backend **automatically activates a resilient local file storage repository** (`backend/data/scan_history.json`). The application starts up and runs without interruption.

---

## 6. RUNNING THE APPLICATION LOCALLY

### 1. Launch the Backend API:
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Interactive OpenAPI / Swagger Docs: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

### 2. Launch the Frontend Development Server:
In a separate terminal:
```bash
cd frontend
npm run dev
```
* Frontend Application: `http://localhost:5173`

---

## 7. REST API ENDPOINTS SPECIFICATION

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/scan/text` | Scan raw text for PII & calculate risk | `{"text": "...", "custom_weights": {...}}` |
| `POST` | `/api/v1/scan/document` | Upload & extract PDF, DOCX, TXT | `multipart/form-data` (`file`) |
| `POST` | `/api/v1/analyze/risk` | Standalone risk calculation | `{"text": "..."}` or `{"entities": [...]}` |
| `POST` | `/api/v1/analyze/recommendations` | Generate statutory remediation steps | `{"entities": [...], "risk_score": 75, "risk_category": "HIGH"}` |
| `POST` | `/api/v1/anonymize` | Redact and mask sensitive entities | `{"text": "...", "masking_char": "*"}` |
| `GET` | `/api/v1/dashboard/summary` | Aggregate dashboard statistics | None |
| `GET` | `/api/v1/history` | List previous scan audit metadata | `limit=50&skip=0` |
| `GET` | `/api/v1/history/{scan_id}` | Retrieve full audit record | Path: `scan_id` |
| `DELETE` | `/api/v1/history/{scan_id}` | Delete a scan from history | Path: `scan_id` |
| `DELETE` | `/api/v1/history` | Clear all historical scan records | None |
| `GET` | `/api/v1/reports/{scan_id}` | Generate and stream PDF audit report | Path: `scan_id` |
| `GET` | `/health` | Service and database health status | None |

---

## 8. AUTOMATED TESTING

### Backend Tests (pytest):
```bash
cd backend
pytest -v
```
**Coverage includes:**
- Verhoeff Aadhaar verification
- PAN taxpayer entity validation
- Luhn payment card checksum algorithm
- Indian mobile phone and passport pattern validation
- Text and multi-entity PII detection
- Explainable risk calculation and category boundaries
- Context-aware data masking
- PyMuPDF text extraction from PDF
- python-docx text extraction from Word documents
- Plaintext file extraction and encoding fallbacks
- FastAPI REST endpoints and error handling

### Frontend Tests (Vitest):
```bash
cd frontend
npm test
```
**Coverage includes:**
- Scanner tab navigation
- Document upload zone interactions
- Sample preset population
- Component state validation

---

## 9. SECURITY & DATA PRIVACY CONSTRAINTS

1. **Zero Permanent Raw Data Storage**: Original user documents and raw text inputs are strictly processed in volatile memory. Only anonymized statistical audit metadata is persisted.
2. **Deterministic Processing**: No user data is transmitted to third-party generative LLM endpoints. All inference is performed locally via Microsoft Presidio and spaCy.
3. **Payload Sanitization**: Input strings are scrubbed of null bytes and hazardous control sequences. Maximum payload limits (500k characters for text, 10MB for documents) prevent Denial-of-Service (DoS).
4. **MIME & Extension Enforcement**: Uploaded files undergo extension validation (`.pdf`, `.docx`, `.txt`) and stream inspection before processing.
