import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  Activity, 
  Lock,
  ArrowRight,
  Info,
  BarChart3,
  FileText
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { ScanResponse, DashboardSummary } from '../types';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'current' | 'system'>('current');
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [systemSummary, setSystemSummary] = useState<DashboardSummary | null>(null);
  const [viewMode, setViewMode] = useState<'highlighted' | 'masked'>('highlighted');
  const [copied, setCopied] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const fetchSummary = async () => {
    try {
      const summary = await api.getDashboardSummary();
      setSystemSummary(summary);
    } catch (err) {
      console.error("Failed to load dashboard summary", err);
    }
  };

  useEffect(() => {
    fetchSummary();

    // 1. Check router state
    if (location.state && (location.state as any).scanResult) {
      const res = (location.state as any).scanResult;
      setScanData(res);
      sessionStorage.setItem('current_scan_result', JSON.stringify(res));
      setActiveTab('current');
      return;
    }

    // 2. Check sessionStorage
    const cached = sessionStorage.getItem('current_scan_result');
    if (cached) {
      try {
        setScanData(JSON.parse(cached));
        return;
      } catch (e) {
        console.error("Failed to parse cached scan result", e);
      }
    }

    // 3. Fallback: fetch most recent scan from history
    const fetchLatest = async () => {
      try {
        const history = await api.getHistory(1, 0);
        if (history && history.length > 0) {
          const latest = await api.getScanDetails(history[0].scan_id);
          setScanData(latest);
          sessionStorage.setItem('current_scan_result', JSON.stringify(latest));
        } else {
          setActiveTab('system');
        }
      } catch (err) {
        console.log("No previous scans found or failed to fetch", err);
      }
    };
    fetchLatest();
  }, [location.state]);

  const handleCopyMasked = () => {
    if (!scanData?.masked_text) return;
    navigator.clipboard.writeText(scanData.masked_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMasked = () => {
    if (!scanData?.masked_text) return;
    const blob = new Blob([scanData.masked_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Masked_${scanData.scan_id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!scanData?.scan_id) return;
    setIsDownloadingReport(true);
    try {
      const response = await fetch(`/api/v1/reports/${scanData.scan_id}`);
      if (!response.ok) throw new Error("Failed to download PDF report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Privacy_Audit_Report_${scanData.scan_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Error generating PDF report. Please verify backend service.");
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // Build Highlighted Text with Colored Entity Chips
  const renderHighlightedText = () => {
    if (!scanData) return null;
    const text = scanData.original_text || scanData.masked_text;
    if (!text || scanData.detected_entities.length === 0) {
      return <div className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{text}</div>;
    }

    const sorted = [...scanData.detected_entities].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((ent, i) => {
      if (ent.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{text.slice(lastIndex, ent.start)}</span>
        );
      }

      const chipColor = ent.sensitivity_level === 'HIGH'
        ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
        : ent.sensitivity_level === 'MEDIUM'
        ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
        : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';

      elements.push(
        <span
          key={`ent-${i}-${ent.start}`}
          title={`${ent.entity_type} • ${ent.sensitivity_level} Severity • Conf: ${Math.round(ent.confidence_score * 100)}% • ${ent.validation_details || 'Detected'}`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-mono font-bold cursor-help transition-all hover:scale-105 ${chipColor}`}
        >
          <span>{text.slice(ent.start, ent.end)}</span>
          <span className="text-[10px] opacity-75 font-sans uppercase">[{ent.entity_type}]</span>
        </span>
      );

      lastIndex = ent.end;
    });

    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
    }

    return (
      <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
        {elements}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* View Switcher: Current Scan vs System Analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'current'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Active Audit Inspection</span>
          </button>
          <button
            onClick={() => { setActiveTab('system'); fetchSummary(); }}
            className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'system'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>System Aggregate Analytics</span>
          </button>
        </div>

        {activeTab === 'current' && scanData && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isDownloadingReport ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <Link
              to="/scanner"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs transition-all shadow-sm"
            >
              <span>Scan New</span>
            </Link>
          </div>
        )}
      </div>

      {/* VIEW 1: ACTIVE AUDIT INSPECTION */}
      {activeTab === 'current' && (
        <>
          {!scanData ? (
            <div className="cyber-card py-16 px-4 text-center space-y-4 max-w-lg mx-auto">
              <Activity className="w-10 h-10 mx-auto text-slate-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Active Scan Loaded</h3>
                <p className="text-xs text-slate-400">
                  Run a privacy scan to inspect detected entities, risk contributions, and masked data.
                </p>
              </div>
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs shadow-md shadow-cyan-500/20"
              >
                <span>Launch Scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                    AUDIT ID: {scanData.scan_id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {scanData.timestamp}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Privacy Risk & PII Audit Details
                </h2>
                <p className="text-xs text-slate-400">
                  Source: <b className="text-slate-300 uppercase">{scanData.input_type}</b>
                  {scanData.document_name && <span> ({scanData.document_name})</span>} • Processed in <b className="text-cyan-400">{scanData.processing_time_ms} ms</b>
                </p>
              </div>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Score */}
                {(() => {
                  const risk = scanData.risk_assessment;
                  const isHigh = risk.category === 'HIGH';
                  const isMed = risk.category === 'MEDIUM';
                  const riskColor = isHigh ? 'text-rose-400' : (isMed ? 'text-amber-400' : 'text-emerald-400');
                  const riskBg = isHigh ? 'bg-rose-500/10 border-rose-500/30' : (isMed ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30');

                  return (
                    <div className={`cyber-card p-5 flex flex-col justify-between ${riskBg}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Risk Score</span>
                        {isHigh ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className={`w-4 h-4 ${riskColor}`} />}
                      </div>
                      <div className="my-2 flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${riskColor}`}>{risk.score}</span>
                        <span className="text-xs text-slate-500 font-mono">/ 100</span>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border inline-block w-fit ${riskBg} ${riskColor}`}>
                        {risk.category} RISK
                      </span>
                    </div>
                  );
                })()}

                <div className="cyber-card p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Total Detected</span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="my-2 text-4xl font-black text-white">
                    {scanData.total_entities_detected}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    From {scanData.character_count.toLocaleString()} chars
                  </span>
                </div>

                <div className="cyber-card p-5 flex flex-col justify-between border-rose-950/60 bg-[#0e121e]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono tracking-wider text-rose-400 uppercase">High Sensitivity</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="my-2 text-4xl font-black text-rose-400">
                    {scanData.high_sensitivity_count}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Aadhaar, PAN, Cards, Accounts
                  </span>
                </div>

                <div className="cyber-card p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Medium & Low</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="my-2 flex items-baseline gap-3 text-white">
                    <span className="text-3xl font-extrabold text-amber-400">{scanData.medium_sensitivity_count}</span>
                    <span className="text-xs text-slate-500">Med</span>
                    <span className="text-3xl font-extrabold text-emerald-400 ml-2">{scanData.low_sensitivity_count}</span>
                    <span className="text-xs text-slate-500">Low</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Phone, Email, Addresses, Names
                  </span>
                </div>
              </div>

              {/* Summary Rationale */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Assessment Summary</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {scanData.risk_assessment.summary}
                  </p>
                </div>
              </div>

              {/* Inspection & Masking Panel */}
              <div className="cyber-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>Data Masking & Redaction View</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Toggle between highlighted original text and masked representation.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('highlighted')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          viewMode === 'highlighted'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Highlighted
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('masked')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          viewMode === 'masked'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Masked
                      </button>
                    </div>

                    <button
                      onClick={handleCopyMasked}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium transition-all"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownloadMasked}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium transition-all"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#080d19] rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
                  {viewMode === 'highlighted' ? (
                    renderHighlightedText()
                  ) : (
                    <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-cyan-200">
                      {scanData.masked_text}
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Entities Table */}
              <div className="cyber-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Detected Entities ({scanData.detected_entities.length})</span>
                  </h3>
                </div>

                {scanData.detected_entities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-900/60">
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Sensitivity</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Validation Status</th>
                          <th className="py-2.5 px-3">Masked Version</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {scanData.detected_entities.map((ent, idx) => {
                          const sensBadge = ent.sensitivity_level === 'HIGH'
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                            : ent.sensitivity_level === 'MEDIUM'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                          return (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 font-bold text-white">{ent.entity_type}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${sensBadge}`}>
                                  {ent.sensitivity_level}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">
                                {Math.round(ent.confidence_score * 100)}%
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">
                                {ent.is_validated ? (
                                  <span className="text-emerald-400 font-semibold">
                                    ✓ {ent.validation_details || 'Verified'}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-normal">
                                    {ent.validation_details || 'Format Match'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-cyan-300">{ent.masked_text}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No entities detected.</p>
                )}
              </div>

              {/* Explainable Scoring Matrix */}
              <div className="cyber-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Explainable Mathematical Formula & Risk Breakdown</span>
                </h3>

                {scanData.risk_assessment.breakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-900/60">
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Count</th>
                          <th className="py-2 px-3">Base Weight</th>
                          <th className="py-2 px-3">Assigned Points</th>
                          <th className="py-2 px-3">Risk Justification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {scanData.risk_assessment.breakdown.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-semibold text-white">{b.entity_type}</td>
                            <td className="py-2.5 px-3 text-slate-300">{b.count}</td>
                            <td className="py-2.5 px-3 text-slate-400">{b.weight_per_item} pts</td>
                            <td className="py-2.5 px-3 font-bold text-cyan-400">+{b.total_points}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-sans text-xs">{b.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Zero risk points (Clean document).</p>
                )}
              </div>

              {/* Recommendations */}
              <div className="cyber-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Actionable Privacy Directives</span>
                </h3>

                <div className="space-y-3">
                  {scanData.recommendations.map((rec) => {
                    const isCrit = rec.severity === 'CRITICAL';
                    const isWarn = rec.severity === 'WARNING';
                    const badgeColor = isCrit
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : isWarn
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                    const leftBorder = isCrit ? 'border-l-rose-500' : isWarn ? 'border-l-amber-500' : 'border-l-blue-500';

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl bg-slate-900/50 border border-slate-800 border-l-4 ${leftBorder} space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{rec.title}</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border font-mono ${badgeColor}`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {rec.description}
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pt-1">
                          {rec.action_steps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: SYSTEM AGGREGATE ANALYTICS */}
      {activeTab === 'system' && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Enterprise Privacy Risk Posture
            </h2>
            <p className="text-xs text-slate-400">
              Macro telemetry calculated across all historical document scans stored in the database.
            </p>
          </div>

          {!systemSummary || systemSummary.total_scans === 0 ? (
            <div className="cyber-card py-16 px-4 text-center space-y-4 max-w-lg mx-auto">
              <Activity className="w-10 h-10 mx-auto text-slate-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Historical Telemetry Yet</h3>
                <p className="text-xs text-slate-400">
                  Run privacy scans to compile aggregated enterprise risk analytics.
                </p>
              </div>
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-cyan-500 text-slate-950 text-xs shadow-md shadow-cyan-500/20"
              >
                <span>Execute First Scan</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Macro Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="cyber-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>TOTAL SCANS</span>
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-4xl font-black text-white">{systemSummary.total_scans}</div>
                  <span className="text-[11px] text-slate-500 font-mono">Processed audits</span>
                </div>

                <div className="cyber-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>AVG RISK SCORE</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-4xl font-black text-amber-400">{systemSummary.average_risk_score}</div>
                  <span className="text-[11px] text-slate-500 font-mono">Out of 100 max</span>
                </div>

                <div className="cyber-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>TOTAL PII DETECTED</span>
                    <Layers className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-4xl font-black text-cyan-400">{systemSummary.total_pii_detected}</div>
                  <span className="text-[11px] text-slate-500 font-mono">Across all files</span>
                </div>

                <div className="cyber-card p-5 space-y-2 border-rose-950/60 bg-[#0e121e]">
                  <div className="flex items-center justify-between text-xs font-mono text-rose-400">
                    <span>HIGH RISK AUDITS</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-4xl font-black text-rose-400">{systemSummary.high_risk_scans}</div>
                  <span className="text-[11px] text-slate-500 font-mono">{Math.round((systemSummary.high_risk_scans / systemSummary.total_scans) * 100)}% of audits</span>
                </div>
              </div>

              {/* Macro Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Aggregate Sensitivity Pie */}
                <div className="cyber-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    System-Wide Sensitivity Distribution
                  </h3>
                  <div className="h-60 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High', value: systemSummary.sensitivity_distribution.HIGH, color: '#ef4444' },
                            { name: 'Medium', value: systemSummary.sensitivity_distribution.MEDIUM, color: '#f59e0b' },
                            { name: 'Low', value: systemSummary.sensitivity_distribution.LOW, color: '#10b981' }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-xs font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High: {systemSummary.sensitivity_distribution.HIGH}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Med: {systemSummary.sensitivity_distribution.MEDIUM}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low: {systemSummary.sensitivity_distribution.LOW}</span>
                  </div>
                </div>

                {/* Aggregate Entity Frequencies Bar Chart */}
                <div className="cyber-card p-6 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Top Discovered Entity Categories
                  </h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(systemSummary.entity_distribution).map(([entity, count]) => ({
                          entity: entity.replace('IN_', ''),
                          count
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="entity" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Audits Table */}
              <div className="cyber-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Recent Enterprise Audits
                  </h3>
                  <Link to="/history" className="text-xs text-cyan-400 hover:text-cyan-300 font-mono">
                    View all logs →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-900/60">
                        <th className="py-2.5 px-3">Audit ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Risk Level</th>
                        <th className="py-2.5 px-3">Score</th>
                        <th className="py-2.5 px-3">Entities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {systemSummary.recent_scans.slice(0, 5).map((r) => {
                        const isH = r.risk_category === 'HIGH';
                        const isM = r.risk_category === 'MEDIUM';
                        const badgeColor = isH ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : (isM ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30');

                        return (
                          <tr key={r.scan_id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-bold text-white">
                              <button
                                onClick={async () => {
                                  const full = await api.getScanDetails(r.scan_id);
                                  setScanData(full);
                                  sessionStorage.setItem('current_scan_result', JSON.stringify(full));
                                  setActiveTab('current');
                                }}
                                className="text-left text-cyan-400 hover:underline"
                              >
                                {r.scan_id}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{r.timestamp}</td>
                            <td className="py-2.5 px-3 uppercase">{r.input_type}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${badgeColor}`}>
                                {r.risk_category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white">{r.risk_score} / 100</td>
                            <td className="py-2.5 px-3 text-cyan-400">{r.total_entities}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
