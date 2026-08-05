import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import { globalSearch } from '../../services/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ audits: [], reports: [], candidates: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ audits: [], reports: [], candidates: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(query);
        setResults(res || { audits: [], reports: [], candidates: [] });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectAudit = (auditId) => {
    onClose();
    navigate('/dashboard', { state: { auditId } });
  };

  const handleSelectReport = () => {
    onClose();
    navigate('/compliance-reports');
  };

  const hasResults =
    (results.audits && results.audits.length > 0) ||
    (results.reports && results.reports.length > 0) ||
    (results.candidates && results.candidates.length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#e5e7eb]">
        {/* Header Search Input */}
        <div className="p-4 border-b border-[#e5e7eb] flex items-center gap-3 bg-[#fafafa]">
          <MagnifyingGlassIcon className="w-6 h-6 text-[#9ca3af]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audits, reports, candidate names or emails..."
            className="flex-1 bg-transparent border-none text-base text-[#111827] focus:outline-none placeholder-[#9ca3af]"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#6b7280] hover:text-[#0f0e0d] px-2 py-1 border border-gray-300 rounded"
          >
            ESC
          </button>
        </div>

        {/* Search Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="text-center py-8 text-[#6b7280] flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-[#c9400a]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </div>
          )}

          {!loading && query.trim().length >= 2 && !hasResults && (
            <div className="text-center py-8 text-[#6b7280]">
              No audits, reports, or candidates found matching "<span className="font-semibold">{query}</span>"
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="text-center py-8 text-[#9ca3af] text-sm">
              Type at least 2 characters to search across all hiring audits and records.
            </div>
          )}

          {/* Audits Results */}
          {!loading && results.audits && results.audits.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-[#c9400a]" />
                Audits ({results.audits.length})
              </h4>
              <div className="space-y-1.5">
                {results.audits.map((a) => (
                  <div
                    key={a._id}
                    onClick={() => handleSelectAudit(a._id)}
                    className="p-3 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#0f0e0d]">{a.auditName}</p>
                      <p className="text-xs text-[#6b7280]">Role: {a.jobRole} {a.department ? `• ${a.department}` : ''}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-[#c9400a]15 text-[#c9400a]">
                      View Audit
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate Results */}
          {!loading && results.candidates && results.candidates.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-[#c9400a]" />
                Candidates ({results.candidates.length})
              </h4>
              <div className="space-y-1.5">
                {results.candidates.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#0f0e0d]">{c.name}</p>
                      <p className="text-xs text-[#6b7280]">{c.email || 'No email'} • Audit: {c.auditName}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      c.decision === 'hired' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {(c.decision || 'REJECTED').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Results */}
          {!loading && results.reports && results.reports.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DocumentTextIcon className="w-4 h-4 text-[#c9400a]" />
                Reports ({results.reports.length})
              </h4>
              <div className="space-y-1.5">
                {results.reports.map((r) => (
                  <div
                    key={r._id}
                    onClick={handleSelectReport}
                    className="p-3 rounded-lg hover:bg-gray-100 border border-gray-200 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#0f0e0d]">{r.title}</p>
                      <p className="text-xs text-[#6b7280]">Type: {r.type?.toUpperCase()}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">View Report</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
