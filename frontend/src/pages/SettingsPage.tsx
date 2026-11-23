import React, { useState, useEffect } from 'react';
import { 
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
    const saved = localStorage.getItem('privacy_custom_weights');
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-white/[0.08] pb-4">
        <span className="text-xs font-mono text-[#71717a]">[CALIBRATION // RISK MODEL WEIGHTS]</span>
        <h1 className="text-2xl font-normal text-[#ededed] tracking-tight">
          Risk weights & system calibration
        </h1>
        <p className="text-xs text-[#a1a1a6]">
          Adjust mathematical risk contribution points for each PII category and inspect active engine subsystems.
        </p>
      </div>

      {/* System Diagnostics Card */}
      <div className="surface-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-[#ededed] flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Server className="w-4 h-4 text-[#a1a1a6] stroke-[1.5]" />
          <span>Active engine environment</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1">
            <span className="text-[#71717a] text-[10px]">DETECTION ENGINE</span>
            <div className="text-[#ededed] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Presidio + spaCy NLP</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1">
            <span className="text-[#71717a] text-[10px]">PERSISTENCE ENGINE</span>
            <div className="text-[#ededed] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{healthData?.database?.engine || 'Local File Store'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#141415] border border-white/[0.06] space-y-1">
            <span className="text-[#71717a] text-[10px]">SYSTEM STATUS</span>
            <div className="text-[#ededed] font-medium flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${healthData?.status === 'healthy' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className="capitalize">{healthData?.status || 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Weight Sliders */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-sm font-medium text-[#ededed]">Sensitivity weight matrix</h3>
            <p className="text-xs text-[#71717a]">
              Points assigned to the first instance of each identified entity category (5 to 50 pts).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#141415] hover:bg-[#222225] border border-white/10 text-[#ededed] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#71717a]" />
              <span>Reset defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-[#ededed] hover:bg-white text-[#141415] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved' : 'Save weights'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(weights).map(([key, value]) => {
            const isHigh = value >= 25;
            const isMed = value >= 15 && value < 25;
            const badgeColor = isHigh
              ? 'text-rose-300 bg-rose-500/10 border-rose-500/20'
              : isMed
              ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
              : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';

            return (
              <div key={key} className="p-4 rounded-lg bg-[#141415] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-[#ededed]">{key}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor}`}>
                      {value} PTS
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={value}
                    onChange={(e) => handleWeightChange(key, parseInt(e.target.value))}
                    className="w-full h-1 bg-[#222225] rounded-lg appearance-none cursor-pointer accent-[#ededed]"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#141415] border border-white/[0.06] text-xs text-[#71717a]">
          <Info className="w-4 h-4 text-[#a1a1a6] shrink-0" />
          <span>
            Changes are saved to browser local storage and dispatched directly to the backend scoring pipeline on subsequent scans.
          </span>
        </div>
      </div>
    </div>
  );
};
