import React, { useState, useEffect } from 'react';
import { 
  Download, 
  RefreshCw
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-white/[0.08] pb-4">
        <span className="text-xs font-mono text-[#71717a]">[OUTPUT // COMPLIANCE EXPORTS]</span>
        <h1 className="text-2xl font-normal text-[#ededed] tracking-tight">
          Cryptographic PDF audit reports
        </h1>
        <p className="text-xs text-[#a1a1a6]">
          Generate and stream certified vector PDF compliance certificates compiled via ReportLab.
        </p>
      </div>

      {/* Report Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="surface-card p-5 space-y-1.5">
          <span className="text-[10px] font-mono text-[#71717a]">REPORTLAB VECTOR</span>
          <h4 className="text-sm font-medium text-[#ededed]">Deterministic layout</h4>
          <p className="text-xs text-[#a1a1a6] leading-relaxed">
            Compiled using Python ReportLab with structured tabular matrices and clean typography.
          </p>
        </div>

        <div className="surface-card p-5 space-y-1.5">
          <span className="text-[10px] font-mono text-[#71717a]">PRIVACY BY DESIGN</span>
          <h4 className="text-sm font-medium text-[#ededed]">Zero raw PII storage</h4>
          <p className="text-xs text-[#a1a1a6] leading-relaxed">
            PDF audits include only sanitized masked snippets (e.g. XXXX XXXX 1234) and statistical telemetry.
          </p>
        </div>

        <div className="surface-card p-5 space-y-1.5">
          <span className="text-[10px] font-mono text-[#71717a]">STATUTORY AUDIT</span>
          <h4 className="text-sm font-medium text-[#ededed]">Compliance ready</h4>
          <p className="text-xs text-[#a1a1a6] leading-relaxed">
            Formulated for compliance verification under the DPDP Act 2023, EU GDPR, and PCI-DSS.
          </p>
        </div>
      </div>

      {/* Available Reports Section */}
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-sm font-medium text-[#ededed]">Available audit reports</h3>
            <p className="text-xs text-[#71717a]">Export individual audit summaries into signed PDF documents.</p>
          </div>

          <button
            onClick={fetchScans}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#141415] hover:bg-[#222225] border border-white/10 text-[#ededed] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#71717a] font-mono">
            Loading available reports...
          </div>
        ) : scans.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717a]">
            No completed scans found. Run a scan to generate a downloadable audit certificate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#71717a] bg-[#141415]">
                  <th className="py-2.5 px-3">Audit Reference</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3 text-right">PDF Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {scans.map((s) => {
                  const isHigh = s.risk_category === 'HIGH';
                  const isMed = s.risk_category === 'MEDIUM';
                  const badgeColor = isHigh
                    ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                    : isMed
                    ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                    : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

                  return (
                    <tr key={s.scan_id} className="hover:bg-[#222225]/40 transition-colors">
                      <td className="py-2.5 px-3 text-[#ededed]">
                        <span className="font-mono">{s.scan_id}</span>
                        {s.document_name && (
                          <span className="text-[10px] text-[#71717a] block">{s.document_name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#71717a]">{s.timestamp}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${badgeColor}`}>
                          {s.risk_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#ededed] font-mono">{s.risk_score} / 100</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDownload(s.scan_id)}
                          disabled={downloadingId === s.scan_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#222225] hover:bg-[#2a2a2e] text-xs font-mono text-[#ededed] border border-white/10 transition-colors disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5 text-[#a1a1a6]" />
                          <span>{downloadingId === s.scan_id ? 'Exporting...' : 'PDF'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
