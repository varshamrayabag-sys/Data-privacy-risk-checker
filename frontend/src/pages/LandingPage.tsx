import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Database
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>CYBERSECURITY & DATA PRIVACY RISK ASSESSMENT PLATFORM</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Detect Personally Identifiable Information & <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">Neutralize Privacy Risks</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
          Automated privacy scanner utilizing Microsoft Presidio, spaCy NLP, and algorithmic checksum verifiers to discover sensitive PII, evaluate explainable risk scores (0–100), mask confidential attributes, and generate compliance-ready audit reports.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/scanner"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/25 transition-all text-base"
          >
            <Scan className="w-5 h-5 text-slate-950" />
            <span>Launch Privacy Scanner</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all text-base"
          >
            <span>View Analytics Dashboard</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            Verhoeff Aadhaar Verification
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            PAN, Passport & IFSC Detectors
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Luhn Card Validation
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ReportLab PDF Export
          </span>
        </div>
      </section>

      {/* Why Data Privacy Matters */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Why Personal Information Demands Active Protection
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Uncontrolled dissemination of sensitive PII exposes individuals and corporations to catastrophic breaches, identity theft, and severe regulatory penalties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cyber-card p-6 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Identity Theft & Synthetic Fraud</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              When government IDs like Aadhaar or PAN are exposed alongside phone numbers and names, adversaries can bypass KYC checks, execute SIM swaps, and open fraudulent financial accounts.
            </p>
          </div>

          <div className="cyber-card p-6 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">DPDP & GDPR Compliance</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The Indian Digital Personal Data Protection (DPDP) Act 2023 and EU GDPR impose strict penalties for unauthorized personal data exposure, requiring continuous data discovery and redaction.
            </p>
          </div>

          <div className="cyber-card p-6 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Preventing Credential Stuffing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Leaked email addresses, direct telephone lines, and dates of birth are harvested by automated scrapers to conduct targeted spear phishing, password reset fraud, and corporate espionage.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Architecture Workflow */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How The Privacy Risk Engine Operates
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Every scan executes through a rigorous, explainable pipeline with mathematical integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="cyber-card p-5 space-y-2 relative border-l-4 border-cyan-500">
            <div className="text-xs font-mono text-cyan-400 font-bold uppercase">Step 01</div>
            <h4 className="text-base font-bold text-white">Multi-Source Ingestion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct text entry or document uploads (PDF via PyMuPDF, DOCX via python-docx, TXT). Text is extracted and validated securely.
            </p>
          </div>

          <div className="cyber-card p-5 space-y-2 relative border-l-4 border-blue-500">
            <div className="text-xs font-mono text-blue-400 font-bold uppercase">Step 02</div>
            <h4 className="text-base font-bold text-white">Dual-Tier PII Detection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Microsoft Presidio with spaCy NLP identifies personal entities while custom Indian recognizers validate Aadhaar (Verhoeff) and PAN.
            </p>
          </div>

          <div className="cyber-card p-5 space-y-2 relative border-l-4 border-amber-500">
            <div className="text-xs font-mono text-amber-400 font-bold uppercase">Step 03</div>
            <h4 className="text-base font-bold text-white">Explainable Risk Scoring</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Entities are classified into High/Medium/Low sensitivity. An explainable mathematical algorithm computes the risk score (0–100).
            </p>
          </div>

          <div className="cyber-card p-5 space-y-2 relative border-l-4 border-emerald-500">
            <div className="text-xs font-mono text-emerald-400 font-bold uppercase">Step 04</div>
            <h4 className="text-base font-bold text-white">Redaction & PDF Report</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sensitive data is masked (e.g. XXXX XXXX 1234), specific remediation steps are generated, and a downloadable PDF report is produced.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities Matrix */}
      <section className="cyber-card p-8 sm:p-10 border border-slate-800 bg-gradient-to-b from-[#0c1322] to-[#070b14] space-y-8">
        <div className="max-w-2xl space-y-2">
          <h3 className="text-2xl font-bold text-white">Comprehensive Detection Capabilities</h3>
          <p className="text-sm text-slate-400">
            Supports both global privacy standards and specialized Indian identification formats with algorithmic verification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-sm text-cyan-300">Indian National IDs</div>
            <p className="text-xs text-slate-400">
              Aadhaar (12-digit with Verhoeff checksum), PAN (Permanent Account Number with entity validation), and Indian Passports.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-sm text-cyan-300">Banking & Financial Data</div>
            <p className="text-xs text-slate-400">
              Credit/Debit cards with Luhn validation, Bank Account numbers with contextual filtering, and RBI IFSC codes.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-sm text-cyan-300">Contact & Demographics</div>
            <p className="text-xs text-slate-400">
              Indian (+91) and international telephone numbers, verified RFC email addresses, and postal locations.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-sm text-cyan-300">Health & Identification</div>
            <p className="text-xs text-slate-400">
              Ayushman Bharat Health Account (ABHA 14-digit IDs), medical licenses, and validated Dates of Birth.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-sm text-cyan-300">Real-Time Masking</div>
            <p className="text-xs text-slate-400">
              Generates masked representations with copy and download support so sanitized versions can be safely distributed.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-sm text-cyan-300">Auditable PDF Export</div>
            <p className="text-xs text-slate-400">
              Generates high-definition PDF reports with executive summaries, risk breakdowns, and statutory recommendations.
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800/80">
          <span className="text-xs text-slate-500 font-mono">
            Zero external LLM API dependencies • Fully self-contained local processing
          </span>
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>Start scanning now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
