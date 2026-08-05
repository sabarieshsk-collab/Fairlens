import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAudits, deleteAudit, deleteAllAudits, duplicateAudit } from '../services/api';
import { generateComplianceReport } from '../services/reportGenerator';

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditHistory() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals & Toast
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAudits = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getAudits();
      setAudits(records || []);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  // Filter & Sort Logic
  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      (audit.cycleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (audit.jobRole || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (audit.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || audit.jobRole === filterRole;
    const matchesStatus = filterStatus === 'all' || audit.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedAudits = [...filteredAudits].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.processedAt || b.createdAt) - new Date(a.processedAt || a.createdAt);
    if (sortBy === 'date_asc') return new Date(a.processedAt || a.createdAt) - new Date(b.processedAt || b.createdAt);
    if (sortBy === 'score_desc') return (b.fairnessMetrics?.fairnessHealthScore || 0) - (a.fairnessMetrics?.fairnessHealthScore || 0);
    if (sortBy === 'candidates_desc') return (b.stats?.total || 0) - (a.stats?.total || 0);
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedAudits.length / itemsPerPage) || 1;
  const paginatedAudits = sortedAudits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actions
  const handleViewResults = (audit) => {
    navigate('/dashboard', { state: { auditId: audit.auditId || audit._id } });
  };

  const handleDownloadPDF = (audit) => {
    try {
      const doc = generateComplianceReport(audit, audit.fairnessMetrics || {}, { name: audit.companyName || 'Company' });
      doc.save(`FairLens_Report_${(audit.cycleName || 'audit').replace(/\s+/g, '_')}.pdf`);
      showToast('PDF Compliance Report downloaded', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF report', 'error');
    }
  };

  const handleDownloadCSV = (audit) => {
    const candidates = audit.allCandidates || audit.stats?.hiredCandidates || [];
    if (candidates.length === 0) {
      showToast('No candidate data available to export', 'error');
      return;
    }

    const headers = ['Candidate Name', 'Email', 'Decision', 'Stage', 'Resume File'];
    const rows = candidates.map((c) => [
      c.name || '',
      c.email || '',
      (c.decision || 'REJECTED').toUpperCase(),
      c.stage || 'Screening',
      c.resumeFilename || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FairLens_${(audit.cycleName || 'audit').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV downloaded successfully', 'success');
  };

  const handleDuplicate = async (audit) => {
    try {
      const duplicated = await duplicateAudit(audit.auditId || audit._id);
      setAudits((prev) => [duplicated, ...prev]);
      showToast(`Audit duplicated as "${duplicated.cycleName}"`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to duplicate audit', 'error');
    }
  };

  const handleDeleteAudit = (audit) => {
    setAuditToDelete(audit);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAudit = async () => {
    if (!auditToDelete) return;
    try {
      await deleteAudit(auditToDelete.auditId || auditToDelete._id);
      setAudits((prev) => prev.filter((a) => (a.auditId || a._id) !== (auditToDelete.auditId || auditToDelete._id)));
      showToast('Audit deleted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete audit', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setAuditToDelete(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAllAudits();
      setAudits([]);
      showToast('All audit history cleared', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to clear audit history', 'error');
    } finally {
      setShowClearConfirm(false);
    }
  };

  // Distinct Filter Roles
  const uniqueRoles = Array.from(new Set(audits.map((a) => a.jobRole).filter(Boolean)));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-[#0f0e0d] space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0f0e0d]">Audit History</h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Browse, filter, and manage all historical AI fairness evaluation cycles.
          </p>
        </div>

        {audits.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" /> Clear All History
          </button>
        )}
      </div>

      {/* Controls Bar: Search, Filter, Sort */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cycle name, role..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
          />
        </div>

        {/* Filter Role */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        {/* Filter Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
        >
          <option value="all">All Compliance Statuses</option>
          <option value="compliant">Compliant</option>
          <option value="review_required">Review Required</option>
          <option value="violation">Violation</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9400a]"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="score_desc">Highest Fairness Score</option>
          <option value="candidates_desc">Most Candidates</option>
        </select>
      </div>

      {/* Empty State */}
      {paginatedAudits.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center shadow-sm">
          <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-[#0f0e0d]">No Audits Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            No audit records match your query filters or history is empty.
          </p>
        </div>
      )}

      {/* Audit Cards List */}
      <div className="space-y-4">
        {paginatedAudits.map((audit) => {
          const score = audit.fairnessMetrics?.fairnessHealthScore || 75;
          const status = audit.status || audit.overallStatus || 'compliant';

          return (
            <div
              key={audit.auditId || audit._id}
              className="bg-white rounded-2xl border border-[#e5e7eb] p-6 hover:border-[#c9400a] hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#c9400a] font-bold text-lg flex-shrink-0">
                    {score}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg font-bold text-[#0f0e0d]">
                        {audit.cycleName || 'Unnamed Cycle'}
                      </h3>
                      {/* Compliance Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          score >= 80
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {score >= 80 ? 'Compliant' : 'Review Required'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Job Role: <span className="font-semibold text-gray-800">{audit.jobRole || 'Unspecified'}</span> •
                      Department: {audit.department || 'General'} • Date: {formatDate(audit.processedAt)}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics row */}
                <div className="flex items-center gap-6 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Candidates</p>
                    <p className="font-mono text-base font-bold text-[#0f0e0d]">{audit.stats?.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Hired</p>
                    <p className="font-mono text-base font-bold text-green-600">{audit.stats?.hired || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Hire Rate</p>
                    <p className="font-mono text-base font-bold text-[#c9400a]">{audit.stats?.hireRate || '0%'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewResults(audit)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#c9400a] text-white rounded-xl text-xs font-semibold hover:bg-[#a8360a] transition-all"
                >
                  <ChevronRightIcon className="w-4 h-4" /> View Results
                </button>
                <button
                  onClick={() => handleDownloadPDF(audit)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  <DocumentTextIcon className="w-4 h-4 text-blue-600" /> PDF Report
                </button>
                <button
                  onClick={() => handleDownloadCSV(audit)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 text-green-600" /> Download CSV
                </button>
                <button
                  onClick={() => handleDuplicate(audit)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  <DocumentDuplicateIcon className="w-4 h-4 text-purple-600" /> Duplicate
                </button>
                <button
                  onClick={() => handleDeleteAudit(audit)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs">
          <p className="text-gray-500">
            Page {currentPage} of {totalPages} ({sortedAudits.length} items)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && auditToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-[#0f0e0d]">Delete Audit Record?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-black">"{auditToDelete.cycleName}"</span>? This will permanently delete the record from MongoDB.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAudit}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-red-600">Clear Entire Audit History?</h3>
            <p className="text-sm text-gray-600">
              This will permanently delete all {audits.length} audit records from MongoDB. Action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}