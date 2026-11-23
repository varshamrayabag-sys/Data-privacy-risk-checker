import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const complianceGuides = [
    {
      category: "Indian Government Identifiers",
      icon: ShieldCheck,
      items: [
        {
          title: "UIDAI Masked Aadhaar Directives",
          standard: "Aadhaar Act (2016) Section 29 & UIDAI Circulars",
          description: "Unmasked 12-digit Aadhaar numbers cannot legally be stored, photocopied, or published without statutory authorization under the Aadhaar Act.",
          remediation: [
            "Replace the initial 8 digits with 'XXXX XXXX' and display only the terminal 4 digits.",
            "Download official certified Masked Aadhaar PDFs directly from the UIDAI portal.",
            "Never store plaintext Aadhaar numbers in databases or client-side caching mechanisms."
          ]
        },
        {
          title: "Permanent Account Number (PAN) Protection",
          standard: "Income Tax Department & DPDP Act (2023)",
          description: "PAN is a permanent 10-digit alphanumeric tax identifier. Public disclosure combined with Full Name and Date of Birth enables attackers to execute fraudulent KYC verification.",
          remediation: [
            "Mask the middle 4 numeric characters as 'ABCDE****F' in non-statutory documents.",
            "Restrict PAN disclosures exclusively to SEBI-regulated, RBI-regulated, or Income Tax proceedings.",
            "Audit file stores to purge unredacted PAN scans once transaction verification is complete."
          ]
        },
        {
          title: "Indian Passport & Travel Credential Vaulting",
          standard: "Passport Act (1967) & International Civil Aviation Org (ICAO)",
          description: "Passports contain nationality, place of birth, signature, and immigration histories, representing tier-one targets for identity replication.",
          remediation: [
            "Conceal internal numeric characters (e.g. 'A******9') in general business files.",
            "Store passport copies in encrypted cold storage with time-limited access tokens."
          ]
        }
      ]
    },
    {
      category: "Financial & Payment Card Security",
      icon: CreditCard,
      items: [
        {
          title: "Payment Card Isolation (PCI-DSS & RBI CoFT)",
          standard: "PCI-DSS Requirement 3.4 & RBI Card-on-File Tokenization",
          description: "Plaintext Primary Account Numbers (PANs), CVVs, and expiry dates must never be persisted on company servers or exchanged over unencrypted chat/email.",
          remediation: [
            "Display only the last 4 digits (e.g. '**** **** **** 1234') in receipts and invoices.",
            "Adopt RBI Card-on-File Tokenization (CoFT) tokens in lieu of raw cardholder numbers.",
            "Redact and securely purge all CVV/CVC codes immediately upon payment authorization."
          ]
        },
        {
          title: "Bank Account & IFSC Segregation",
          standard: "RBI Cyber Security Framework for Banks",
          description: "A combination of Bank Account Numbers and IFSC codes facilitates unauthorized direct debits, spear phishing, and financial social engineering.",
          remediation: [
            "Truncate account sequences in customer communications, revealing only the last 4 digits.",
            "Isolate accounting databases behind zero-trust multi-factor authentication (MFA)."
          ]
        }
      ]
    },
    {
      category: "Contact, Demographics & Correlation Vulnerabilities",
      icon: Lock,
      items: [
        {
          title: "Direct Mobile & Telecommunications Redaction",
          standard: "TRAI Telecom Commercial Communications Customer Preference Regulations",
          description: "Uncontrolled exposure of mobile phone numbers leads directly to SMS phishing (smishing), unauthorized SIM swapping, and harassment.",
          remediation: [
            "Mask contact numbers as '******3210' across public transcripts and customer support logs.",
            "Transition sensitive service verifications from SMS-based OTPs to app-based TOTP or hardware security keys (FIDO2)."
          ]
        },
        {
          title: "Composite Identity Correlation Vulnerability",
          standard: "National Institute of Standards and Technology (NIST SP 800-122)",
          description: "When an individual's Government ID, Direct Phone, Email, and Financial details are present within a single record, an attacker can synthesize a complete fraudulent identity.",
          remediation: [
            "Enforce strict data minimization: collect only the minimum attributes required for the explicit purpose.",
            "Segment customer records across distinct microservices so single breaches cannot expose correlated dossiers."
          ]
        }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-white/[0.08] pb-4">
        <span className="text-xs font-mono text-[#71717a]">[COMPLIANCE // STATUTORY FRAMEWORKS]</span>
        <h1 className="text-2xl font-normal text-[#ededed] tracking-tight">
          Privacy recommendations & remediation
        </h1>
        <p className="text-xs text-[#a1a1a6]">
          Actionable directives and statutory protocols under UIDAI, PCI-DSS, EU GDPR, and the DPDP Act 2023.
        </p>
      </div>

      <div className="space-y-6">
        {complianceGuides.map((group, gIdx) => {
          const Icon = group.icon;
          return (
            <div key={gIdx} className="surface-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <div className="w-6 h-6 rounded bg-[#222225] border border-white/10 flex items-center justify-center text-[#ededed]">
                  <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                </div>
                <h2 className="text-sm font-medium text-[#ededed]">
                  {group.category}
                </h2>
              </div>

              <div className="space-y-4">
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-medium text-[#ededed]">{item.title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181b] border border-white/10 text-[#71717a]">
                        {item.standard}
                      </span>
                    </div>

                    <p className="text-xs text-[#a1a1a6] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-1">
                      <span className="text-[11px] font-medium text-[#ededed] block mb-1">
                        Mandated remediation steps:
                      </span>
                      <ul className="list-disc list-inside text-xs text-[#71717a] space-y-1">
                        {item.remediation.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
