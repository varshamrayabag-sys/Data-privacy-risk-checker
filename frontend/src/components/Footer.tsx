import React from 'react';
import { Shield, Lock, FileCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0f0f10] text-[#a1a1a6] py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#ededed]">
            <Shield className="w-4 h-4 text-[#ededed] stroke-[1.5]" />
            <span className="font-medium text-sm">Privacy Risk Checker</span>
          </div>
          <p className="leading-relaxed text-[#71717a]">
            Deterministic privacy audit workstation for discovering, classifying, and redacting Personally Identifiable Information under statutory frameworks.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-[#ededed] mb-3">Core modules</h4>
          <ul className="space-y-2 text-[#71717a]">
            <li>Presidio Analyzer & spaCy NLP</li>
            <li>Verhoeff Aadhaar & Luhn Card Validation</li>
            <li>Explainable Risk Matrix (0–100)</li>
            <li>ReportLab Cryptographic Audit PDF</li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-[#ededed] mb-3">Compliance standards</h4>
          <ul className="space-y-2 text-[#71717a]">
            <li className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Digital Personal Data Protection (DPDP) Act 2023</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>EU GDPR Articles 5, 6, 9</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>PCI-DSS Cardholder Standards</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-[#ededed] mb-3">Security posture</h4>
          <p className="leading-relaxed text-[#71717a] mb-2">
            Volatile processing architecture. Document payloads are processed in memory and never written to raw disk.
          </p>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181b] border border-white/[0.08] text-[10px] font-mono text-[#a1a1a6]">
            <span>[MODE // 100% LOCALHOST]</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#71717a]">
        <p>© {new Date().getFullYear()} Data Privacy Risk Checker. Research & Compliance Workstation.</p>
        <p className="mt-2 sm:mt-0 font-mono">
          FastAPI • Presidio • ReportLab • React 19
        </p>
      </div>
    </footer>
  );
};
