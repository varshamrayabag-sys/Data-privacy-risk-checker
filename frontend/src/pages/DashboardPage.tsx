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
  Info
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
import type { ScanResponse } from '../types';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const location = useLocation();
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [viewMode, setViewMode] = useState<'highlighted' | 'masked'>('highlighted');
  const [copied, setCopied] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  useEffect(() => {
    // 1. Check router state
    if (location.state && (location.state as any).scanResult) {
      const res = (location.state as any).scanResult;
      setScanData(res);
      sessionStorage.setItem('current_scan_result', JSON.stringify(res));
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

  // Render Empty State if no scan exists
  if (!scanData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <Activity className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No Scan Results Available</h2>
          <p className="text-sm text-slate-400">
            You have not run a privacy scan in this session yet, or no past audit records exist.
          </p>
        </div>
        <div>
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-sm shadow-lg shadow-cyan-500/20"
          >
            <span>Run Your First Privacy Check</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Visual Risk Attributes
  const risk = scanData.risk_assessment;
  const isHigh = risk.category === 'HIGH';
  const isMed = risk.category === 'MEDIUM';
  const riskColor = isHigh ? 'text-rose-400' : (isMed ? 'text-amber-400' : 'text-emerald-400');
  const riskBg = isHigh ? 'bg-rose-500/10 border-rose-500/30' : (isMed ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30');

  // Chart Data Preparation
  const pieData = [
    { name: 'High Sensitivity', value: scanData.high_sensitivity_count, color: '#ef4444' },
    { name: 'Medium Sensitivity', value: scanData.medium_sensitivity_count, color: '#f59e0b' },
    { name: 'Low Sensitivity', value: scanData.low_sensitivity_count, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Group entities for bar chart
  const entityCounts: Record<string, number> = {};
  scanData.detected_entities.forEach(e => {
    entityCounts[e.entity_type] = (entityCounts[e.entity_type] || 0) + 1;
  });
  const barData = Object.entries(entityCounts).map(([entity, count]) => ({
    entity: entity.replace('IN_', ''),
    count
  }));

  // Build Highlighted Text with Colored Entity Chips
  const renderHighlightedText = () => {
    const text = scanData.original_text || scanData.masked_text;
    if (!text || scanData.detected_entities.length === 0) {
      return <div className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{text}</div>;
    }

    // Sort entities ascending by start
    const sorted = [...scanData.detected_entities].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((ent, i) => {
      // Append preceding unhighlighted text
      if (ent.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{text.slice(lastIndex, ent.start)}</span>
        );
      }

      // Determine entity pill style
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

    // Append trailing text
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
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-cyan-400">
              AUDIT ID: {scanData.scan_id}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {scanData.timestamp}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Privacy Risk & Sensitive PII Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Source: <b className="text-slate-300 uppercase">{scanData.input_type}</b>
            {scanData.document_name && <span> ({scanData.document_name})</span>} • Processed in <b className="text-cyan-400">{scanData.processing_time_ms} ms</b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-sm shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{isDownloadingReport ? 'Generating Report...' : 'Download PDF Audit'}</span>
          </button>
          <Link
            to="/scanner"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-sm shadow-md shadow-cyan-500/20 transition-all"
          >
            <span>Scan Another</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Score Card */}
        <div className={`cyber-card p-6 flex flex-col justify-between ${riskBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Privacy Risk Score</span>
            {isHigh ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <ShieldCheck className={`w-5 h-5 ${riskColor}`} />}
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-5xl font-black ${riskColor}`}>{risk.score}</span>
            <span className="text-sm text-slate-500 font-mono">/ 100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${riskBg} ${riskColor}`}>
              {risk.category} RISK
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Normalized</span>
          </div>
        </div>

        {/* Total Detected Card */}
        <div className="cyber-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Total PII Detected</span>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="my-3 text-5xl font-black text-white">
            {scanData.total_entities_detected}
          </div>
          <span className="text-xs text-slate-400">
            From {scanData.character_count.toLocaleString()} raw characters
          </span>
        </div>

        {/* High Severity Card */}
        <div className="cyber-card p-6 flex flex-col justify-between border-rose-950/60 bg-[#0e121e]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono tracking-wider text-rose-400 uppercase">High Sensitivity</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="my-3 text-5xl font-black text-rose-400">
            {scanData.high_sensitivity_count}
          </div>
          <span className="text-xs text-slate-400">
            Govt IDs, Banking, Cards
          </span>
        </div>

        {/* Medium/Low Severity Card */}
        <div className="cyber-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Medium & Low</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="my-3 flex items-baseline gap-3 text-white">
            <span className="text-4xl font-extrabold text-amber-400">{scanData.medium_sensitivity_count}</span>
            <span className="text-sm text-slate-500">Med</span>
            <span className="text-4xl font-extrabold text-emerald-400 ml-2">{scanData.low_sensitivity_count}</span>
            <span className="text-sm text-slate-500">Low</span>
          </div>
          <span className="text-xs text-slate-400">
            Phone, Email, Addresses, Names
          </span>
        </div>
      </div>

      {/* Summary Box */}
      <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${riskBg}`}>
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${riskColor}`} />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Executive Assessment Rationale</h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {risk.summary}
          </p>
        </div>
      </div>

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensitivity Distribution Chart */}
        <div className="cyber-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Sensitivity Distribution</h3>
            <span className="text-xs text-slate-400 font-mono">Classification Tiers</span>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500">No PII categories detected</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High: {scanData.high_sensitivity_count}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium: {scanData.medium_sensitivity_count}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low: {scanData.low_sensitivity_count}</span>
          </div>
        </div>

        {/* Entity Occurrence Bar Chart */}
        <div className="cyber-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Entity-Wise Breakdown</h3>
            <span className="text-xs text-slate-400 font-mono">Frequencies</span>
          </div>
          <div className="h-60 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="entity" 
                    stroke="#64748b" 
                    fontSize={10} 
                    angle={-25} 
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090e1a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No entities detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Text Inspection & Masking Panel */}
      <div className="cyber-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Inspection & Data Masking Engine</span>
            </h3>
            <p className="text-xs text-slate-400">
              Review flagged spans in the original session text or inspect the redacted masked output.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setViewMode('highlighted')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'highlighted'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Highlighted (Session)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('masked')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'masked'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masked (Redacted)
              </button>
            </div>

            <button
              onClick={handleCopyMasked}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium transition-all"
              title="Copy masked version to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadMasked}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-medium transition-all"
              title="Download masked text as .txt"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Content View Container */}
        <div className="p-5 bg-[#080d19] rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
          {viewMode === 'highlighted' ? (
            renderHighlightedText()
          ) : (
            <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-cyan-200">
              {scanData.masked_text}
            </div>
          )}
        </div>
      </div>

      {/* Detected Entities Detail Table */}
      <div className="cyber-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Detected Sensitive Elements Details</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {scanData.detected_entities.length} items
          </span>
        </div>

        {scanData.detected_entities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase bg-slate-900/60">
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Sensitivity</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                  <th className="py-2.5 px-3">Masked Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {scanData.detected_entities.map((ent, idx) => {
                  const sensBadge = ent.sensitivity_level === 'HIGH'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : ent.sensitivity_level === 'MEDIUM'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{ent.entity_type}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${sensBadge}`}>
                          {ent.sensitivity_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {Math.round(ent.confidence_score * 100)}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {ent.is_validated ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
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
          <p className="text-xs text-slate-400">No sensitive entities discovered in this text.</p>
        )}
      </div>

      {/* Explainable Risk Scoring Matrix */}
      <div className="cyber-card p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Explainable Risk Scoring Formula & Breakdown</span>
          </h3>
          <p className="text-xs text-slate-400">
            Raw points: <b className="text-white font-mono">{risk.raw_points} pts</b> • Final score capped at <b className="text-cyan-400 font-mono">{risk.score}/100</b>.
          </p>
        </div>

        {risk.breakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase bg-slate-900/60">
                  <th className="py-2 px-3">Factor / Category</th>
                  <th className="py-2 px-3">Count</th>
                  <th className="py-2 px-3">Unit Weight</th>
                  <th className="py-2 px-3">Contribution</th>
                  <th className="py-2 px-3">Risk Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {risk.breakdown.map((b, idx) => (
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
          <p className="text-xs text-slate-400">No risk points assigned (Zero PII detected).</p>
        )}
      </div>

      {/* Actionable Recommendations */}
      <div className="cyber-card p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Actionable Privacy Remediation Guidelines</span>
          </h3>
          <p className="text-xs text-slate-400">
            Dynamic security actions generated specifically for the detected privacy vectors in this document.
          </p>
        </div>

        <div className="space-y-4">
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
                  <span className="font-bold text-sm text-white">{rec.title}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border font-mono ${badgeColor}`}>
                    {rec.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rec.description}
                </p>
                <div className="pt-1 space-y-1">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
                    Remediation Steps:
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    {rec.action_steps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
