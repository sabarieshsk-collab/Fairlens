const Audit = require('../models/Audit');
const { calculateAdvancedFairnessMetrics, calculateFairnessHealthScore } = require('../services/fairnessService');

exports.getMonitoringData = async (req, res, next) => {
  try {
    const audits = await Audit.find({ company: req.company.companyId })
      .sort({ createdAt: 1 });
    
    if (audits.length === 0) {
      return res.json({
        currentBiasScore: null,
        disparateImpactRatio: null,
        equalOpportunityDifference: null,
        selectionRate: null,
        riskLevel: 'unknown',
        modelDrift: null,
        trendData: [],
        alerts: [],
      });
    }
    
    const latestAudit = audits[audits.length - 1];
    const metrics = latestAudit.fairnessMetrics || {};
    
    // Calculate current bias score (inverse of fairness health)
    const currentBiasScore = metrics.fairnessHealthScore 
      ? 100 - metrics.fairnessHealthScore 
      : 50;
    
    // Calculate trend data from all audits
    const trendData = audits.map((audit, index) => ({
      date: audit.createdAt,
      auditName: audit.auditName,
      biasScore: audit.fairnessMetrics?.fairnessHealthScore 
        ? 100 - audit.fairnessMetrics.fairnessHealthScore 
        : 50,
      disparateImpact: audit.fairnessMetrics?.disparateImpactRatio || 0,
      equalOpportunity: audit.fairnessMetrics?.equalOpportunityDifference || 0,
      selectionRate: audit.stats?.total > 0 
        ? (audit.stats.hired / audit.stats.total) * 100 
        : 0,
    }));
    
    // Calculate model drift (change in bias score over time)
    let modelDrift = 0;
    if (trendData.length >= 2) {
      const recent = trendData.slice(-3).reduce((sum, d) => sum + d.biasScore, 0) / 3;
      const older = trendData.slice(0, -3).length > 0 
        ? trendData.slice(0, -3).reduce((sum, d) => sum + d.biasScore, 0) / trendData.slice(0, -3).length
        : trendData[0].biasScore;
      modelDrift = recent - older;
    }
    
    // Determine risk level
    let riskLevel = 'low';
    if (currentBiasScore > 60) riskLevel = 'critical';
    else if (currentBiasScore > 40) riskLevel = 'high';
    else if (currentBiasScore > 20) riskLevel = 'medium';
    
    // Generate alerts
    const alerts = generateAlerts(latestAudit, audits, currentBiasScore, modelDrift);
    
    res.json({
      currentBiasScore: Math.round(currentBiasScore),
      disparateImpactRatio: metrics.disparateImpactRatio || 0,
      equalOpportunityDifference: metrics.equalOpportunityDifference || 0,
      selectionRate: latestAudit.stats?.total > 0 
        ? Math.round((latestAudit.stats.hired / latestAudit.stats.total) * 100) 
        : 0,
      riskLevel,
      modelDrift: Math.round(modelDrift * 100) / 100,
      trendData: trendData.slice(-12), // Last 12 audits
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

function generateAlerts(latestAudit, allAudits, currentBiasScore, modelDrift) {
  const alerts = [];
  const metrics = latestAudit.fairnessMetrics || {};
  
  // High bias alert
  if (currentBiasScore > 60) {
    alerts.push({
      id: `alert-${Date.now()}-1`,
      type: 'high_bias',
      severity: 'critical',
      title: 'Critical Bias Detected',
      message: `Current bias score is ${Math.round(currentBiasScore)}%. Immediate remediation required.`,
      timestamp: new Date().toISOString(),
      auditId: latestAudit._id,
    });
  } else if (currentBiasScore > 40) {
    alerts.push({
      id: `alert-${Date.now()}-2`,
      type: 'high_bias',
      severity: 'high',
      title: 'High Bias Risk',
      message: `Current bias score is ${Math.round(currentBiasScore)}%. Review hiring policies.`,
      timestamp: new Date().toISOString(),
      auditId: latestAudit._id,
    });
  }
  
  // Disparate impact alert
  if (metrics.disparateImpactRatio > 0 && metrics.disparateImpactRatio < 0.8) {
    alerts.push({
      id: `alert-${Date.now()}-3`,
      type: 'disparate_impact',
      severity: 'high',
      title: 'Disparate Impact Below Threshold',
      message: `Disparate impact ratio is ${metrics.disparateImpactRatio.toFixed(2)} (below 0.80 EEOC threshold).`,
      timestamp: new Date().toISOString(),
      auditId: latestAudit._id,
    });
  }
  
  // Model drift alert
  if (Math.abs(modelDrift) > 10) {
    alerts.push({
      id: `alert-${Date.now()}-4`,
      type: 'model_drift',
      severity: modelDrift > 0 ? 'high' : 'medium',
      title: modelDrift > 0 ? 'Bias Increasing' : 'Bias Decreasing',
      message: `Model drift detected: ${modelDrift > 0 ? '+' : ''}${modelDrift.toFixed(1)}% change in bias score.`,
      timestamp: new Date().toISOString(),
      auditId: latestAudit._id,
    });
  }
  
  // Proxy correlation alert
  if (metrics.proxyCorrelationScore > 0.3) {
    alerts.push({
      id: `alert-${Date.now()}-5`,
      type: 'proxy_correlation',
      severity: 'medium',
      title: 'High Proxy Correlation',
      message: `Proxy correlation score is ${metrics.proxyCorrelationScore.toFixed(2)}. Proxy variables may be influencing decisions.`,
      timestamp: new Date().toISOString(),
      auditId: latestAudit._id,
    });
  }
  
  // No critical alerts
  if (alerts.length === 0) {
    alerts.push({
      id: `alert-${Date.now()}-6`,
      type: 'system',
      severity: 'info',
      title: 'No Critical Alerts',
      message: 'All fairness metrics are within acceptable thresholds.',
      timestamp: new Date().toISOString(),
    });
  }
  
  return alerts;
}

exports.getMonitoringTrends = async (req, res, next) => {
  try {
    const { period = '6months' } = req.query;
    
    const audits = await Audit.find({ company: req.company.companyId })
      .sort({ createdAt: 1 });
    
    // Group by month
    const monthlyData = {};
    audits.forEach(audit => {
      const monthKey = audit.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          audits: [],
          totalCandidates: 0,
          totalHired: 0,
          biasScores: [],
        };
      }
      monthlyData[monthKey].audits.push(audit);
      monthlyData[monthKey].totalCandidates += audit.stats?.total || 0;
      monthlyData[monthKey].totalHired += audit.stats?.hired || 0;
      monthlyData[monthKey].biasScores.push(
        audit.fairnessMetrics?.fairnessHealthScore 
          ? 100 - audit.fairnessMetrics.fairnessHealthScore 
          : 50
      );
    });
    
    const trends = Object.values(monthlyData).map(m => ({
      month: m.month,
      auditCount: m.audits.length,
      totalCandidates: m.totalCandidates,
      hireRate: m.totalCandidates > 0 ? Math.round((m.totalHired / m.totalCandidates) * 100) : 0,
      avgBiasScore: m.biasScores.length > 0 
        ? Math.round(m.biasScores.reduce((a, b) => a + b, 0) / m.biasScores.length) 
        : 0,
    }));
    
    res.json({ trends });
  } catch (error) {
    next(error);
  }
};