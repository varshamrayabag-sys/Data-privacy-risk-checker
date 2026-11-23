import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History, 
  Trash2, 
  Eye, 
  Download, 
  AlertCircle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { ScanHistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHistory(100, 0);
      setHistoryList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleViewScan = async (scanId: string) => {
    try {
      const fullScan = await api.getScanDetails(scanId);
      sessionStorage.setItem('current_scan_result', JSON.stringify(fullScan));
      navigate('/dashboard', { state: { scanResult: fullScan } });
    } catch (err) {
      alert(`Could not load scan details for ${scanId}`);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm(`Are you sure you want to delete audit record ${scanId}?`)) {
      return;
    }
    try {
      await api.deleteScan(scanId);
      setHistoryList(prev => prev.filter(item => item.scan_id !== scanId));
    } catch (err) {
      alert("Failed to delete scan record.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all audit history records? This cannot be undone.")) {
      return;
    }
    setIsClearing(true);
    try {
      await api.clearAllHistory();
      setHistoryList([]);
    } catch (err) {
      alert("Failed to clear scan history.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownloadPDF = async (scanId: string) => {
    try {
      const response = await fetch(`/api/v1/reports/${scanId}`);
      if (!response.ok) throw new Error("Failed to download PDF");
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
      alert("Error generating PDF report.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#71717a]">[TELEMETRY // AUDIT ARCHIVE]</span>
          <h1 className="text-2xl font-normal text-[#ededed] tracking-tight">
            Audit history
          </h1>
          <p className="text-xs text-[#a1a1a6]">
            Historical compliance scans and privacy risk assessments stored in local persistence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#18181b] hover:bg-[#222225] border border-white/10 text-[#ededed] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#71717a]" />
            <span>Refresh</span>
          </button>
          {historyList.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Clear history'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table or Empty State */}
      <div className="surface-card p-6 space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#71717a] font-mono">
            Loading audit records...
          </div>
        ) : historyList.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
            <History className="w-8 h-8 mx-auto text-[#71717a]" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-[#ededed]">No scan history recorded</h3>
              <p className="text-xs text-[#71717a]">
                New scans will automatically appear in this local audit log.
              </p>
            </div>
            <Link
              to="/scanner"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium bg-[#ededed] text-[#141415] text-xs hover:bg-white transition-colors"
            >
              <span>Scan first document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#71717a] bg-[#141415]">
                  <th className="py-2.5 px-3">Audit ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Entities</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {historyList.map((item) => {
                  const isHigh = item.risk_category === 'HIGH';
                  const isMed = item.risk_category === 'MEDIUM';
                  const badgeColor = isHigh
                    ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                    : isMed
                    ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                    : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

                  return (
                    <tr key={item.scan_id} className="hover:bg-[#222225]/40 transition-colors">
                      <td className="py-2.5 px-3 text-[#ededed]">
                        <button
                          onClick={() => handleViewScan(item.scan_id)}
                          className="hover:underline text-left"
                        >
                          {item.scan_id}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-[#71717a]">{item.timestamp}</td>
                      <td className="py-2.5 px-3 uppercase text-[#a1a1a6]">
                        {item.input_type}
                        {item.document_name && <span className="text-[10px] text-[#71717a] block">{item.document_name}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${badgeColor}`}>
                          {item.risk_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#ededed] font-mono">{item.risk_score} / 100</td>
                      <td className="py-2.5 px-3 text-[#a1a1a6]">{item.total_entities}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewScan(item.scan_id)}
                            title="View Inspection"
                            className="p-1.5 rounded hover:bg-[#222225] text-[#a1a1a6] hover:text-[#ededed] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(item.scan_id)}
                            title="Download PDF"
                            className="p-1.5 rounded hover:bg-[#222225] text-[#a1a1a6] hover:text-[#ededed] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteScan(item.scan_id)}
                            title="Delete"
                            className="p-1.5 rounded hover:bg-rose-500/20 text-[#71717a] hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
