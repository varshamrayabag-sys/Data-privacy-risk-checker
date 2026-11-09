import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import type { ScanHistoryItem } from '../types';

export const ReportsPage: React.FC = () => {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchScans = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHistory(50, 0);
      setScans(data);
    } catch (err) {
      console.error("Failed to load reports history", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleDownload = async (scanId: string) => {
    setDownloadingId(scanId);
    try {
      const response = await fetch(`/api/v1/reports/${scanId}`);
      if (!response.ok) throw new Error("Report download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Privacy_Audit_Report_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert("Error downloading report.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Audit & Compliance Reports</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Cryptographic PDF Audit Reports
        </h1>
        <p className="text-sm text-slate-400">
          Download certified, professional PDF reports summarizing privacy risks, sensitivity classifications, explainable formulas, and remediation directives generated via Python ReportLab.
        </p>
      </div>

      {/* Report Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card p-5 space-y-2 border-t-2 border-cyan-500">
          <div className="text-xs font-mono font-bold text-cyan-400">REPORTLAB ENGINE</div>
          <h4 className="text-sm font-bold text-white">Full Vector PDF Formatting</h4>
          <p className="text-xs text-slate-400">
            Engineered using ReportLab with custom cybersecurity palettes, structured tabular grids, and clean typography.
          </p>
        </div>

        <div className="cyber-card p-5 space-y-2 border-t-2 border-blue-500">
          <div className="text-xs font-mono font-bold text-blue-400">STRICT PRIVACY</div>
          <h4 className="text-sm font-bold text-white">Zero Raw PII Exposure</h4>
          <p className="text-xs text-slate-400">
            All reports strictly contain masked snippets (e.g. XXXX XXXX 1234) and metadata. Raw sensitive text is never included.
          </p>
        </div>

        <div className="cyber-card p-5 space-y-2 border-t-2 border-emerald-500">
          <div className="text-xs font-mono font-bold text-emerald-400">COMPLIANCE READY</div>
          <h4 className="text-sm font-bold text-white">DPDP & GDPR Audit Trail</h4>
          <p className="text-xs text-slate-400">
            Complete with verification timestamps, audit hashes, risk scores, and statutory legal disclaimers.
          </p>
        </div>
      </div>

      {/* Available Reports Section */}
      <div className="cyber-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Available Audit Reports</h3>
            <p className="text-xs text-slate-400">
              Select any past audit session to generate and stream the official PDF.
            </p>
          </div>
          <button
            onClick={fetchScans}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-cyan-400" />
            <p>Fetching report inventory...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p>No scans recorded yet. Execute a scan in the Scanner to generate a report.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((s) => {
              const isHigh = s.risk_category === 'HIGH';
              const isMed = s.risk_category === 'MEDIUM';
              const badgeStyle = isHigh
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                : isMed
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

              return (
                <div
                  key={s.scan_id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-mono">{s.scan_id}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border font-mono ${badgeStyle}`}>
                        {s.risk_category} RISK ({s.risk_score}/100)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {s.timestamp}
                      </span>
                      <span>Type: <b className="text-slate-300 uppercase">{s.input_type}</b></span>
                      <span>Entities: <b className="text-cyan-400">{s.total_entities}</b></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(s.scan_id)}
                    disabled={downloadingId === s.scan_id}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 shadow-sm transition-all whitespace-nowrap"
                  >
                    {downloadingId === s.scan_id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Audit</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
