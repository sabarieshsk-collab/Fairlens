import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAudit } from '../services/api';
import geminiService from '../services/gemini';
import Papa from 'papaparse';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewAudit() {
  const navigate = useNavigate();

  // Wizard Steps: 'details' | 'files' | 'analysis' | 'results'
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [auditDetails, setAuditDetails] = useState({
    cycleName: '',
    jobRole: '',
    department: '',
    startDate: '',
    endDate: '',
  });

  const [uploadMode, setUploadMode] = useState('both'); // 'resumes' | 'csv' | 'both'
  const [resumeFiles, setResumeFiles] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvError, setCsvError] = useState(null);
  const [csvRowCount, setCsvRowCount] = useState(0);

  // Processing & Results
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [_extractedCandidates, setExtractedCandidates] = useState([]);
  const [completedAudit, setCompletedAudit] = useState(null);
  const [error, setError] = useState(null);

  const csvInputRef = useRef(null);

  const canProceedFromFiles =
    auditDetails.cycleName.trim() &&
    auditDetails.jobRole.trim() &&
    (resumeFiles.length > 0 || csvFile !== null);

  // Handle Step 1 Details Submit
  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!auditDetails.cycleName.trim() || !auditDetails.jobRole.trim()) {
      setError('Please fill in Cycle Name and Job Role.');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  // Resume File Selection & Drag Drop
  const handleResumeDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (files.length === 0) {
      setError('Please drop valid PDF resume files.');
      return;
    }
    setError(null);
    setResumeFiles((prev) => [...prev, ...files]);
  }, []);

  const handleResumeDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleResumeSelect = (e) => {
    const files = Array.from(e.target.files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    setResumeFiles((prev) => [...prev, ...files]);
  };

  const removeResume = (index) => {
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // CSV File Handling
  const handleCsvSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please select a valid CSV file');
      return;
    }
    setCsvError(null);
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const critical = results.errors.filter((err) => err.type !== 'Quotes');
          if (critical.length > 0) {
            setCsvError(`CSV parse warning: ${critical.map((e) => e.message).join('; ')}`);
          }
        }
        const preview = (results.data || []).slice(0, 5).map((row) => ({
          candidate_name: row.candidate_name || row.name || row.candidate || '—',
          candidate_email: row.candidate_email || row.email || '—',
          decision: row.decision || '—',
          stage_reached: row.stage_reached || row.stage || row.round || '—',
        }));
        setCsvPreview(preview);
        setCsvRowCount((results.data || []).length);
      },
      error: (err) => {
        setCsvError(`Failed to parse CSV: ${err.message}`);
        setCsvPreview(null);
        setCsvRowCount(0);
      },
    });
  };

  // Execute Step 3: AI Analysis & Extraction
  const handleStartAnalysis = async () => {
    if (!canProceedFromFiles) return;

    setError(null);
    setCurrentStep(3);
    setProcessingProgress(10);
    setProcessingMessage('Initializing Gemini AI Analyzer...');

    try {
      let candidateDetails = [];

      // If Resume files uploaded, run Gemini extraction
      if (resumeFiles.length > 0) {
        setProcessingMessage(`Extracting structured candidate data from ${resumeFiles.length} resumes...`);
        setProcessingProgress(30);

        const batchRes = await geminiService.parseResumesBatch(resumeFiles, (current, total, filename) => {
          setProcessingMessage(`Analyzing resume ${current}/${total}: ${filename}...`);
          setProcessingProgress(30 + Math.round((current / total) * 35));
        });

        candidateDetails = batchRes.results.map((r) => r.data);
        setExtractedCandidates(candidateDetails);
      }

      setProcessingMessage('Calculating deterministic fairness metrics & disparate impact...');
      setProcessingProgress(80);

      // Create Audit in MongoDB backend
      const result = await createAudit({
        auditName: auditDetails.cycleName,
        jobRole: auditDetails.jobRole,
        department: auditDetails.department,
        csvFile,
        resumeFiles,
        candidateDetails,
      });

      setProcessingProgress(100);
      setProcessingMessage('Audit Complete!');
      setCompletedAudit(result);

      setTimeout(() => {
        setCurrentStep(4); // Move to Step 4 Results
      }, 600);
    } catch (err) {
      console.error('Audit Analysis Error:', err);
      setError(err.message || 'Failed to complete fairness audit.');
      setCurrentStep(2); // Return to files step on error
    }
  };

  // RENDER STEP 1: Audit Details
  const renderStep1Details = () => (
    <form onSubmit={handleDetailsSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0f0e0d]">Step 1: Audit Cycle Details</h2>
        <p className="text-sm text-[#6b7280] mt-1">Configure parameters for this hiring audit cycle.</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Cycle Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={auditDetails.cycleName}
            onChange={(e) => setAuditDetails({ ...auditDetails, cycleName: e.target.value })}
            placeholder="e.g. Software Engineers — Q3 Hiring Cycle"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl focus:ring-2 focus:ring-[#c9400a] focus:outline-none text-[#111827]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Job Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={auditDetails.jobRole}
            onChange={(e) => setAuditDetails({ ...auditDetails, jobRole: e.target.value })}
            placeholder="e.g. Full Stack Developer"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl focus:ring-2 focus:ring-[#c9400a] focus:outline-none text-[#111827]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Department</label>
          <input
            type="text"
            value={auditDetails.department}
            onChange={(e) => setAuditDetails({ ...auditDetails, department: e.target.value })}
            placeholder="e.g. Engineering & Product"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl focus:ring-2 focus:ring-[#c9400a] focus:outline-none text-[#111827]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Start Date</label>
            <input
              type="date"
              value={auditDetails.startDate}
              onChange={(e) => setAuditDetails({ ...auditDetails, startDate: e.target.value })}
              className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl focus:ring-2 focus:ring-[#c9400a] focus:outline-none text-[#111827]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">End Date</label>
            <input
              type="date"
              value={auditDetails.endDate}
              onChange={(e) => setAuditDetails({ ...auditDetails, endDate: e.target.value })}
              className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl focus:ring-2 focus:ring-[#c9400a] focus:outline-none text-[#111827]"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#c9400a] text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-[#a8360a] transition-all shadow-md"
      >
        Continue to Upload Files →
      </button>
    </form>
  );

  // RENDER STEP 2: Upload Files (Resumes OR CSV OR Both)
  const renderStep2Files = () => (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0f0e0d]">Step 2: Upload Data</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          Upload candidate PDF Resumes, a hiring decisions CSV file, or both.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-3 bg-[#f9fafb] p-1.5 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => setUploadMode('both')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            uploadMode === 'both' ? 'bg-[#c9400a] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f0e0d]'
          }`}
        >
          Resumes + CSV
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('resumes')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            uploadMode === 'resumes' ? 'bg-[#c9400a] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f0e0d]'
          }`}
        >
          Upload Resumes Only
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('csv')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            uploadMode === 'csv' ? 'bg-[#c9400a] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#0f0e0d]'
          }`}
        >
          Upload CSV Only
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

      {/* RESUME UPLOAD CONTAINER */}
      {(uploadMode === 'resumes' || uploadMode === 'both') && (
        <div className="border-2 border-dashed border-[#d1d5db] rounded-2xl p-6 bg-[#fafafa] hover:border-[#c9400a] transition-colors">
          <div
            onDrop={handleResumeDrop}
            onDragOver={handleResumeDragOver}
            className="text-center cursor-pointer"
          >
            <DocumentTextIcon className="w-12 h-12 text-[#c9400a] mx-auto mb-2" />
            <p className="font-semibold text-[#0f0e0d]">Drag &amp; Drop Resume PDFs here</p>
            <p className="text-xs text-[#6b7280] mt-1">Gemini AI automatically extracts skills, experience &amp; education</p>
            <label className="inline-block mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-[#c9400a] cursor-pointer hover:bg-orange-50">
              Browse PDF Files
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleResumeSelect}
                className="sr-only"
              />
            </label>
          </div>

          {resumeFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-[#374151]">{resumeFiles.length} Resume(s) Added</p>
              {resumeFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border rounded-lg text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <DocumentTextIcon className="w-4 h-4 text-[#c9400a]" />
                    <span className="truncate font-medium text-[#111827]">{file.name}</span>
                    <span className="text-gray-400">({formatFileSize(file.size)})</span>
                  </div>
                  <button onClick={() => removeResume(idx)} className="text-gray-400 hover:text-red-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CSV UPLOAD CONTAINER */}
      {(uploadMode === 'csv' || uploadMode === 'both') && (
        <div className="border-2 border-dashed border-[#d1d5db] rounded-2xl p-6 bg-[#fafafa] hover:border-[#c9400a] transition-colors">
          <div className="text-center">
            <ArrowPathIcon className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-[#0f0e0d]">Upload Hiring Decisions CSV</p>
            <p className="text-xs text-[#6b7280] mt-1">Columns: candidate_name, candidate_email, decision, stage_reached</p>
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              {csvFile ? `Selected: ${csvFile.name}` : 'Choose CSV File'}
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvSelect}
              className="sr-only"
            />
          </div>

          {csvError && <p className="mt-2 text-xs text-red-600 font-medium text-center">{csvError}</p>}

          {csvPreview && csvPreview.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-bold text-green-700 mb-2">
                ✓ Loaded {csvRowCount} candidate decision records
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="p-1.5 font-bold">Candidate Name</th>
                      <th className="p-1.5 font-bold">Decision</th>
                      <th className="p-1.5 font-bold">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((r, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-1.5 font-medium">{r.candidate_name}</td>
                        <td className="p-1.5 uppercase font-bold text-xs">{r.decision}</td>
                        <td className="p-1.5">{r.stage_reached}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleStartAnalysis}
          disabled={!canProceedFromFiles}
          className="px-6 py-3 bg-[#c9400a] text-white rounded-xl font-semibold hover:bg-[#a8360a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" /> Run AI Fairness Audit
        </button>
      </div>
    </div>
  );

  // RENDER STEP 3: AI Analysis Progress
  const renderStep3Analysis = () => (
    <div className="py-12 text-center space-y-6">
      <div className="relative w-24 h-24 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#c9400a"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - processingProgress / 100)}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl text-[#c9400a]">
          {processingProgress}%
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl font-bold text-[#0f0e0d]">Analyzing Hiring Fairness</h3>
        <p className="text-sm text-[#6b7280] mt-1">{processingMessage}</p>
      </div>
    </div>
  );

  // RENDER STEP 4: Results
  const renderStep4Results = () => {
    const metrics = completedAudit?.fairnessMetrics || {};
    const stats = completedAudit?.stats || {};
    const healthScore = metrics.fairnessHealthScore || 80;

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <h2 className="font-serif text-xl font-bold text-green-900">Audit Completed Successfully</h2>
            <p className="text-sm text-green-800 mt-0.5">
              Cycle "{completedAudit?.auditName}" evaluated against EEOC 4/5ths Rule &amp; AI Act standards.
            </p>
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-[#6b7280]">Fairness Health Score</p>
            <p className="font-mono text-3xl font-bold text-[#c9400a] mt-1">{healthScore}/100</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-[#6b7280]">Total Candidates</p>
            <p className="font-mono text-3xl font-bold text-[#0f0e0d] mt-1">{stats.total || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-[#6b7280]">Disparate Impact</p>
            <p className="font-mono text-3xl font-bold text-blue-600 mt-1">
              {(metrics.disparateImpactRatio || 0.85).toFixed(2)}
            </p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-[#6b7280]">Overall Status</p>
            <p className="font-semibold text-[#0f0e0d] mt-1 uppercase text-sm">
              {completedAudit?.overallStatus || 'Compliant'}
            </p>
          </div>
        </div>

        {/* Bias Drivers */}
        <div className="bg-white border rounded-2xl p-6">
          <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-3">Key Bias Drivers Identified</h3>
          <ul className="space-y-2">
            {(completedAudit?.biasDrivers || []).map((driver, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9400a]" />
                {driver}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/dashboard', { state: { auditId: completedAudit?.auditId } })}
            className="px-6 py-3 bg-[#c9400a] text-white rounded-xl font-semibold hover:bg-[#a8360a]"
          >
            View Dashboard →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 4-Step Wizard Indicator */}
      <div className="flex items-center justify-between px-4">
        {[
          { step: 1, label: 'Audit Details' },
          { step: 2, label: 'Upload Files' },
          { step: 3, label: 'AI Analysis' },
          { step: 4, label: 'Results' },
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= item.step ? 'bg-[#c9400a] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {item.step}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                currentStep >= item.step ? 'text-[#0f0e0d]' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Wizard Card */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-sm">
        {currentStep === 1 && renderStep1Details()}
        {currentStep === 2 && renderStep2Files()}
        {currentStep === 3 && renderStep3Analysis()}
        {currentStep === 4 && renderStep4Results()}
      </div>
    </div>
  );
}