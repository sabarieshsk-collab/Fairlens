import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  PlusCircleIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getAudits, getMonitoringData, getReports } from '../services/api';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#c9400a', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [monitoring, setMonitoring] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [auditsData, monitoringData, reportsData] = await Promise.all([
          getAudits().catch(() => []),
          getMonitoringData().catch(() => null),
          getReports().catch(() => ({ reports: [] })),
        ]);

        if (isMounted) {
          setAudits(Array.isArray(auditsData) ? auditsData : []);
          setMonitoring(monitoringData);
          setReports(reportsData?.reports || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
        <SkeletonLoader type="chart" />
        <SkeletonLoader type="table" />
      </div>
    );
  }

  const hasAudits = audits.length > 0;
  const latestAudit = hasAudits ? audits[0] : null;

  // Key Metrics
  const totalAudits = audits.length;
  const totalCandidates = audits.reduce((sum, a) => sum + (a.stats?.total || 0), 0);
  const avgFairnessScore = hasAudits
    ? Math.round(
        audits.reduce((sum, a) => sum + (a.fairnessMetrics?.fairnessHealthScore || 75), 0) / totalAudits
      )
    : 0;

  const highRiskAudits = audits.filter(
    (a) => (a.fairnessMetrics?.fairnessHealthScore || 100) < 60 || a.overallStatus === 'violation'
  ).length;

  const complianceStatus =
    highRiskAudits === 0 && hasAudits ? 'Compliant' : hasAudits ? 'Action Required' : 'No Data';

  const lastAuditDate = latestAudit
    ? new Date(latestAudit.processedAt || latestAudit.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'None';

  // Chart Data Calculations
  const hiringDistData = [
    { name: 'Hired', value: audits.reduce((sum, a) => sum + (a.stats?.hired || 0), 0) },
    { name: 'Rejected', value: audits.reduce((sum, a) => sum + (a.stats?.rejected || 0), 0) },
  ];

  const genderDistData = [
    { name: 'Female', count: audits.reduce((sum, a) => sum + (a.stats?.genderDistribution?.Female || 0), 0) },
    { name: 'Male', count: audits.reduce((sum, a) => sum + (a.stats?.genderDistribution?.Male || 0), 0) },
    { name: 'Other', count: audits.reduce((sum, a) => sum + (a.stats?.genderDistribution?.NonBinary || 0), 0) },
  ];

  const tierDistData = [
    { tier: 'Tier 1', count: audits.reduce((sum, a) => sum + (a.stats?.collegeTierDistribution?.['Tier 1'] || 0), 0) },
    { tier: 'Tier 2', count: audits.reduce((sum, a) => sum + (a.stats?.collegeTierDistribution?.['Tier 2'] || 0), 0) },
    { tier: 'Tier 3', count: audits.reduce((sum, a) => sum + (a.stats?.collegeTierDistribution?.['Tier 3'] || 0), 0) },
  ];

  const trendData = (monitoring?.trendData || audits.slice(0, 6).reverse()).map((item, idx) => ({
    name: item.auditName ? item.auditName.slice(0, 10) : `Audit ${idx + 1}`,
    score: item.fairnessMetrics?.fairnessHealthScore ?? (100 - (item.biasScore || 20)),
    disparateImpact: (item.disparateImpact || item.fairnessMetrics?.disparateImpactRatio || 0.85) * 100,
  }));

  const monthlyAuditsData = [
    { month: 'Jan', audits: 1 },
    { month: 'Feb', audits: 2 },
    { month: 'Mar', audits: 3 },
    { month: 'Apr', audits: totalAudits > 0 ? totalAudits : 1 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f0e0d] to-[#1f1e1c] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#c9400a]/20 text-[#c9400a] border border-[#c9400a]/30 mb-2">
            <SparklesIcon className="w-3.5 h-3.5" /> AI Fairness Audit Platform
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">
            Welcome back, {user?.companyName || user?.name || 'Company Admin'}
          </h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Real-time compliance intelligence, candidate analytics, and bias monitoring.
          </p>
        </div>

        {/* Quick Actions Header */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/new-audit')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c9400a] text-white rounded-xl font-medium text-sm hover:bg-[#a8360a] transition-all shadow-md"
          >
            <PlusCircleIcon className="w-4 h-4" /> Start New Audit
          </button>
        </div>
      </div>

      {/* SECTION 1 — 6 KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Total Audits</p>
          <p className="font-mono text-2xl font-bold text-[#0f0e0d] mt-2">{totalAudits}</p>
          <span className="text-[10px] text-green-600 font-medium mt-1">↑ Active workspace</span>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Total Candidates</p>
          <p className="font-mono text-2xl font-bold text-[#0f0e0d] mt-2">{totalCandidates}</p>
          <span className="text-[10px] text-gray-500 font-medium mt-1">Evaluated across cycles</span>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Avg Fairness Score</p>
          <p className="font-mono text-2xl font-bold text-[#c9400a] mt-2">{avgFairnessScore}/100</p>
          <span className="text-[10px] text-gray-500 font-medium mt-1">Target: &gt;80 score</span>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Compliance Status</p>
          <p
            className={`font-semibold text-sm mt-2 truncate ${
              complianceStatus === 'Compliant' ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            {complianceStatus}
          </p>
          <span className="text-[10px] text-gray-500 font-medium mt-1">EEOC &amp; AI Act standard</span>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">High Risk Audits</p>
          <p className="font-mono text-2xl font-bold text-red-600 mt-2">{highRiskAudits}</p>
          <span className="text-[10px] text-red-500 font-medium mt-1">Requires remediation</span>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Last Audit Date</p>
          <p className="font-sans text-sm font-semibold text-[#0f0e0d] mt-2 truncate">{lastAuditDate}</p>
          <span className="text-[10px] text-gray-500 font-medium mt-1">Latest execution</span>
        </div>
      </div>

      {/* SECTION 2 — QUICK ACTIONS BAR */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/new-audit')}
            className="p-4 rounded-xl border border-gray-200 hover:border-[#c9400a] hover:bg-orange-50/50 transition-all text-left group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-[#c9400a]15 flex items-center justify-center text-[#c9400a] group-hover:scale-110 transition-transform">
              <PlusCircleIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0f0e0d]">New Audit</p>
              <p className="text-xs text-[#6b7280]">Upload candidates or CSV</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/new-audit')}
            className="p-4 rounded-xl border border-gray-200 hover:border-[#c9400a] hover:bg-orange-50/50 transition-all text-left group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <DocumentArrowUpIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0f0e0d]">Upload CSV</p>
              <p className="text-xs text-[#6b7280]">Import decision records</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/new-audit')}
            className="p-4 rounded-xl border border-gray-200 hover:border-[#c9400a] hover:bg-orange-50/50 transition-all text-left group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0f0e0d]">Upload Resumes</p>
              <p className="text-xs text-[#6b7280]">AI candidate extraction</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/compliance-reports')}
            className="p-4 rounded-xl border border-gray-200 hover:border-[#c9400a] hover:bg-orange-50/50 transition-all text-left group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <ChartBarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0f0e0d]">View Reports</p>
              <p className="text-xs text-[#6b7280]">Export PDF / CSV compliance</p>
            </div>
          </button>
        </div>
      </div>

      {/* EMPTY STATE (If no audits exist) */}
      {!hasAudits && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#c9400a]/10 flex items-center justify-center text-[#c9400a]">
            <PlusCircleIcon className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#0f0e0d] mb-2">No Hiring Audits Found</h2>
          <p className="text-[#6b7280] max-w-md mx-auto mb-6 text-sm">
            Get started by uploading candidate resumes (PDF) or a decisions CSV to analyze hiring fairness and generate EEOC compliance reports.
          </p>
          <button
            onClick={() => navigate('/new-audit')}
            className="px-6 py-3 bg-[#c9400a] text-white rounded-xl font-medium hover:bg-[#a8360a] transition-colors shadow-md"
          >
            Start Your First Audit
          </button>
        </div>
      )}

      {/* SECTION 3 — 5 CHARTS GRID */}
      {hasAudits && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Fairness Trend (Line Chart) */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-4">Fairness &amp; Bias Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#c9400a" name="Fairness Score" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="disparateImpact" stroke="#3b82f6" name="Disparate Impact (%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Hiring Distribution (Pie Chart) */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-4">Hiring Outcome Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hiringDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {hiringDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#c9400a'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Gender Distribution */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-4">Gender Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: College Tier Distribution */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-4">College Tier Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="tier" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4 — RECENT ACTIVITY LOG & LATEST AUDIT SUMMARY */}
      {hasAudits && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Audits */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-[#0f0e0d]">Recent Audits</h3>
              <button
                onClick={() => navigate('/audit-history')}
                className="text-xs font-semibold text-[#c9400a] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {audits.slice(0, 4).map((a) => (
                <div
                  key={a.auditId || a._id}
                  onClick={() => navigate('/dashboard', { state: { auditId: a.auditId || a._id } })}
                  className="p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-[#c9400a] font-bold">
                      {(a.fairnessMetrics?.fairnessHealthScore || 75)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0f0e0d]">{a.cycleName}</p>
                      <p className="text-xs text-[#6b7280]">
                        Role: {a.jobRole} • {a.stats?.total || 0} candidates
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      (a.fairnessMetrics?.fairnessHealthScore || 75) >= 80
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {(a.fairnessMetrics?.fairnessHealthScore || 75) >= 80 ? 'Compliant' : 'Review'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts Log */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#0f0e0d] mb-4">System Activity</h3>
            <div className="space-y-3">
              {(monitoring?.alerts || []).slice(0, 3).map((alert, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-bold text-[#0f0e0d] truncate">{alert.title}</p>
                  </div>
                  <p className="text-[11px] text-[#6b7280] mt-1">{alert.message}</p>
                </div>
              ))}
              {(!monitoring?.alerts || monitoring.alerts.length === 0) && (
                <p className="text-xs text-[#9ca3af] text-center py-4">No recent critical alerts</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}