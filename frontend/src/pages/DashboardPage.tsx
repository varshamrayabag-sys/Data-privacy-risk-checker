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

    if (location.state && (location.state as any).scanResult) {
      const res = (location.state as any).scanResult;
      setScanData(res);
      sessionStorage.setItem('current_scan_result', JSON.stringify(res));
      setActiveTab('current');
      return;
    }

    const cached = sessionStorage.getItem('current_scan_result');
    if (cached) {
      try {
        setScanData(JSON.parse(cached));
        return;
      } catch (e) {
        console.error("Failed to parse cached scan result", e);
      }
    }

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

  const renderHighlightedText = () => {
    if (!scanData) return null;
    const text = scanData.original_text || scanData.masked_text;
    if (!text || scanData.detected_entities.length === 0) {
      return <div className="text-[#a1a1a6] leading-relaxed font-mono whitespace-pre-wrap">{text}</div>;
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
        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
        : ent.sensitivity_level === 'MEDIUM'
        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';

      elements.push(
        <span
          key={`ent-${i}-${ent.start}`}
          title={`${ent.entity_type} • ${ent.sensitivity_level} • Conf: ${Math.round(ent.confidence_score * 100)}%`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-normal ${chipColor}`}
        >
          <span>{text.slice(ent.start, ent.end)}</span>
          <span className="text-[10px] opacity-75 font-mono">[{ent.entity_type}]</span>
        </span>
      );

      lastIndex = ent.end;
    });

    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
    }

    return (
      <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[#ededed]">
        {elements}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Switcher: Current Scan vs System Analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="inline-flex items-center p-0.5 bg-[#18181b] border border-white/[0.08] rounded-lg">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'current'
                ? 'bg-[#222225] text-[#ededed] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-[#a1a1a6] hover:text-[#ededed]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Active inspection</span>
          </button>
          <button
            onClick={() => { setActiveTab('system'); fetchSummary(); }}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'system'
                ? 'bg-[#222225] text-[#ededed] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-[#a1a1a6] hover:text-[#ededed]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Aggregate telemetry</span>
          </button>
        </div>

        {activeTab === 'current' && scanData && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium bg-[#18181b] hover:bg-[#222225] border border-white/10 text-[#ededed] text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#a1a1a6]" />
              <span>{isDownloadingReport ? 'Generating...' : 'Export PDF audit'}</span>
            </button>
            <Link
              to="/scanner"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium bg-[#ededed] hover:bg-white text-[#141415] text-xs transition-colors"
            >
              <span>Scan new file</span>
            </Link>
          </div>
        )}
      </div>

      {/* VIEW 1: ACTIVE AUDIT INSPECTION */}
      {activeTab === 'current' && (
        <>
          {!scanData ? (
            <div className="surface-card py-16 px-4 text-center space-y-3 max-w-md mx-auto">
              <Activity className="w-8 h-8 mx-auto text-[#71717a]" />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[#ededed]">No active scan record</h3>
                <p className="text-xs text-[#71717a]">
                  Execute a privacy scan to view detected entities, risk contributions, and masked output.
                </p>
              </div>
              <Link
                to="/scanner"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium bg-[#ededed] text-[#141415] text-xs hover:bg-white transition-colors"
              >
                <span>Launch scanner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#18181b] border border-white/10 text-[#ededed]">
                    AUDIT // {scanData.scan_id}
                  </span>
                  <span className="text-xs text-[#71717a] font-mono">
                    {scanData.timestamp}
                  </span>
                </div>
                <h2 className="text-xl font-normal text-[#ededed] tracking-tight">
                  Privacy risk and sensitivity audit
                </h2>
                <p className="text-xs text-[#71717a] font-mono">
                  Source: {scanData.input_type}
                  {scanData.document_name && <span> ({scanData.document_name})</span>} • Processing latency: {scanData.processing_time_ms} ms
                </p>
              </div>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Score */}
                {(() => {
                  const risk = scanData.risk_assessment;
                  const isHigh = risk.category === 'HIGH';
                  const isMed = risk.category === 'MEDIUM';
                  const riskColor = isHigh ? 'text-rose-400' : (isMed ? 'text-amber-400' : 'text-emerald-400');
                  const riskBadge = isHigh
                    ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                    : isMed
                    ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                    : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

                  return (
                    <div className="surface-card p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-[#71717a]">
                        <span>Risk score</span>
                        {isHigh ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <ShieldCheck className={`w-4 h-4 ${riskColor}`} />}
                      </div>
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className={`text-3xl font-mono ${riskColor}`}>{risk.score}</span>
                        <span className="text-xs text-[#71717a] font-mono">/ 100</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block w-fit ${riskBadge}`}>
                        {risk.category} RISK TIER
                      </span>
                    </div>
                  );
                })()}

                <div className="surface-card p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#71717a]">
                    <span>Total entities</span>
                    <Layers className="w-4 h-4 text-[#a1a1a6]" />
                  </div>
                  <div className="my-2 text-3xl font-mono text-[#ededed]">
                    {scanData.total_entities_detected}
                  </div>
                  <span className="text-[11px] text-[#71717a] font-mono">
                    {scanData.character_count.toLocaleString()} characters parsed
                  </span>
                </div>

                <div className="surface-card p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-rose-400">
                    <span>High sensitivity</span>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="my-2 text-3xl font-mono text-rose-400">
                    {scanData.high_sensitivity_count}
                  </div>
                  <span className="text-[11px] text-[#71717a]">
                    Aadhaar, PAN, Cards, Accounts
                  </span>
                </div>

                <div className="surface-card p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-[#71717a]">
                    <span>Medium & Low</span>
                    <Activity className="w-4 h-4 text-[#a1a1a6]" />
                  </div>
                  <div className="my-2 flex items-baseline gap-2 text-[#ededed] font-mono">
                    <span className="text-2xl text-amber-400">{scanData.medium_sensitivity_count}</span>
                    <span className="text-xs text-[#71717a]">med</span>
                    <span className="text-2xl text-emerald-400 ml-1.5">{scanData.low_sensitivity_count}</span>
                    <span className="text-xs text-[#71717a]">low</span>
                  </div>
                  <span className="text-[11px] text-[#71717a]">
                    Contact details & names
                  </span>
                </div>
              </div>

              {/* Assessment Rationale */}
              <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#18181b] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#a1a1a6] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-medium text-[#ededed]">Audit summary</span>
                  <p className="text-[#a1a1a6] leading-relaxed">
                    {scanData.risk_assessment.summary}
                  </p>
                </div>
              </div>

              {/* Inspection & Masking Panel */}
              <div className="surface-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-sm font-medium text-[#ededed] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#a1a1a6] stroke-[1.5]" />
                      <span>Data masking and redaction</span>
                    </h3>
                    <p className="text-xs text-[#71717a]">
                      Inspect raw tagged spans or toggle to the sanitized representation.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex p-0.5 bg-[#141415] border border-white/10 rounded-md text-xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('highlighted')}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          viewMode === 'highlighted'
                            ? 'bg-[#222225] text-[#ededed]'
                            : 'text-[#71717a] hover:text-[#ededed]'
                        }`}
                      >
                        Highlighted
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('masked')}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          viewMode === 'masked'
                            ? 'bg-[#222225] text-[#ededed]'
                            : 'text-[#71717a] hover:text-[#ededed]'
                        }`}
                      >
                        Masked
                      </button>
                    </div>

                    <button
                      onClick={handleCopyMasked}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222225] hover:bg-[#2a2a2e] text-xs text-[#ededed] border border-white/10 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#71717a]" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleDownloadMasked}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222225] hover:bg-[#2a2a2e] text-xs text-[#ededed] border border-white/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#71717a]" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#141415] rounded-lg border border-white/10 max-h-80 overflow-y-auto">
                  {viewMode === 'highlighted' ? (
                    renderHighlightedText()
                  ) : (
                    <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[#ededed]">
                      {scanData.masked_text}
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Entities Table */}
              <div className="surface-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="text-sm font-medium text-[#ededed] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#a1a1a6] stroke-[1.5]" />
                    <span>Identified entities ({scanData.detected_entities.length})</span>
                  </h3>
                </div>

                {scanData.detected_entities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[#71717a] bg-[#141415]">
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Sensitivity</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Validation check</th>
                          <th className="py-2.5 px-3">Masked format</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {scanData.detected_entities.map((ent, idx) => {
                          const sensBadge = ent.sensitivity_level === 'HIGH'
                            ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                            : ent.sensitivity_level === 'MEDIUM'
                            ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                            : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
                          return (
                            <tr key={idx} className="hover:bg-[#222225]/40 transition-colors">
                              <td className="py-2 px-3 text-[#ededed]">{ent.entity_type}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded border text-[10px] ${sensBadge}`}>
                                  {ent.sensitivity_level}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#a1a1a6]">
                                {Math.round(ent.confidence_score * 100)}%
                              </td>
                              <td className="py-2 px-3 text-[#71717a]">
                                {ent.is_validated ? (
                                  <span className="text-emerald-400">
                                    ✓ {ent.validation_details || 'Verified'}
                                  </span>
                                ) : (
                                  <span>{ent.validation_details || 'Format Match'}</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[#ededed] font-mono">{ent.masked_text}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#71717a]">No entities detected in this record.</p>
                )}
              </div>

              {/* Explainable Scoring Breakdown */}
              <div className="surface-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="text-sm font-medium text-[#ededed] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#a1a1a6] stroke-[1.5]" />
                    <span>Risk model calculation breakdown</span>
                  </h3>
                </div>

                {scanData.risk_assessment.breakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[#71717a] bg-[#141415]">
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Count</th>
                          <th className="py-2 px-3">Base weight</th>
                          <th className="py-2 px-3">Assigned points</th>
                          <th className="py-2 px-3">Mathematical explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {scanData.risk_assessment.breakdown.map((b, idx) => (
                          <tr key={idx} className="hover:bg-[#222225]/40 transition-colors">
                            <td className="py-2 px-3 text-[#ededed]">{b.entity_type}</td>
                            <td className="py-2 px-3 text-[#a1a1a6]">{b.count}</td>
                            <td className="py-2 px-3 text-[#71717a]">{b.weight_per_item} pts</td>
                            <td className="py-2 px-3 text-[#ededed]">+{b.total_points}</td>
                            <td className="py-2 px-3 text-[#a1a1a6] font-sans text-xs">{b.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#71717a]">Zero risk points (Clean input).</p>
                )}
              </div>

              {/* Actionable Directives */}
              <div className="surface-card p-6 space-y-4">
                <div className="border-b border-white/[0.08] pb-3">
                  <h3 className="text-sm font-medium text-[#ededed] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#a1a1a6] stroke-[1.5]" />
                    <span>Statutory remediation directives</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {scanData.recommendations.map((rec) => {
                    const isCrit = rec.severity === 'CRITICAL';
                    const isWarn = rec.severity === 'WARNING';
                    const badgeColor = isCrit
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : isWarn
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-zinc-800 text-[#ededed] border-white/10';

                    return (
                      <div
                        key={rec.id}
                        className="p-4 rounded-lg bg-[#141415] border border-white/[0.08] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[#ededed]">{rec.title}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor}`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#a1a1a6] leading-relaxed">
                          {rec.description}
                        </p>
                        <ul className="list-disc list-inside text-xs text-[#71717a] space-y-1 pt-1">
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
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-normal text-[#ededed] tracking-tight">
              Enterprise privacy posture
            </h2>
            <p className="text-xs text-[#71717a]">
              Aggregated telemetry calculated across all historical document scans.
            </p>
          </div>

          {!systemSummary || systemSummary.total_scans === 0 ? (
            <div className="surface-card py-16 px-4 text-center space-y-3 max-w-md mx-auto">
              <Activity className="w-8 h-8 mx-auto text-[#71717a]" />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-[#ededed]">No historical records yet</h3>
                <p className="text-xs text-[#71717a]">
                  Execute privacy scans to compile aggregated telemetry.
                </p>
              </div>
              <Link
                to="/scanner"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium bg-[#ededed] text-[#141415] text-xs hover:bg-white transition-colors"
              >
                <span>Execute first scan</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Macro Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="surface-card p-5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#71717a]">
                    <span>Total scans</span>
                    <BarChart3 className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="text-3xl font-mono text-[#ededed]">{systemSummary.total_scans}</div>
                  <span className="text-[11px] text-[#71717a] font-mono">Recorded audits</span>
                </div>

                <div className="surface-card p-5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#71717a]">
                    <span>Avg risk score</span>
                    <Activity className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="text-3xl font-mono text-amber-400">{systemSummary.average_risk_score}</div>
                  <span className="text-[11px] text-[#71717a] font-mono">Out of 100 max</span>
                </div>

                <div className="surface-card p-5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#71717a]">
                    <span>PII entities</span>
                    <Layers className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="text-3xl font-mono text-[#ededed]">{systemSummary.total_pii_detected}</div>
                  <span className="text-[11px] text-[#71717a] font-mono">Across all files</span>
                </div>

                <div className="surface-card p-5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-rose-400">
                    <span>High risk ratio</span>
                    <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="text-3xl font-mono text-rose-400">{systemSummary.high_risk_scans}</div>
                  <span className="text-[11px] text-[#71717a] font-mono">
                    {Math.round((systemSummary.high_risk_scans / systemSummary.total_scans) * 100)}% of audits
                  </span>
                </div>
              </div>

              {/* Macro Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Aggregate Sensitivity Pie */}
                <div className="surface-card p-6 space-y-3">
                  <h3 className="text-xs font-mono text-[#71717a]">
                    SENSITIVITY DISTRIBUTION
                  </h3>
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High', value: systemSummary.sensitivity_distribution.HIGH, color: '#f87171' },
                            { name: 'Medium', value: systemSummary.sensitivity_distribution.MEDIUM, color: '#fbbf24' },
                            { name: 'Low', value: systemSummary.sensitivity_distribution.LOW, color: '#34d399' }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="#f87171" />
                          <Cell fill="#fbbf24" />
                          <Cell fill="#34d399" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', color: '#ededed' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-xs font-mono text-[#a1a1a6]">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> High: {systemSummary.sensitivity_distribution.HIGH}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Med: {systemSummary.sensitivity_distribution.MEDIUM}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Low: {systemSummary.sensitivity_distribution.LOW}</span>
                  </div>
                </div>

                {/* Aggregate Entity Frequencies Bar Chart */}
                <div className="surface-card p-6 space-y-3">
                  <h3 className="text-xs font-mono text-[#71717a]">
                    TOP DISCOVERED CATEGORIES
                  </h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(systemSummary.entity_distribution).map(([entity, count]) => ({
                          entity: entity.replace('IN_', ''),
                          count
                        }))}
                        margin={{ top: 10, right: 10, left: -25, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="entity" stroke="#71717a" fontSize={10} angle={-25} textAnchor="end" />
                        <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', color: '#ededed' }} />
                        <Bar dataKey="count" fill="#ededed" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Audits Table */}
              <div className="surface-card p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="text-xs font-mono text-[#71717a]">
                    RECENT AUDIT LOGS
                  </h3>
                  <Link to="/history" className="text-xs text-[#a1a1a6] hover:text-[#ededed] font-mono">
                    View all logs →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#71717a] bg-[#141415]">
                        <th className="py-2.5 px-3">Audit ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Risk Level</th>
                        <th className="py-2.5 px-3">Score</th>
                        <th className="py-2.5 px-3">Entities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {systemSummary.recent_scans.slice(0, 5).map((r) => {
                        const isH = r.risk_category === 'HIGH';
                        const isM = r.risk_category === 'MEDIUM';
                        const badgeColor = isH
                          ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                          : isM
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                          : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

                        return (
                          <tr key={r.scan_id} className="hover:bg-[#222225]/40 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-[#ededed]">
                              <button
                                onClick={async () => {
                                  const full = await api.getScanDetails(r.scan_id);
                                  setScanData(full);
                                  sessionStorage.setItem('current_scan_result', JSON.stringify(full));
                                  setActiveTab('current');
                                }}
                                className="text-left text-[#ededed] hover:underline"
                              >
                                {r.scan_id}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-[#71717a]">{r.timestamp}</td>
                            <td className="py-2.5 px-3 uppercase text-[#a1a1a6]">{r.input_type}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded border text-[10px] ${badgeColor}`}>
                                {r.risk_category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#ededed]">{r.risk_score} / 100</td>
                            <td className="py-2.5 px-3 text-[#a1a1a6]">{r.total_entities}</td>
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
