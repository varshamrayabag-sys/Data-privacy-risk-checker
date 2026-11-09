import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  RotateCcw, 
  Save, 
  Check, 
  Server, 
  Info
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_WEIGHTS: Record<string, number> = {
  IN_AADHAAR: 30,
  IN_PAN: 25,
  IN_BANK_ACCOUNT: 30,
  CREDIT_CARD: 30,
  IN_PASSPORT: 25,
  PHONE_NUMBER: 15,
  EMAIL_ADDRESS: 10,
  LOCATION: 20,
  PERSON: 5,
  DATE_OF_BIRTH: 15,
  IN_IFSC: 15,
  MEDICAL_LICENSE: 20
};

export const SettingsPage: React.FC = () => {
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [isSaved, setIsSaved] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    // Load custom weights from localStorage if saved
    const saved = localStorage.getItem('privacy_custom_weights');
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Check system health
    api.checkHealth().then(data => setHealthData(data)).catch(() => setHealthData({ status: 'offline' }));
  }, []);

  const handleWeightChange = (key: string, val: number) => {
    setWeights(prev => ({ ...prev, [key]: val }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('privacy_custom_weights', JSON.stringify(weights));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    localStorage.removeItem('privacy_custom_weights');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>Configuration & Calibration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Risk Weights & System Diagnostics
        </h1>
        <p className="text-sm text-slate-400">
          Fine-tune the mathematical weight contributions for sensitive PII categories and inspect active backend subsystems.
        </p>
      </div>

      {/* System Diagnostics Card */}
      <div className="cyber-card p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Active Backend Environment</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase">Detection Engine</span>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Presidio + spaCy NLP</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase">Database Engine</span>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{healthData?.database?.engine || 'Local Resilient Store'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase">Checksum Algorithms</span>
            <div className="text-white font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Verhoeff (Aadhaar) & Luhn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Weights Configuration */}
      <div className="cyber-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Calibrate Sensitivity Scoring Weights</span>
            </h3>
            <p className="text-xs text-slate-400">
              Assigned points contribute towards the overall 0–100 privacy risk score.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs transition-all shadow-sm"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Save className="w-3.5 h-3.5 text-slate-950" />}
              <span>{isSaved ? 'Weights Saved' : 'Save Calibration'}</span>
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} className="space-y-2 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-mono">{key}</span>
                <span className="font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  {val} pts
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={val}
                onChange={(e) => handleWeightChange(key, parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 pts (Negligible)</span>
                <span>25 pts (Medium)</span>
                <span>50 pts (Critical)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <b>Explainable Scoring Formula:</b> Risk score = Min(100, Σ (Base Weight × Volume Scaling) + Multi-PII Correlation Bonus). Scores are strictly bounded between 0 (LOW) and 100 (HIGH).
          </span>
        </div>
      </div>
    </div>
  );
};
