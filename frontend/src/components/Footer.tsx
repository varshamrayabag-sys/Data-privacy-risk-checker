import React from 'react';
import { Shield, Lock, FileCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-[#060911] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-base">Data Privacy Risk Checker</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            An advanced cybersecurity audit platform designed to identify, classify, and evaluate risks of Personally Identifiable Information (PII) using Microsoft Presidio, spaCy NLP, and explainable scoring.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Core Modules</h4>
          <ul className="space-y-2 text-xs">
            <li><span className="text-slate-400 hover:text-cyan-400">PII Detection Engine</span></li>
            <li><span className="text-slate-400 hover:text-cyan-400">Verhoeff Aadhaar & Luhn Validation</span></li>
            <li><span className="text-slate-400 hover:text-cyan-400">Explainable Privacy Risk Matrix (0-100)</span></li>
            <li><span className="text-slate-400 hover:text-cyan-400">PCI-DSS & DPDP Remediation</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Compliance Regimes</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>India DPDP Act (2023)</span>
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>EU GDPR Articles 5, 6, 9</span>
            </li>
            <li className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>PCI-DSS Cardholder Standards</span>
            </li>
            <li className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>UIDAI Masked Aadhaar Mandates</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">Security & Integrity</h4>
          <p className="text-xs leading-relaxed text-slate-400 mb-2">
            No permanent raw sensitive data storage. Temporary document buffers are immediately scrubbed upon completion.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-cyan-400 font-mono">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Local & Private Processing</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Data Privacy Risk Checker. Academic Cybersecurity & Privacy Research Project.</p>
        <p className="mt-2 sm:mt-0 font-mono text-[11px]">
          FastAPI • Microsoft Presidio • spaCy • MongoDB • ReportLab • React
        </p>
      </div>
    </footer>
  );
};
