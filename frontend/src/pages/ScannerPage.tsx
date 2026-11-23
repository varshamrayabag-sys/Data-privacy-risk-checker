import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Scan, 
  Trash2, 
  AlertCircle, 
  FileUp, 
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

  // Preset sample records for instant verification
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
      const savedWeights = localStorage.getItem('privacy_custom_weights');
      const customWeights = savedWeights ? JSON.parse(savedWeights) : undefined;

      const result: ScanResponse = await api.scanText(rawText, customWeights);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-mono text-[#71717a]">[INPUT // DATA INGESTION]</span>
        <h1 className="text-2xl font-normal text-[#ededed] tracking-tight">
          Privacy risk scanner
        </h1>
        <p className="text-xs text-[#a1a1a6]">
          Ingest raw text or documents (.pdf, .docx, .txt) for deterministic PII classification and risk quantification.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="inline-flex items-center p-0.5 bg-[#18181b] border border-white/[0.08] rounded-lg">
        <button
          onClick={() => { setActiveTab('text'); setErrorMessage(null); }}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'text'
              ? 'bg-[#222225] text-[#ededed] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
              : 'text-[#a1a1a6] hover:text-[#ededed]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Manual text entry</span>
        </button>
        <button
          onClick={() => { setActiveTab('document'); setErrorMessage(null); }}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'document'
              ? 'bg-[#222225] text-[#ededed] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
              : 'text-[#a1a1a6] hover:text-[#ededed]'
          }`}
        >
          <Upload className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Upload document</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB A: TEXT SCANNER */}
      {activeTab === 'text' && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#71717a] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setRawText(sampleData.employee)}
                className="px-2 py-1 text-xs rounded bg-[#222225] hover:bg-[#2a2a2e] text-[#ededed] border border-white/10 transition-colors"
              >
                KYC Dossier
              </button>
              <button
                type="button"
                onClick={() => setRawText(sampleData.financial)}
                className="px-2 py-1 text-xs rounded bg-[#222225] hover:bg-[#2a2a2e] text-[#ededed] border border-white/10 transition-colors"
              >
                Wire Transfer
              </button>
              <button
                type="button"
                onClick={() => setRawText(sampleData.safe)}
                className="px-2 py-1 text-xs rounded bg-[#222225] hover:bg-[#2a2a2e] text-[#ededed] border border-white/10 transition-colors"
              >
                Safe Document
              </button>
            </div>

            {rawText && (
              <button
                type="button"
                onClick={() => setRawText('')}
                className="text-xs flex items-center gap-1 text-[#71717a] hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={11}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste text, contracts, customer records, or correspondence containing potential PII..."
              className="w-full bg-[#141415] border border-white/10 rounded-lg p-4 text-xs sm:text-sm text-[#ededed] placeholder-[#71717a] focus:outline-none focus:border-white/30 font-mono leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 text-xs text-[#71717a] font-mono">
              <span>Chars: <b className="text-[#ededed] font-normal">{rawText.length.toLocaleString()}</b></span>
              <span>Words: <b className="text-[#ededed] font-normal">{rawText.trim() ? rawText.trim().split(/\s+/).length : 0}</b></span>
            </div>

            <button
              type="button"
              disabled={isLoading || !rawText.trim()}
              onClick={handleScanText}
              className="w-full sm:w-auto h-10 px-5 rounded-lg font-medium text-xs text-[#141415] bg-[#ededed] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#141415]" />
                  <span>Analyzing privacy vectors...</span>
                </>
              ) : (
                <>
                  <Scan className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Execute privacy scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB B: DOCUMENT SCANNER */}
      {activeTab === 'document' && (
        <div className="surface-card p-6 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-white/40 bg-[#222225]'
                : 'border-white/10 hover:border-white/20 bg-[#141415]'
            }`}
          >
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-10 h-10 mx-auto rounded-lg bg-[#18181b] border border-white/10 flex items-center justify-center text-[#ededed]">
                <FileUp className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#ededed]">
                  Drop document to inspect
                </p>
                <p className="text-xs text-[#71717a]">
                  Supported: PDF (.pdf), Word (.docx), Text (.txt) up to 10 MB
                </p>
              </div>

              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#222225] hover:bg-[#2a2a2e] border border-white/10 text-xs font-medium text-[#ededed] cursor-pointer transition-colors">
                  <span>Choose local file</span>
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
            <div className="p-3.5 rounded-lg bg-[#141415] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#222225] border border-white/10 flex items-center justify-center text-[#ededed] font-mono text-xs uppercase">
                  {selectedFile.name.split('.').pop()}
                </div>
                <div>
                  <div className="text-xs font-medium text-[#ededed]">{selectedFile.name}</div>
                  <div className="text-[11px] text-[#71717a] font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-[#71717a] hover:text-rose-400 p-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isLoading || !selectedFile}
              onClick={handleScanDocument}
              className="w-full sm:w-auto h-10 px-5 rounded-lg font-medium text-xs text-[#141415] bg-[#ededed] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#141415]" />
                  <span>Extracting & auditing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Audit document</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Security Guarantee */}
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#18181b] border border-white/[0.06] text-xs text-[#71717a]">
        <Info className="w-4 h-4 text-[#a1a1a6] shrink-0" />
        <span>
          Volatile memory processing guarantee: Document payloads are analyzed in temporary RAM and never stored to permanent storage.
        </span>
      </div>
    </div>
  );
};
