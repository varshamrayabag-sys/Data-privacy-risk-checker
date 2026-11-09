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
    if (!confirm(`Are you sure you want to permanently delete audit record ${scanId}?`)) {
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
    if (!confirm("Are you sure you want to clear ALL audit history records? This cannot be undone.")) {
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Audit History & Logs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Historical Privacy Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable metadata of all past scans stored securely in MongoDB / Persistent Storage. No raw text is preserved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-all font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          {historyList.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs text-rose-300 transition-all font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading audit history from database...</p>
        </div>
      ) : historyList.length === 0 ? (
        /* Empty State */
        <div className="cyber-card py-20 px-4 text-center space-y-5 max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">No Previous Scans Stored</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't run any privacy checks yet. Start scanning documents to populate your audit timeline.
            </p>
          </div>
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs shadow-md shadow-cyan-500/20"
          >
            <span>Run New Privacy Scan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* Table of Records */
        <div className="cyber-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase bg-slate-900/80">
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">PII Count</th>
                  <th className="py-3 px-4">High/Med/Low</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {historyList.map((item) => {
                  const isHigh = item.risk_category === 'HIGH';
                  const isMed = item.risk_category === 'MEDIUM';
                  const badgeColor = isHigh
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : isMed
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                  return (
                    <tr key={item.scan_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <button
                          onClick={() => handleViewScan(item.scan_id)}
                          className="hover:text-cyan-400 underline decoration-cyan-500/40 text-left"
                        >
                          {item.scan_id}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{item.timestamp}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {item.input_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${badgeColor}`}>
                          {item.risk_category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {item.risk_score} / 100
                      </td>
                      <td className="py-3 px-4 font-semibold text-cyan-400">
                        {item.total_entities}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <span className="text-rose-400">{item.high_count}H</span> • <span className="text-amber-400">{item.medium_count}M</span> • <span className="text-emerald-400">{item.low_count}L</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewScan(item.scan_id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-all"
                            title="View Inspection Dashboard"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(item.scan_id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                            title="Download PDF Audit Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteScan(item.scan_id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all"
                            title="Delete Record"
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
        </div>
      )}
    </div>
  );
};
