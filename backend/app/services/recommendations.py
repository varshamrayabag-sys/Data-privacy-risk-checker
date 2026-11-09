from typing import Dict, List, Set
from app.schemas.scan import DetectedEntity, Recommendation


class RecommendationEngine:
    """
    Intelligent privacy recommendation engine that generates context-driven,
    actionable security remediation advice based on actually detected PII types and risk levels.
    """

    def generate_recommendations(
        self,
        detected_entities: List[DetectedEntity],
        risk_score: int,
        risk_category: str
    ) -> List[Recommendation]:
        if not detected_entities:
            return [
                Recommendation(
                    id="REC_NO_PII",
                    title="Privacy Baseline Maintained",
                    description="No Personally Identifiable Information (PII) was detected in the submitted payload.",
                    severity="INFO",
                    entity_type=None,
                    action_steps=[
                        "Document is safe for sharing under standard privacy protocols.",
                        "Continue following general data hygiene guidelines."
                    ]
                )
            ]

        recommendations: List[Recommendation] = []
        entity_types: Set[str] = {e.entity_type for e in detected_entities}

        # 1. Aadhaar recommendations
        if "IN_AADHAAR" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_AADHAAR",
                    title="Aadhaar Redaction & Masking Protocol",
                    description=(
                        "A valid Indian Aadhaar number (UID) was detected. UIDAI mandates that unmasked "
                        "12-digit Aadhaar numbers must not be stored or published without statutory authorization."
                    ),
                    severity="CRITICAL",
                    entity_type="IN_AADHAAR",
                    action_steps=[
                        "Apply Masked Aadhaar format (e.g. 'XXXX XXXX 1234') where only the last 4 digits remain visible.",
                        "Download and distribute officially certified Masked e-Aadhaar from the UIDAI portal.",
                        "Ensure compliance with the Aadhaar Act (2016) and avoid physical photocopies with full numbers."
                    ]
                )
            )

        # 2. PAN recommendations
        if "IN_PAN" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_PAN",
                    title="Permanent Account Number (PAN) Protection",
                    description=(
                        "Taxpayer PAN details detected. Exposing PAN creates risks of unauthorized credit inquiries, "
                        "fraudulent loan applications, and bogus GST registrations."
                    ),
                    severity="CRITICAL",
                    entity_type="IN_PAN",
                    action_steps=[
                        "Redact middle digits as ABCDE****F in all public-facing or non-statutory records.",
                        "Disclose PAN strictly for verified tax filing, banking, or SEBI-regulated transactions.",
                        "Do not publish documents displaying PAN concurrently with Date of Birth and Full Name."
                    ]
                )
            )

        # 3. Financial accounts (Bank / Credit Card / IFSC)
        if "CREDIT_CARD" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_CREDIT_CARD",
                    title="Payment Card Data Isolation (PCI-DSS Compliance)",
                    description=(
                        "Payment card Primary Account Numbers (PANs) detected. Plaintext storage violates PCI-DSS requirements "
                        "and exposes holders to direct financial fraud."
                    ),
                    severity="CRITICAL",
                    entity_type="CREDIT_CARD",
                    action_steps=[
                        "Mask payment card numbers to show only the last 4 digits (e.g. '**** **** **** 1234').",
                        "Never transmit CVV/CVC, expiration dates, or PINs in plaintext documents.",
                        "Utilize tokenization services (RBI Card-on-File Tokenization) rather than raw card credentials."
                    ]
                )
            )

        if "IN_BANK_ACCOUNT" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_BANK_ACCOUNT",
                    title="Bank Account Number Redaction",
                    description=(
                        "Bank account numbers identified. Direct account numbers coupled with IFSC codes can facilitate "
                        "social engineering, spear phishing, or unauthorized debit attempts."
                    ),
                    severity="CRITICAL",
                    entity_type="IN_BANK_ACCOUNT",
                    action_steps=[
                        "Truncate account digits displaying only the last 4 characters.",
                        "Restrict full account visibility exclusively to authorized finance/payroll staff.",
                        "Implement dual-approval workflows before executing payouts or account modifications."
                    ]
                )
            )

        # 4. Indian Passport
        if "IN_PASSPORT" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_PASSPORT",
                    title="Passport & Travel Document Confidentiality",
                    description=(
                        "Passport identifier detected. International travel credentials are high-value targets "
                        "for cross-border identity fabrication and fraudulent travel bookings."
                    ),
                    severity="WARNING",
                    entity_type="IN_PASSPORT",
                    action_steps=[
                        "Mask all passport numbers except initial letter and trailing digit (e.g. 'A******9').",
                        "Store passport copies in encrypted vaults with role-based access control (RBAC).",
                        "Purge passport documentation once visa processing or verification lifecycles conclude."
                    ]
                )
            )

        # 5. Direct Contact details (Phone / Email / Address)
        if "PHONE_NUMBER" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_PHONE",
                    title="Personal Phone Number Obfuscation",
                    description=(
                        "Direct telephone/mobile numbers detected. Exposed contact numbers lead to SMS phishing (smishing), "
                        "telemarketing abuse, and SIM-swapping attempts."
                    ),
                    severity="WARNING",
                    entity_type="PHONE_NUMBER",
                    action_steps=[
                        "Mask phone numbers as '******3210' in customer support logs and public documents.",
                        "Use virtual numbers, PBX routing, or masked calling proxies for customer-facing reps.",
                        "Migrate away from SMS-based 2FA towards Time-based One-Time Password (TOTP) apps."
                    ]
                )
            )

        if "EMAIL_ADDRESS" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_EMAIL",
                    title="Email Address Sanitization",
                    description=(
                        "Personal email addresses identified. Unredacted email addresses are frequently scraped "
                        "by automated bots for spam campaigns, credential stuffing, and spear-phishing."
                    ),
                    severity="INFO",
                    entity_type="EMAIL_ADDRESS",
                    action_steps=[
                        "Conceal usernames using standard masking patterns like 'r***@domain.com'.",
                        "Deploy domain-level DMARC, DKIM, and SPF validation records.",
                        "Encourage team members to utilize secondary email aliases for vendor registrations."
                    ]
                )
            )

        if "LOCATION" in entity_types or "ADDRESS" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_ADDRESS",
                    title="Physical Address Anonymization",
                    description=(
                        "Physical addresses or postal PIN codes detected. Precise residential geolocation data "
                        "presents real-world safety risks and doxxing threats."
                    ),
                    severity="WARNING",
                    entity_type="LOCATION",
                    action_steps=[
                        "Generalize location data to city, state, or regional tier rather than street or flat numbers.",
                        "Strip postal PIN codes and apartment unit identifiers from shareable transcripts.",
                        "Comply with Digital Personal Data Protection Act (DPDP) location confidentiality principles."
                    ]
                )
            )

        if "DATE_OF_BIRTH" in entity_types:
            recommendations.append(
                Recommendation(
                    id="REC_DOB",
                    title="Date of Birth Redaction",
                    description=(
                        "Date of birth detected. DOB is a common secondary authentication factor used by banks and telcos; "
                        "its exposure weakens challenge-response security questions."
                    ),
                    severity="WARNING",
                    entity_type="DATE_OF_BIRTH",
                    action_steps=[
                        "Store or display age or birth year only rather than full DD/MM/YYYY calendar dates.",
                        "Never treat Date of Birth as a secure or secret verification factor in customer service."
                    ]
                )
            )

        # 6. Multi-PII Correlation Exposure Warning
        identity_count = sum(1 for e in entity_types if e in ("IN_AADHAAR", "IN_PAN", "IN_PASSPORT", "US_SSN"))
        contact_count = sum(1 for e in entity_types if e in ("PHONE_NUMBER", "EMAIL_ADDRESS", "LOCATION", "ADDRESS"))
        financial_count = sum(1 for e in entity_types if e in ("IN_BANK_ACCOUNT", "CREDIT_CARD", "IN_IFSC"))

        if (identity_count > 0 and contact_count > 0) or (identity_count > 0 and financial_count > 0) or (len(entity_types) >= 3):
            recommendations.insert(
                0,
                Recommendation(
                    id="REC_CORRELATED_RISK",
                    title="High Correlated Exposure: Composite Identity Threat",
                    description=(
                        "Multiple intersecting classes of sensitive PII (Government Identity + Contact + Financial) "
                        "were detected in this single record. When combined, these data elements allow attackers "
                        "to bypass KYC checks, execute SIM swaps, and orchestrate comprehensive identity theft."
                    ),
                    severity="CRITICAL",
                    entity_type=None,
                    action_steps=[
                        "Execute immediate data segregation (tokenize financial attributes, redact government IDs).",
                        "Do not transmit this document via unencrypted email or public messaging platforms.",
                        "Audit access logs to identify all parties who have accessed or downloaded this document.",
                        "Apply zero-trust principles: grant least-privilege visibility only to explicitly authorized personnel."
                    ]
                )
            )

        return recommendations


recommendation_engine = RecommendationEngine()
