import React, { useState, useEffect } from 'react';
import {
  WrenchIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { getLatestAudit } from '../services/api';
import geminiService from '../services/gemini';
import SkeletonLoader from '../components/ui/SkeletonLoader';

export default function Remediation() {
  const [audit, setAudit] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRemediation = async () => {
      setLoading(true);
      try {
        const latest = await getLatestAudit();
        const recs = await geminiService.generateRemediationRecommendations(latest);

        if (isMounted) {
          setAudit(latest);
          setRecommendations(recs);
        }
      } catch (err) {
        console.error('Remediation fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRemediation();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  const priorityBadgeColor = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-[#c9400a] border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0f0e0d]">AI Bias Remediation Hub</h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Actionable AI-generated strategies to mitigate candidate bias and optimize selection fairness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1">
            <SparklesIcon className="w-3.5 h-3.5" /> Gemini AI Powered
          </span>
        </div>
      </div>

      {/* Audit Context Banner */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Audit Cycle</p>
          <h3 className="font-serif text-xl font-bold text-[#0f0e0d] mt-1">
            {audit?.cycleName || 'Current Active Cycle'}
          </h3>
          <p className="text-xs text-gray-500">
            Role: {audit?.jobRole || 'Software Engineer'} • Total Candidates: {audit?.stats?.total || 0}
          </p>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase">Fairness Score</p>
            <p className="font-mono text-2xl font-bold text-[#c9400a]">
              {audit?.fairnessMetrics?.fairnessHealthScore || 75}/100
            </p>
          </div>
        </div>
      </div>

      {/* REMEDIATION FLOW CARDS */}
      <div className="space-y-6">
        {recommendations.map((item, idx) => (
          <div
            key={item.id || idx}
            className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm hover:border-[#c9400a] transition-all space-y-6"
          >
            {/* Header / Priority */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#c9400a] font-bold">
                  #{idx + 1}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detected Issue</span>
                  <h3 className="font-serif text-lg font-bold text-[#0f0e0d]">{item.issue}</h3>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  priorityBadgeColor[item.priority] || priorityBadgeColor.medium
                }`}
              >
                Priority: {item.priority}
              </span>
            </div>

            {/* FLOW STEP 1: Gemini Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" /> Why Bias Exists (Gemini AI Root Cause)
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">{item.explanation}</p>
              </div>

              {/* FLOW STEP 2: Recommendation */}
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200 space-y-1">
                <p className="text-xs font-bold text-[#c9400a] uppercase tracking-wider flex items-center gap-1">
                  <WrenchIcon className="w-4 h-4" /> Actionable Mitigation Recommendation
                </p>
                <p className="text-xs text-gray-800 leading-relaxed">{item.recommendation}</p>
              </div>
            </div>

            {/* FLOW STEP 3: Expected Bias Reduction */}
            <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-900">Expected Bias Reduction</p>
                  <p className="text-xs text-green-700">{item.expectedBiasReduction}</p>
                </div>
              </div>

              <button
                onClick={() => alert(`Remediation action "${item.issue}" logged for team review.`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
              >
                Mark as Implemented
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}