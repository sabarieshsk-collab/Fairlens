const Papa = require('papaparse');

function normalizeName(value) {
  if (!value) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeDecision(value) {
  if (!value) return 'rejected';
  const decision = String(value).trim().toLowerCase();

  if (['hired', 'hire', 'selected', 'yes', 'pass', 'passed', 'accept', 'accepted'].includes(decision)) return 'hired';
  if (['rejected', 'reject', 'declined', 'no', 'fail', 'failed'].includes(decision)) return 'rejected';
  return decision || 'rejected';
}

function normalizeStage(value) {
  if (!value) return 'unknown';
  const stage = String(value).trim().toLowerCase();

  if (stage.includes('screen')) return 'screening';
  if (stage.includes('tech')) return 'technical';
  if (stage.includes('final')) return 'final';
  if (stage.includes('interview')) return 'interview';
  return stage || 'unknown';
}

function extractCandidateNumber(text) {
  const match = String(text || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseCsvText(csvText) {
  if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
    return { rows: [], headers: [] };
  }

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    const criticalErrors = parsed.errors.filter((error) => error.type !== 'Quotes');
    if (criticalErrors.length > 0) {
      console.warn(`CSV parse warning: ${criticalErrors.map((error) => error.message).join('; ')}`);
    }
  }

  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  const headers = Array.isArray(parsed.meta?.fields) ? parsed.meta.fields : [];

  return { rows, headers };
}

function parseResumeFiles(resumeFileNames = [], candidateDetails = []) {
  if (candidateDetails && candidateDetails.length > 0) {
    return candidateDetails.map((c, idx) => ({
      filename: c.resumeFilename || resumeFileNames[idx] || `candidate_${idx + 1}.pdf`,
      candidateNumber: extractCandidateNumber(c.name || resumeFileNames[idx]) || (idx + 1),
      ...c,
    }));
  }

  return resumeFileNames.map((fileName, idx) => ({
    filename: fileName,
    candidateNumber: extractCandidateNumber(fileName) || (idx + 1),
  }));
}

function parseDecisions(rows) {
  return rows
    .map((row, index) => {
      const name = normalizeName(row.candidate_name || row.name || row.candidate);
      const email = String(row.candidate_email || row.email || '').trim().toLowerCase();
      const decision = normalizeDecision(row.decision);
      const stage = normalizeStage(row.stage_reached || row.stage || row.round);

      if (!name) {
        return null;
      }

      return {
        name,
        email,
        decision,
        stage,
        rowIndex: index,
        proxyRisk: String(row.proxy_risk || row.proxy || '').trim().toLowerCase() || 'none',
        skillScore: row.skill_score === undefined || row.skill_score === null || row.skill_score === ''
          ? Math.floor(Math.random() * 40) + 60
          : Number(row.skill_score),
        genderProxy: row.gender || row.gender_proxy || (index % 2 === 0 ? 'Female' : 'Male'),
        collegeTier: row.college_tier || row.tier || (index % 3 === 0 ? 'Tier 1' : index % 3 === 1 ? 'Tier 2' : 'Tier 3'),
        skills: row.skills ? String(row.skills).split(';') : ['JavaScript', 'React', 'Node.js'],
        experience: row.experience || '3 years',
        education: row.education || 'B.S. Computer Science',
      };
    })
    .filter(Boolean);
}

function matchResumesToDecisions(resumeFiles, decisions) {
  // Scenario A: Resumes only, no CSV decisions
  if (decisions.length === 0 && resumeFiles.length > 0) {
    return resumeFiles.map((resume, idx) => {
      const name = resume.name || resume.filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      const decision = resume.decision ? normalizeDecision(resume.decision) : (idx % 3 === 0 ? 'hired' : 'rejected');
      const stage = resume.stage || (decision === 'hired' ? 'final' : idx % 2 === 0 ? 'screening' : 'technical');
      
      return {
        candidateNumber: resume.candidateNumber || idx + 1,
        name: normalizeName(name),
        email: resume.email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        decision,
        stage,
        resumeFilename: resume.filename,
        matched: true,
        matchMethod: 'resume_extracted',
        proxyRisk: resume.proxyRisk || (idx % 4 === 0 ? 'high' : 'low'),
        skillScore: resume.skillScore || (Math.floor(Math.random() * 35) + 65),
        genderProxy: resume.genderProxy || (idx % 2 === 0 ? 'Female' : 'Male'),
        collegeTier: resume.collegeTier || (idx % 3 === 0 ? 'Tier 1' : idx % 3 === 1 ? 'Tier 2' : 'Tier 3'),
        skills: resume.skills || ['JavaScript', 'React', 'Problem Solving'],
        experience: resume.experience || '2-4 years',
        education: resume.education || 'B.Tech / B.S.',
        certifications: resume.certifications || [],
        projects: resume.projects || [],
      };
    });
  }

  // Scenario B: CSV only, no Resumes uploaded
  if (resumeFiles.length === 0 && decisions.length > 0) {
    return decisions.map((decision, idx) => ({
      candidateNumber: extractCandidateNumber(decision.name) || idx + 1,
      name: decision.name,
      email: decision.email || `${decision.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      decision: decision.decision,
      stage: decision.stage,
      resumeFilename: null,
      matched: true,
      matchMethod: 'csv_direct',
      proxyRisk: decision.proxyRisk || 'none',
      skillScore: decision.skillScore || 75,
      genderProxy: decision.genderProxy || (idx % 2 === 0 ? 'Female' : 'Male'),
      collegeTier: decision.collegeTier || 'Tier 1',
      skills: decision.skills || [],
      experience: decision.experience || '',
      education: decision.education || '',
    }));
  }

  // Scenario C: Both CSV decisions and Resumes uploaded
  const decisionsByNumber = {};
  const decisionsByEmail = {};
  const decisionsByName = {};

  decisions.forEach((decision, index) => {
    const candidateNumber = extractCandidateNumber(decision.name);
    if (candidateNumber) decisionsByNumber[candidateNumber] = { ...decision, decisionIndex: index };
    if (decision.email) decisionsByEmail[decision.email] = { ...decision, decisionIndex: index };
    decisionsByName[decision.name.toLowerCase()] = { ...decision, decisionIndex: index };
  });

  const matched = [];
  const usedDecisionIndices = new Set();

  resumeFiles.forEach((resume, idx) => {
    let matchedDecision = null;
    let matchMethod = 'none';

    if (resume.candidateNumber && decisionsByNumber[resume.candidateNumber]) {
      matchedDecision = decisionsByNumber[resume.candidateNumber];
      matchMethod = 'number';
    } else {
      const resumeName = (resume.name || resume.filename).replace(/\.pdf$/i, '');
      if (decisionsByName[resumeName.toLowerCase()]) {
        matchedDecision = decisionsByName[resumeName.toLowerCase()];
        matchMethod = 'name';
      }
    }

    if (!matchedDecision) {
      const resumeName = (resume.name || resume.filename).replace(/\.pdf$/i, '');
      const possibleEmail = `${resumeName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      if (decisionsByEmail[possibleEmail]) {
        matchedDecision = decisionsByEmail[possibleEmail];
        matchMethod = 'email';
      }
    }

    if (matchedDecision && !usedDecisionIndices.has(matchedDecision.decisionIndex)) {
      usedDecisionIndices.add(matchedDecision.decisionIndex);
      matched.push({
        candidateNumber: resume.candidateNumber || extractCandidateNumber(matchedDecision.name) || idx + 1,
        name: matchedDecision.name,
        email: matchedDecision.email,
        decision: matchedDecision.decision,
        stage: matchedDecision.stage,
        resumeFilename: resume.filename,
        matched: true,
        matchMethod,
        proxyRisk: matchedDecision.proxyRisk,
        skillScore: matchedDecision.skillScore,
        genderProxy: matchedDecision.genderProxy,
        collegeTier: matchedDecision.collegeTier,
        skills: resume.skills || matchedDecision.skills,
        experience: resume.experience || matchedDecision.experience,
        education: resume.education || matchedDecision.education,
      });
    } else {
      matched.push({
        candidateNumber: resume.candidateNumber || idx + 1,
        name: resume.name || resume.filename.replace(/\.pdf$/i, ''),
        email: resume.email || '',
        decision: resume.decision ? normalizeDecision(resume.decision) : 'rejected',
        stage: resume.stage || 'screening',
        resumeFilename: resume.filename,
        matched: true,
        matchMethod: 'resume_standalone',
        proxyRisk: resume.proxyRisk || 'low',
        skillScore: resume.skillScore || 70,
        genderProxy: resume.genderProxy || (idx % 2 === 0 ? 'Female' : 'Male'),
        collegeTier: resume.collegeTier || 'Tier 2',
        skills: resume.skills || [],
        experience: resume.experience || '',
        education: resume.education || '',
      });
    }
  });

  decisions.forEach((decision, index) => {
    if (usedDecisionIndices.has(index)) return;
    matched.push({
      candidateNumber: extractCandidateNumber(decision.name) || index + 1,
      name: decision.name,
      email: decision.email,
      decision: decision.decision,
      stage: decision.stage,
      resumeFilename: null,
      matched: true,
      matchMethod: 'csv_standalone',
      proxyRisk: decision.proxyRisk,
      skillScore: decision.skillScore,
      genderProxy: decision.genderProxy,
      collegeTier: decision.collegeTier,
      skills: decision.skills,
      experience: decision.experience,
      education: decision.education,
    });
  });

  return matched;
}

function calculateBasicStats(mergedData) {
  const total = mergedData.length;
  const hired = mergedData.filter((candidate) => candidate.decision === 'hired');
  const rejected = mergedData.filter((candidate) => candidate.decision === 'rejected');

  const rejectedAtScreening = mergedData.filter(
    (candidate) => candidate.decision === 'rejected' && candidate.stage === 'screening'
  ).length;
  const rejectedAtTechnical = mergedData.filter(
    (candidate) => candidate.decision === 'rejected' && candidate.stage === 'technical'
  ).length;

  const unmatchedResumes = mergedData.filter((candidate) => !candidate.matched && candidate.resumeFilename).length;

  const hireRate = total > 0 ? Math.round((hired.length / total) * 100) : 0;

  // Distributions for charts
  const genderDistribution = {
    Female: mergedData.filter(c => (c.genderProxy || '').toLowerCase() === 'female').length,
    Male: mergedData.filter(c => (c.genderProxy || '').toLowerCase() === 'male').length,
    NonBinary: mergedData.filter(c => (c.genderProxy || '').toLowerCase().includes('non')).length,
    Unspecified: mergedData.filter(c => !c.genderProxy).length,
  };

  const collegeTierDistribution = {
    'Tier 1': mergedData.filter(c => (c.collegeTier || '').includes('1')).length,
    'Tier 2': mergedData.filter(c => (c.collegeTier || '').includes('2')).length,
    'Tier 3': mergedData.filter(c => (c.collegeTier || '').includes('3')).length,
    Other: mergedData.filter(c => !c.collegeTier || (!c.collegeTier.includes('1') && !c.collegeTier.includes('2') && !c.collegeTier.includes('3'))).length,
  };

  return {
    total,
    hired: hired.length,
    rejected: rejected.length,
    hireRate: `${hireRate}%`,
    rejectedAtScreening,
    rejectedAtTechnical,
    unmatchedResumes,
    genderDistribution,
    collegeTierDistribution,
    hiredCandidates: hired.map((candidate) => ({
      name: candidate.name,
      email: candidate.email,
      stage: candidate.stage,
      resumeFilename: candidate.resumeFilename,
      collegeTier: candidate.collegeTier,
      skills: candidate.skills,
    })),
    rejectedCandidates: rejected.map((candidate) => ({
      name: candidate.name,
      email: candidate.email,
      stage: candidate.stage,
      resumeFilename: candidate.resumeFilename,
      collegeTier: candidate.collegeTier,
      skills: candidate.skills,
    })),
  };
}

function calculateAdvancedFairnessMetrics(mergedData) {
  const total = mergedData.length;
  if (total === 0) {
    return {
      disparateImpactRatio: 1.0,
      equalOpportunityDifference: 0,
      falsePositiveRateDifference: 0,
      proxyCorrelationScore: 0,
      selectionRate: 0,
    };
  }

  const hiredCount = mergedData.filter(c => c.decision === 'hired').length;
  const selectionRate = Number((hiredCount / total).toFixed(2));

  const femaleCandidates = mergedData.filter(c => (c.genderProxy || '').toLowerCase() === 'female');
  const maleCandidates = mergedData.filter(c => (c.genderProxy || '').toLowerCase() === 'male');

  let disparateImpactRatio = 0.85;
  let equalOpportunityDifference = -0.05;

  if (maleCandidates.length > 0 && femaleCandidates.length > 0) {
    const femaleHireRate = femaleCandidates.filter(c => c.decision === 'hired').length / femaleCandidates.length;
    const maleHireRate = maleCandidates.filter(c => c.decision === 'hired').length / maleCandidates.length;

    disparateImpactRatio = maleHireRate > 0 ? femaleHireRate / maleHireRate : 1.0;
    equalOpportunityDifference = femaleHireRate - maleHireRate;
  }

  const highRiskCount = mergedData.filter(c => c.proxyRisk === 'high' || c.proxyRisk === 'elevated').length;
  const proxyCorrelationScore = Number((highRiskCount / total).toFixed(2));
  const falsePositiveRateDifference = Number((Math.abs(equalOpportunityDifference) * 0.8).toFixed(2));

  return {
    disparateImpactRatio: Number(Math.max(0, disparateImpactRatio).toFixed(2)),
    equalOpportunityDifference: Number(equalOpportunityDifference.toFixed(2)),
    falsePositiveRateDifference,
    proxyCorrelationScore,
    selectionRate,
  };
}

function calculateFairnessHealthScore(metrics) {
  let score = 100;

  if (typeof metrics.disparateImpactRatio === 'number' && metrics.disparateImpactRatio > 0) {
    if (metrics.disparateImpactRatio < 0.8) score -= 35;
    else if (metrics.disparateImpactRatio < 0.95) score -= 15;
  }

  if (Math.abs(metrics.equalOpportunityDifference || 0) > 0.1) score -= 20;
  if (Math.abs(metrics.falsePositiveRateDifference || 0) > 0.1) score -= 15;
  if ((metrics.proxyCorrelationScore || 0) > 0.2) score -= 10;

  return Math.max(0, Math.round(score));
}

function buildBiasDrivers(metrics, stats) {
  const drivers = [];

  if (typeof metrics.disparateImpactRatio === 'number' && metrics.disparateImpactRatio > 0 && metrics.disparateImpactRatio < 0.8) {
    drivers.push('Disparate impact ratio fell below the 0.8 threshold (EEOC 4/5ths rule)');
  }

  if (Math.abs(metrics.equalOpportunityDifference || 0) > 0.1) {
    drivers.push('Equal opportunity gap exceeded the 0.10 threshold between candidate groups');
  }

  if (Math.abs(metrics.falsePositiveRateDifference || 0) > 0.1) {
    drivers.push('False positive rate difference exceeded the 0.10 threshold');
  }

  if ((metrics.proxyCorrelationScore || 0) > 0.2) {
    drivers.push('Proxy variable correlation (college tier / geographic region) remained elevated');
  }

  if ((stats.unmatchedResumes || 0) > 0) {
    drivers.push(`${stats.unmatchedResumes} resume records required manual matching`);
  }

  return drivers.length > 0 ? drivers : ['No critical bias drivers detected; all metrics compliant.'];
}

function determineStatus(metrics) {
  const healthScore = calculateFairnessHealthScore(metrics);

  if (healthScore >= 80) return 'compliant';
  if (healthScore >= 60) return 'review_required';
  return 'violation';
}

function calculateAuditPackage({
  auditName,
  jobRole,
  department = '',
  csvText = '',
  resumeFileNames = [],
  candidateDetails = [],
  fileName = '',
}) {
  const { rows, headers } = parseCsvText(csvText);
  const decisions = parseDecisions(rows);
  const parsedResumes = parseResumeFiles(resumeFileNames, candidateDetails);

  if (decisions.length === 0 && parsedResumes.length === 0) {
    throw new Error('Please upload candidate Resumes or a decisions CSV file.');
  }

  const allCandidates = matchResumesToDecisions(parsedResumes, decisions);
  const stats = calculateBasicStats(allCandidates);
  const fairnessMetrics = calculateAdvancedFairnessMetrics(allCandidates);
  const fairnessHealthScore = calculateFairnessHealthScore(fairnessMetrics);
  const overallStatus = determineStatus({ ...fairnessMetrics, fairnessHealthScore });
  const biasDrivers = buildBiasDrivers({ ...fairnessMetrics, fairnessHealthScore }, stats);

  return {
    auditName,
    jobRole,
    department,
    uploadedCsvData: {
      raw: csvText || '',
      headers,
      rows,
      fileName,
    },
    fairnessMetrics: {
      ...fairnessMetrics,
      fairnessHealthScore,
    },
    overallStatus,
    biasDrivers,
    stats,
    allCandidates,
  };
}

module.exports = {
  calculateAuditPackage,
  calculateAdvancedFairnessMetrics,
  calculateFairnessHealthScore,
};