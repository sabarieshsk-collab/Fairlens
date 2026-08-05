import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { getMonitoringData } from '../services/api';
import SkeletonLoader from '../components/ui/SkeletonLoader';

export default function Monitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMonitoring = async () => {
      setLoading(true);
      try {
        const res = await getMonitoringData();
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error('Monitoring fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMonitoring();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  const currentBiasScore = data?.currentBiasScore ?? 25;
  const disparateImpact = data?.disparateImpactRatio ?? 0.85;
  const equalOpportunity = data?.equalOpportunityDifference ?? -0.04;
  const selectionRate = data?.selectionRate ?? 22;
  const riskLevel = data?.riskLevel || 'low';
  const modelDrift = data?.modelDrift ?? 1.2;
  const alerts = data?.alerts || [];
  const trendData = data?.trendData || [];

  const riskBadgeColor =
    riskLevel === 'critical' || riskLevel === 'high'
      ? 'bg-red-100 text-red-700 border-red-200'
      : riskLevel === 'medium'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-green-100 text-green-700 border-green-200';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0f0e0d]">Continuous Bias Monitoring</h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Real-time tracking of bias scores, longitudinal model drift, and regulatory risk alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${riskBadgeColor}`}>
            Risk Level: {riskLevel}
          </span>
        </div>
      </div>

      {/* SECTION 1 — 6 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Current Bias Score */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Current Bias Score</p>
          <p className="font-mono text-3xl font-bold text-[#c9400a] mt-2">{currentBiasScore}%</p>
          <p className="text-[10px] text-gray-500 mt-1">Lower is fairer</p>
        </div>

        {/* Card 2: Disparate Impact Ratio */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Disparate Impact</p>
          <p className="font-mono text-3xl font-bold text-blue-600 mt-2">{disparateImpact.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">EEOC Target: &gt;= 0.80</p>
        </div>

        {/* Card 3: Equal Opportunity Diff */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Equal Opp Gap</p>
          <p className="font-mono text-3xl font-bold text-purple-600 mt-2">{equalOpportunity.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Target: &lt;= 0.10</p>
        </div>

        {/* Card 4: Selection Rate */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Selection Rate</p>
          <p className="font-mono text-3xl font-bold text-green-600 mt-2">{selectionRate}%</p>
          <p className="text-[10px] text-gray-500 mt-1">Overall hires/total</p>
        </div>

        {/* Card 5: Risk Level */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Risk Level</p>
          <p className="font-sans text-xl font-bold text-[#0f0e0d] mt-2 uppercase">{riskLevel}</p>
          <p className="text-[10px] text-gray-500 mt-1">System status</p>
        </div>

        {/* Card 6: Model Drift */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm">
          <p className="text-xs font-medium text-[#6b7280]">Model Drift</p>
          <div className="flex items-center gap-1 mt-2">
            {modelDrift > 0 ? (
              <ArrowTrendingUpIcon className="w-5 h-5 text-red-500" />
            ) : (
              <ArrowTrendingDownIcon className="w-5 h-5 text-green-500" />
            )}
            <span className="font-mono text-2xl font-bold text-[#0f0e0d]">
              {modelDrift > 0 ? `+${modelDrift}` : modelDrift}%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Longitudinal shift</p>
        </div>
      </div>

      {/* SECTION 2 — TREND GRAPH */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#0f0e0d]">Longitudinal Bias &amp; Fairness Trend Graph</h3>
            <p className="text-xs text-gray-500">Tracking bias score evolution across recent hiring evaluation cycles.</p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="auditName" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="biasScore" stroke="#c9400a" strokeWidth={3} name="Bias Score (%)" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="selectionRate" stroke="#10b981" strokeWidth={2} name="Selection Rate (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3 — ALERTS SECTION */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#0f0e0d] flex items-center gap-2">
          <BellIcon className="w-6 h-6 text-[#c9400a]" /> Real-Time Regulatory &amp; Bias Alerts
        </h3>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-start gap-4 ${
                alert.severity === 'critical' || alert.severity === 'high'
                  ? 'bg-red-50 border-red-200'
                  : alert.severity === 'medium'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-white shadow-sm flex-shrink-0">
                {alert.severity === 'critical' || alert.severity === 'high' ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                ) : alert.severity === 'medium' ? (
                  <ShieldExclamationIcon className="w-5 h-5 text-amber-600" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-[#0f0e0d]">{alert.title}</p>
                  <span className="text-[10px] text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mt-1">{alert.message}</p>
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <p className="text-xs font-semibold text-green-800">No Critical Alerts — System functioning within normal parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}