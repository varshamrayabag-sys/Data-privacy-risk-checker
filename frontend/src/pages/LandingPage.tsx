import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  Lock, 
  ArrowRight, 
  ShieldAlert, 
  FileText,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [showMasked, setShowMasked] = useState(false);

  return (
    <div className="space-y-24 py-4">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-white/10 text-xs font-mono text-[#a1a1a6]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>OFFLINE PII AUDIT & REDACTION DESK</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#ededed] leading-[1.12]">
          Detect sensitive personal data.<br />
          <span className="text-[#a1a1a6]">Assess and neutralize privacy risks.</span>
        </h1>

        <p className="text-base text-[#a1a1a6] leading-relaxed max-w-2xl mx-auto">
          Automated privacy scanner utilizing Microsoft Presidio, spaCy NLP, and algorithmic checksum verifiers to discover sensitive identifiers, calculate explainable risk scores (0–100), and produce compliance reports.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/scanner"
            className="w-full sm:w-auto h-11 px-6 rounded-lg font-medium text-sm text-[#141415] bg-[#ededed] hover:bg-white flex items-center justify-center gap-2 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
          >
            <Scan className="w-4 h-4 stroke-[1.5]" />
            <span>Open scanner</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto h-11 px-6 rounded-lg font-medium text-sm text-[#ededed] bg-[#18181b] border border-white/10 hover:bg-[#222225] flex items-center justify-center gap-2 transition-colors"
          >
            <span>View telemetry dashboard</span>
          </Link>
        </div>

        {/* Monospace Metadata Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-[#71717a]">
          <span className="px-2 py-0.5 rounded bg-[#18181b] border border-white/[0.06]">VERHOEFF MOD-10</span>
          <span className="px-2 py-0.5 rounded bg-[#18181b] border border-white/[0.06]">LUHN CHECK</span>
          <span className="px-2 py-0.5 rounded bg-[#18181b] border border-white/[0.06]">DPDP ACT 2023</span>
          <span className="px-2 py-0.5 rounded bg-[#18181b] border border-white/[0.06]">GDPR COMPLIANT</span>
          <span className="px-2 py-0.5 rounded bg-[#18181b] border border-white/[0.06]">REPORTLAB PDF</span>
        </div>
      </section>

      {/* Crafted Hero Moment: Dual-View Redaction Preview */}
      <section className="max-w-4xl mx-auto">
        <div className="surface-card overflow-hidden">
          {/* Workstation Header */}
          <div className="px-5 py-3 border-b border-white/[0.08] bg-[#0f0f10] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="ml-2 text-xs font-mono text-[#a1a1a6]">kyc_verification_dossier.pdf</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMasked(!showMasked)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222225] border border-white/10 text-xs text-[#ededed] hover:bg-[#2a2a2e] transition-colors"
              >
                {showMasked ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#a1a1a6]" />
                    <span>View raw inspection</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Apply security mask</span>
                  </>
                )}
              </button>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                SCORE 85 • HIGH RISK
              </span>
            </div>
          </div>

          {/* Interactive Document Redactor Body */}
          <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed text-[#a1a1a6] bg-[#141415] space-y-3">
            <div className="text-[#71717a] pb-1 border-b border-white/[0.06] flex items-center justify-between">
              <span>EXECUTIVE ONBOARDING RECORD // CLASSIFIED</span>
              <span>PARSED 4 ENTITIES</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div>
                <span className="text-[#71717a]">Subject: </span>
                <span className="text-[#ededed]">Rajesh V. Sharma</span>
              </div>
              <div>
                <span className="text-[#71717a]">Aadhaar Number: </span>
                {showMasked ? (
                  <span className="redacted-block font-mono tracking-wider">XXXXXXXX1543</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    9999 4105 1543 [VERHOEFF-VERIFIED]
                  </span>
                )}
              </div>
              <div>
                <span className="text-[#71717a]">Tax Identifier (PAN): </span>
                {showMasked ? (
                  <span className="redacted-block font-mono tracking-wider">XXXXXX1234F</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    ABCPE1234F [INDIVIDUAL-ASSESSEE]
                  </span>
                )}
              </div>
              <div>
                <span className="text-[#71717a]">Contact Phone: </span>
                {showMasked ? (
                  <span className="redacted-block font-mono tracking-wider">******3210</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    +91 9876543210 [TELECOM-PREFIX]
                  </span>
                )}
              </div>
              <div>
                <span className="text-[#71717a]">Email Address: </span>
                {showMasked ? (
                  <span className="redacted-block font-mono tracking-wider">r***@company.in</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    rajesh.sharma@company.in
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#71717a]">
              <span>Correlation: National ID + Direct Contact vulnerability identified (+10 correlation points).</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Ready for sanitized export
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Data Privacy Matters */}
      <section className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-normal text-[#ededed] tracking-tight">
            Why personal information requires active scanning
          </h2>
          <p className="text-[#71717a] text-sm">
            Uncontrolled dissemination of sensitive data exposes individuals and organizations to fraud and statutory penalties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-card p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#222225] border border-white/10 flex items-center justify-center text-[#ededed]">
              <ShieldAlert className="w-4 h-4 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-medium text-[#ededed]">Synthetic identity fraud</h3>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              When national IDs like Aadhaar or PAN are paired with phone numbers and names, attackers can bypass KYC verifications and open unauthorized financial lines.
            </p>
          </div>

          <div className="surface-card p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#222225] border border-white/10 flex items-center justify-center text-[#ededed]">
              <Lock className="w-4 h-4 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-medium text-[#ededed]">Statutory compliance</h3>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              The Digital Personal Data Protection (DPDP) Act 2023 and EU GDPR impose strict mandates on processing personal data, requiring proactive discovery and masking.
            </p>
          </div>

          <div className="surface-card p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#222225] border border-white/10 flex items-center justify-center text-[#ededed]">
              <FileText className="w-4 h-4 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-medium text-[#ededed]">Credential stuffing & smishing</h3>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              Exposed contact directories enable adversaries to execute automated SIM-swapping, spear-phishing, and credential recovery exploitation.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Architecture */}
      <section className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-normal text-[#ededed] tracking-tight">
            Detection and scoring pipeline
          </h2>
          <p className="text-[#71717a] text-sm">
            Deterministic processing steps executed without external cloud dependencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="surface-card p-5 space-y-2">
            <span className="text-[10px] font-mono text-[#71717a]">PHASE 01</span>
            <h4 className="text-sm font-medium text-[#ededed]">Document ingestion</h4>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              Text payloads or uploaded PDF, DOCX, and TXT files extracted and sanitized in volatile memory.
            </p>
          </div>

          <div className="surface-card p-5 space-y-2">
            <span className="text-[10px] font-mono text-[#71717a]">PHASE 02</span>
            <h4 className="text-sm font-medium text-[#ededed]">Algorithmic validation</h4>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              Presidio and spaCy detect entities, followed by Verhoeff (Aadhaar) and Luhn (Cards) mathematical verification.
            </p>
          </div>

          <div className="surface-card p-5 space-y-2">
            <span className="text-[10px] font-mono text-[#71717a]">PHASE 03</span>
            <h4 className="text-sm font-medium text-[#ededed]">Risk quantification</h4>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              Weights mapped to statutory tiers (High, Medium, Low) with diminishing volume scaling and correlation risk.
            </p>
          </div>

          <div className="surface-card p-5 space-y-2">
            <span className="text-[10px] font-mono text-[#71717a]">PHASE 04</span>
            <h4 className="text-sm font-medium text-[#ededed]">Audit report export</h4>
            <p className="text-xs text-[#a1a1a6] leading-relaxed">
              Instant generation of sanitized masked text and downloadable ReportLab PDF compliance documentation.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities Overview */}
      <section className="surface-card p-8 max-w-5xl mx-auto space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-[#ededed]">Supported identification formats</h3>
          <p className="text-xs text-[#71717a]">
            Global privacy standards combined with specialized Indian identification patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-[#ededed]">Indian National IDs</span>
            <p className="text-[#a1a1a6] leading-relaxed">
              Aadhaar (12 digits with Verhoeff checksum), PAN (entity structure validation), and Passports.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-[#ededed]">Financial Accounts</span>
            <p className="text-[#a1a1a6] leading-relaxed">
              Credit cards with Luhn verification, bank account digits with contextual proximity, and RBI IFSC codes.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-[#ededed]">Demographic & Contact</span>
            <p className="text-[#a1a1a6] leading-relaxed">
              Validated Indian and international phone numbers, RFC email addresses, and postal locations.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-[#ededed]">Health & Licensure</span>
            <p className="text-[#a1a1a6] leading-relaxed">
              Ayushman Bharat Health Accounts (ABHA 14-digit IDs), medical licenses, and validated Dates of Birth.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-[#ededed]">Contextual Masking</span>
            <p className="text-[#a1a1a6] leading-relaxed">
              Automated character masking adhering to UIDAI guidelines (XXXX XXXX 1234) and RFC standards.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1.5">
            <span className="font-medium text-[#ededed]">PDF Audit Reports</span>
            <p className="text-[#a1a1a6] leading-relaxed">
              Generates cryptographic-style audit certificates with complete sensitivity breakdown tables.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-mono text-[#71717a]">
            100% localhost execution • Zero external telemetry
          </span>
          <Link
            to="/scanner"
            className="text-xs font-medium text-[#ededed] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>Launch scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
};
