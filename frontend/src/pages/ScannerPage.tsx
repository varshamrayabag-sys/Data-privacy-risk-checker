import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Scan, 
  Trash2, 
  AlertCircle, 
  FileUp, 
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import type { ScanResponse } from '../types';

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'text' | 'document'>('text');
  
  // Text Input State
  const [rawText, setRawText] = useState('');
  
  // Document Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sample data presets for instant demonstration & testing
  const sampleData = {
    employee: `EMPLOYEE ONBOARDING VERIFICATION DOSSIER
Full Legal Name: Rajesh V. Sharma
Contact Email: rajesh.sharma@enterprise-cloud.in
Primary Mobile: +91 9876512345
Residential Address: Flat 402, Green Valley Apartments, Indiranagar, Bengaluru 560038
Date of Birth: 15/08/1990
National Identity (Aadhaar): 9999 4105 1543
Permanent Account Number (PAN): ABCPE1234F
Salary Disbursement Bank A/C: 1029384756123
Bank Branch IFSC: SBIN0001234
Emergency Contact: Sunita Sharma (+91 9812345678)`,

    financial: `CUSTOMER WIRE TRANSFER INSTRUCTION SLIP
Account Holder: Priya Deshmukh
Email: priya.d@globalpay.com
Debit Card Number: 4532 0150 0000 0007
Beneficiary Bank Account: 98765432109876
Beneficiary IFSC: HDFC0000123
Tax ID (PAN): AAACP5678K
Passport Number: A1234567
Client IP Address: 192.168.1.105`,

    safe: `SYSTEM ARCHITECTURE AND SERVICE METRICS
The microservice cluster handles 50,000 requests per minute with an average latency of 45ms.
All inter-service traffic is routed over mTLS using internal service meshes.
Database read replicas are distributed across the primary and secondary regions.
Weekly maintenance windows are scheduled every Sunday between 02:00 and 04:00 UTC.`
  };

  const handleScanText = async () => {
    if (!rawText.trim()) {
      setErrorMessage("Please enter or paste text to perform a privacy risk scan.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Check if custom weights exist in localStorage from Settings
      const savedWeights = localStorage.getItem('privacy_custom_weights');
      const customWeights = savedWeights ? JSON.parse(savedWeights) : undefined;

      const result: ScanResponse = await api.scanText(rawText, customWeights);
      
      // Store current scan in sessionStorage for persistent dashboard inspection
      sessionStorage.setItem('current_scan_result', JSON.stringify(result));
      navigate('/dashboard', { state: { scanResult: result } });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to scan text. Verify server connectivity.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.txt', '.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Invalid file format '${ext}'. Supported extensions: PDF, DOCX, TXT.`);
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds the 10 MB maximum upload limit.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleScanDocument = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a document (.pdf, .docx, or .txt) to scan.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result: ScanResponse = await api.scanDocument(selectedFile);
      sessionStorage.setItem('current_scan_result', JSON.stringify(result));
      navigate('/dashboard', { state: { scanResult: result } });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Document extraction failed.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Scan className="w-4 h-4" />
          <span>Privacy Risk Scanner</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Ingest & Inspect Sensitive Data
        </h1>
        <p className="text-sm text-slate-400">
          Paste plain text or upload real documents (.PDF, .DOCX, .TXT) to execute comprehensive PII discovery and algorithmic privacy risk modeling.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md">
        <button
          onClick={() => { setActiveTab('text'); setErrorMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'text'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Manual Text Entry</span>
        </button>
        <button
          onClick={() => { setActiveTab('document'); setErrorMessage(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'document'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold">Scan Error: </span>{errorMessage}
          </div>
        </div>
      )}

      {/* TAB A: TEXT SCANNER */}
      {activeTab === 'text' && (
        <div className="cyber-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Preset Sample Data:</span>
              <button
                type="button"
                onClick={() => setRawText(sampleData.employee)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium transition-all"
              >
                KYC Onboarding
              </button>
              <button
                type="button"
                onClick={() => setRawText(sampleData.financial)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 font-medium transition-all"
              >
                Financial Wire
              </button>
              <button
                type="button"
                onClick={() => setRawText(sampleData.safe)}
                className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium transition-all"
              >
                Safe Document (No PII)
              </button>
            </div>

            {rawText && (
              <button
                type="button"
                onClick={() => setRawText('')}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Text</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw text, contract terms, customer records, or correspondence containing potential PII..."
              className="w-full bg-[#080d19] border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span>Characters: <b className="text-slate-200">{rawText.length.toLocaleString()}</b></span>
              <span>Words: <b className="text-slate-200">{rawText.trim() ? rawText.trim().split(/\s+/).length : 0}</b></span>
            </div>

            <button
              type="button"
              disabled={isLoading || !rawText.trim()}
              onClick={handleScanText}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing Privacy Vectors...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Execute Privacy Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB B: DOCUMENT SCANNER */}
      {activeTab === 'document' && (
        <div className="cyber-card p-6 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-[#080d19]'
            }`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                <FileUp className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">
                  Drag and drop your document here
                </p>
                <p className="text-xs text-slate-400">
                  Supported formats: <b className="text-slate-300">PDF (.pdf)</b>, <b className="text-slate-300">Word (.docx)</b>, <b className="text-slate-300">Text (.txt)</b>
                </p>
                <p className="text-[11px] text-slate-500">
                  Maximum file size: 10 MB per file
                </p>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-400 cursor-pointer transition-all">
                  <span>Browse Local File</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase font-mono">
                  {selectedFile.name.split('.').pop()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{selectedFile.name}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-rose-400 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isLoading || !selectedFile}
              onClick={handleScanDocument}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Extracting & Auditing Document...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-slate-950" />
                  <span>Process & Audit Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <b>Zero Permanent Raw Storage Guarantee:</b> Document payloads and input text are processed strictly in-memory during detection. Only anonymized statistical metrics are saved.
        </span>
      </div>
    </div>
  );
};
