import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const complianceGuides = [
    {
      category: "Indian Government Identifiers",
      icon: ShieldCheck,
      color: "text-cyan-400",
      borderColor: "border-cyan-500",
      items: [
        {
          title: "UIDAI Masked Aadhaar Directives",
          standard: "Aadhaar Act (2016) Section 29 & UIDAI Circulars",
          description: "Unmasked 12-digit Aadhaar numbers cannot legally be stored, photocopied, or published without statutory authorization under the Aadhaar Act.",
          remediation: [
            "Always replace the first 8 digits with 'XXXX XXXX' and display only the terminal 4 digits.",
            "Download official certified Masked Aadhaar PDFs directly from the myAadhaar portal.",
            "Never store plaintext Aadhaar numbers in databases or client-side caching mechanisms."
          ]
        },
        {
          title: "Permanent Account Number (PAN) Security",
          standard: "Income Tax Department & DPDP Act (2023)",
          description: "PAN is a permanent 10-digit alphanumeric tax identifier. Public disclosure of PAN combined with Full Name and Date of Birth allows attackers to perform fraudulent KYC verification.",
          remediation: [
            "Mask the middle 4 numeric characters as 'ABCDE****F' in non-statutory documents.",
            "Restrict PAN disclosures exclusively to SEBI-regulated, RBI-regulated, or Income Tax proceedings.",
            "Audit file stores to purge unredacted PAN scans once transaction verification is complete."
          ]
        },
        {
          title: "Indian Passport & Travel Credential Vaulting",
          standard: "Passport Act (1967) & International Civil Aviation Org (ICAO)",
          description: "Passports contain nationality, place of birth, signature, and immigration histories, representing tier-one targets for cross-border identity replication.",
          remediation: [
            "Conceal internal numeric characters (e.g., 'A******9') in general business files.",
            "Store passport copies in encrypted cold storage with time-limited access tokens."
          ]
        }
      ]
    },
    {
      category: "Financial & Payment Card Security",
      icon: CreditCard,
      color: "text-rose-400",
      borderColor: "border-rose-500",
      items: [
        {
          title: "Payment Card Isolation (PCI-DSS & RBI CoFT)",
          standard: "PCI-DSS Requirement 3.4 & RBI Card-on-File Tokenization",
          description: "Plaintext Primary Account Numbers (PANs), CVVs, and expiry dates must never be persisted on company servers or exchanged over unencrypted chat/email.",
          remediation: [
            "Display only the last 4 digits (e.g. '**** **** **** 1234') in receipts and invoices.",
            "Adopt RBI Card-on-File Tokenization (CoFT) tokens in lieu of raw cardholder numbers.",
            "Instantly redact and securely purge all CVV/CVC codes upon payment authorization."
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
      category: "Contact, Demographics & Correlation Threats",
      icon: Lock,
      color: "text-amber-400",
      borderColor: "border-amber-500",
      items: [
        {
          title: "Direct Mobile & Telecommunications Redaction",
          standard: "TRAI Telecom Commercial Communications Customer Preference Regulations",
          description: "Uncontrolled exposure of mobile phone numbers leads directly to SMS phishing (smishing), unauthorized SIM swapping, and harassment.",
          remediation: [
            "Mask contact numbers as '******3210' across public transcripts and client support portals.",
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
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Privacy Knowledge Base</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Data Privacy & Compliance Guidelines
        </h1>
        <p className="text-sm text-slate-400">
          Official security benchmarks, statutory redaction rules, and best practices for safeguarding sensitive Indian and international identifiers.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {complianceGuides.map((cat, cIdx) => {
          const Icon = cat.icon;
          return (
            <div key={cIdx} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {cat.category}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {cat.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className={`cyber-card p-6 border-l-4 ${cat.borderColor} space-y-3`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {item.standard}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                        Statutory Mitigation Procedures:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {item.remediation.map((r, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
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
