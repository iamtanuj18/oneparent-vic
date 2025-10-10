const express = require("express");
const router = express.Router();
const { getPool } = require("../db");
const { asyncHandler } = require("../utils/asyncHandler");
const { geminiValidateJson } = require("../services/gemini");


function calculateTimeSince(journeyStartDate) {
  const journeyStart = new Date(journeyStartDate);
  const now = new Date();
  const diffTime = Math.abs(now - journeyStart);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const totalMonths = years * 12 + months;
  
  return { years, months, totalMonths };
}

async function getMentalHealthData(timeSince = null) {
  const pool = getPool();
  let query = `
    SELECT year_from_onset, single_parent_pct, population_pct, source_attribution
    FROM hilda.mental_health_recovery
    ORDER BY year_from_onset
  `;
  
  if (timeSince && timeSince.years !== undefined) {
    const targetYear = Math.floor(timeSince.years);
    query = `
      SELECT year_from_onset, single_parent_pct, population_pct, source_attribution
      FROM hilda.mental_health_recovery
      WHERE year_from_onset = ${targetYear}
      OR year_from_onset = (
        SELECT year_from_onset 
        FROM hilda.mental_health_recovery 
        WHERE year_from_onset <= ${targetYear}
        ORDER BY year_from_onset DESC 
        LIMIT 1
      )
      ORDER BY ABS(year_from_onset - ${targetYear}) ASC
      LIMIT 1
    `;
  }
  
  const result = await pool.query(query);
  return result.rows;
}

async function getChildcareCosts() {
  const pool = getPool();
  const query = `
    SELECT category, subcategory, measure, value, period, source_attribution
    FROM hilda.childcare_usage
    WHERE category = 'Parent type' AND measure = 'median_weekly'
    ORDER BY period DESC, subcategory
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getHousingStressData() {
  const pool = getPool();
  const query = `
    SELECT family_type, stress_pct, year, source_attribution
    FROM hilda.housing_stress
    WHERE year = (SELECT MAX(year) FROM hilda.housing_stress)
    ORDER BY family_type
  `;
  const result = await pool.query(query);
  return result.rows;
}


async function generateComprehensiveAnalysis(journeyData) {
  const {
    timeSince,
    childAge,
    numberOfChildren,
    housingType,
    employmentStatus,
    incomeBracket,
    childcareUsage,
    stressLevel,
    supportNetworkStrength,
    biggestChallenges,
    improvementGoals,
    hildaDatasets
  } = journeyData;

  let analysisResults = {};
  const errors = [];

  // CONSOLIDATED APPROACH: 4 strategic calls for reliable generation with proper error handling
  try {
    console.log('[Journey Analysis] Starting risk/context analysis...');
    const riskContextAnalysis = await generateConsolidatedRiskAndContext(journeyData, hildaDatasets);
    analysisResults.riskContext = riskContextAnalysis;
  } catch (error) {
    console.error('[Journey Analysis] Risk/context analysis failed:', error.message);
    errors.push(`Risk analysis failed: ${error.message}`);
  }

  try {
    console.log('[Journey Analysis] Starting journey/prediction analysis...');
    const journeyPredictionAnalysis = await generateConsolidatedJourneyAndPrediction(journeyData, hildaDatasets);
    analysisResults.journeyPrediction = journeyPredictionAnalysis;
  } catch (error) {
    console.error('[Journey Analysis] Journey/prediction analysis failed:', error.message);
    errors.push(`Journey prediction failed: ${error.message}`);
  }

  try {
    console.log('[Journey Analysis] Starting main actions analysis...');
    const mainActionsAnalysis = await generateConsolidatedMainActions(journeyData, hildaDatasets, analysisResults.riskContext?.contextualInsights);
    analysisResults.mainActions = mainActionsAnalysis;
  } catch (error) {
    console.error('[Journey Analysis] Main actions analysis failed:', error.message);
    errors.push(`Action plan failed: ${error.message}`);
  }

  try {
    console.log('[Journey Analysis] Starting challenge/goal actions analysis...');
    const challengeGoalAnalysis = await generateConsolidatedChallengeGoalActions(journeyData, hildaDatasets);
    analysisResults.challengeGoal = challengeGoalAnalysis;
  } catch (error) {
    console.error('[Journey Analysis] Challenge/goal actions analysis failed:', error.message);
    errors.push(`Challenge/goal actions failed: ${error.message}`);
  }

  // If we have too many critical failures, throw an error
  if (errors.length >= 3) {
    throw new Error(`Multiple analysis components failed: ${errors.join('; ')}`);
  }

  // If we have some results, proceed with what we have
  console.log(`[Journey Analysis] Completed with ${errors.length} errors out of 4 components`);

  // If critical components are missing, throw error for proper handling
  if (!analysisResults.riskContext || !analysisResults.journeyPrediction || !analysisResults.mainActions || !analysisResults.challengeGoal) {
    throw new Error('Incomplete analysis: One or more AI components failed to generate required content');
  }

  return {
    riskFactors: analysisResults.riskContext.riskFactors,
    protectiveFactors: analysisResults.riskContext.protectiveFactors,
    financialStress: analysisResults.riskContext.financialStress,
    contextualInsights: analysisResults.riskContext.contextualInsights,
    journeyStage: analysisResults.journeyPrediction.currentStage,
    trajectoryPrediction: analysisResults.journeyPrediction.prediction,
    personalizedTimeline: analysisResults.journeyPrediction.timeline,
    successProbabilities: analysisResults.journeyPrediction.probabilities,
    personalizedActions: analysisResults.mainActions.actions,
    nextSteps: analysisResults.mainActions.nextSteps,
    milestones: analysisResults.mainActions.milestones,
    
    challengeSpecificActions: analysisResults.challengeGoal.challengeSpecificActions,
    goalSpecificActions: analysisResults.challengeGoal.goalSpecificActions,
    
    situationSummary: analysisResults.journeyPrediction.situationSummary,
    progressSummary: analysisResults.journeyPrediction.progressSummary,
    
    // Add metadata about analysis completeness
    analysisCompleteness: {
      completedComponents: 4 - errors.length,
      totalComponents: 4,
      errors: errors.length > 0 ? errors : null
    }
  };
}

// CONSOLIDATED CALL 1: Risk & Context Analysis 
async function generateConsolidatedRiskAndContext(journeyData, hildaDatasets) {
  const {
    timeSince, employmentStatus, supportNetworkStrength, 
    biggestChallenges, improvementGoals, stressLevel, incomeBracket,
    numberOfChildren, childAge, housingType, childcareUsage
  } = journeyData;

  const relevantHildaData = extractRelevantHildaData(journeyData, hildaDatasets);

  const consolidatedPrompt = `
You are analyzing the risk profile and contextual situation for a single parent in Victoria, Australia using HILDA research data.

PARENT'S COMPLETE PROFILE:
- Journey Stage: ${timeSince.years} years, ${timeSince.months} months into single parenthood
- Family: ${numberOfChildren} children, youngest ${childAge === 0 ? 'under 1 year old' : childAge === 5 ? 'over 4 years old' : `${childAge} years old`}
- Housing: ${housingType}
- Employment: ${employmentStatus}
- Income: ${incomeBracket}
- Childcare: ${childcareUsage}
- Current stress: ${stressLevel}/10
- Support network: ${supportNetworkStrength}/5
- Main challenges: ${biggestChallenges.join(', ')}
- Goals: ${improvementGoals.join(', ')}

COMPREHENSIVE HILDA DATA CONTEXT:
${JSON.stringify(relevantHildaData, null, 2)}

REQUIRED: Generate complete analysis for ALL FOUR components:

1. RISK FACTORS ANALYSIS: Based on HILDA patterns, identify specific risk factors with data-backed severity levels.
2. PROTECTIVE FACTORS ANALYSIS: Based on HILDA research showing what helps single parents thrive, identify specific protective factors.
3. CONTEXTUAL INSIGHTS: Interpret their situation within the broader context of single parent experiences in Australia using HILDA data.
4. FINANCIAL STRESS ANALYSIS: Analyze financial stress using HILDA data and Victoria-specific context including available support.

Return JSON with ALL four sections: {
  "riskFactors": [
    {
      "category": "financial|housing|employment|social|wellbeing",
      "factor": "Specific risk factor description based on HILDA patterns",
      "severity": "low|medium|high|very_high",
      "hildaEvidence": "What HILDA data shows for similar profiles",
      "impactDescription": "How this specifically affects single parents"
    }
  ],
  "protectiveFactors": [
    {
      "category": "stability|financial|social|motivation|housing|wellbeing",
      "factor": "Specific protective factor based on HILDA success patterns",
      "strength": "low|medium|high|very_high",
      "hildaEvidence": "What HILDA data shows about this protective factor",
      "resilienceImpact": "How this specifically builds resilience for single parents"
    }
  ],
  "contextualInsights": {
    "situationContext": "2-3 sentences about where you fit in the broader single parent landscape, speaking directly to the parent using 'you' and 'your'",
    "uniqueFactors": ["3-4 specific factors that make your situation unique or typical"],
    "dataBasedHope": "Encouraging insight based on HILDA data trends for you",
    "realisticExpectations": "What the data suggests you can realistically expect",
    "keyOpportunities": ["2-3 specific opportunities your situation presents"],
    "housingInsight": "Specific insight about their housing type and its implications for their family wellbeing and stability, personalized to their exact housing situation"
  },
  "financialStress": {
    "level": "low|medium|high|very_high",
    "factors": ["Specific financial stressors based on their situation"],
    "victoriaFactors": ["Victoria-specific cost/support factors"], 
    "hildaComparison": "How they compare to similar HILDA profiles",
    "recommendations": ["Victoria-specific financial recommendations based on their exact situation"],
    "priorityActions": ["Top 3 immediate actions for Victoria"],
    "supportServices": ["Specific Victoria services they should access"],
    "expectedOutcomes": "Realistic outcomes with Victoria support"
  }
}
`;

  try {
    const analysis = await geminiValidateJson({
      prompt: consolidatedPrompt,
      jsonSchemaNote: "Return valid JSON object with ALL four analysis sections as specified",
      temperature: 0.3,
      maxOutputTokens: 8000
    });

    if (!analysis || !analysis.riskFactors || !analysis.protectiveFactors || !analysis.contextualInsights || !analysis.financialStress) {
      throw new Error('Gemini returned incomplete risk/context analysis');
    }

    return {
      riskFactors: analysis.riskFactors,
      protectiveFactors: analysis.protectiveFactors,
      contextualInsights: analysis.contextualInsights,
      financialStress: analysis.financialStress
    };
  } catch (error) {
    console.error('Consolidated risk/context analysis error:', error);
    throw new Error(`Failed to generate risk/context analysis: ${error.message}`);
  }
}

// CONSOLIDATED CALL 2: Journey & Prediction Analysis
async function generateConsolidatedJourneyAndPrediction(journeyData, hildaDatasets) {
  const {
    timeSince, stressLevel, employmentStatus, housingType, 
    supportNetworkStrength, incomeBracket, numberOfChildren, childAge,
    biggestChallenges, improvementGoals, previousAssessment
  } = journeyData;

  const similarProfiles = await findSimilarHildaProfiles(journeyData, hildaDatasets);
  const crossDatasetInsights = analyzeCrossDatasetPatterns(journeyData, hildaDatasets);

  const consolidatedPrompt = `
You are conducting comprehensive journey stage identification and predictive analysis for a single parent in Victoria, Australia using HILDA longitudinal data.

COMPLETE PARENT PROFILE:
- Journey Duration: ${timeSince.years} years, ${timeSince.months} months into single parenthood
- Family: ${numberOfChildren} children, youngest ${childAge === 0 ? 'under 1 year old' : childAge === 5 ? 'over 4 years old' : `${childAge} years old`}
- Current stress: ${stressLevel}/10
- Support network: ${supportNetworkStrength}/5
- Employment: ${employmentStatus}
- Housing: ${housingType}
- Income: ${incomeBracket}
- Main challenges: ${biggestChallenges.join(', ')}
- Goals: ${improvementGoals.join(', ')}

SIMILAR HILDA PROFILES: ${JSON.stringify(similarProfiles, null, 2)}
CROSS-DATASET INSIGHTS: ${JSON.stringify(crossDatasetInsights, null, 2)}

${previousAssessment ? `PREVIOUS ASSESSMENT FOR PROGRESS COMPARISON:
Previous (${Math.round((new Date() - new Date(previousAssessment.timestamp)) / (1000 * 60 * 60 * 24))} days ago):
- Stress: ${previousAssessment.stressLevel}/10
- Support: ${previousAssessment.supportNetworkStrength}/5
- Employment: ${previousAssessment.employmentStatus}
- Housing: ${previousAssessment.housingType}
- Challenges: ${previousAssessment.biggestChallenges?.join(', ') || 'Not specified'}
- Goals: ${previousAssessment.improvementGoals?.join(', ') || 'Not specified'}` : ''}

REQUIRED: Generate complete analysis for ALL components:

1. JOURNEY STAGE: Determine actual stage based on CURRENT FUNCTIONING (not just time elapsed). Someone with ${stressLevel}/10 stress and ${supportNetworkStrength}/5 support needs accurate staging.
2. TRAJECTORY PREDICTION: 6-month, 1-year, 2-year realistic Victoria-specific outlooks with milestones.
3. SUCCESS PROBABILITIES: Based on HILDA data, calculate realistic success rates for key interventions.
4. PREDICTIVE TIMELINE: What's achievable in 3, 6, 12, and 24 months with Victoria resources.
5. SITUATION SUMMARY: 3-4 sentence narrative summary of current life stage and circumstances.
${previousAssessment ? '6. PROGRESS SUMMARY: 2-3 sentence progress narrative comparing assessments.' : ''}

Return JSON with ALL required sections: {
  "currentStage": "crisis_adjustment|early_stabilization|active_rebuilding|established_resilience",
  "prediction": {
    "stageDescription": "Detailed description of what characterizes this specific stage",
    "sixMonthOutlook": "Realistic Victoria-specific prediction for next 6 months",
    "oneYearOutlook": "What to expect in 1 year with Victoria resources", 
    "twoYearOutlook": "Longer term outlook with available support systems",
    "keyMilestones": ["3-4 realistic milestones based on current situation"],
    "typicalChallenges": ["2-3 challenges specific to their circumstances"],
    "opportunityWindows": ["2-3 Victoria-specific opportunities based on current stage"],
    "stageRationale": "Why this stage was chosen based on HILDA data patterns"
  },
  "probabilities": {
    "housingStability": "X% success rate based on HILDA similar profiles",
    "mentalHealthSupport": "X% success rate for mental health interventions", 
    "employmentProgression": "X% success rate for employment/education goals",
    "financialStressReduction": "X% success rate for financial interventions",
    "socialSupportBuilding": "X% success rate for social connection building",
    "evidenceBase": "Summary of HILDA data supporting these rates",
    "victoriaModifiers": "How Victoria context affects these success rates"
  },
  "timeline": {
    "3months": "What's likely achievable in 3 months",
    "6months": "What's likely achievable in 6 months", 
    "12months": "What's likely achievable in 1 year",
    "24months": "What's likely achievable in 2 years"
  },
  "situationSummary": "3-4 sentence narrative capturing current life stage, challenges with empathy, strengths/progress, speaking directly using 'you' and 'your'"${previousAssessment ? ',\n  "progressSummary": "2-3 sentence progress narrative comparing two assessments, highlighting changes and maintaining encouraging tone"' : ''}
}
`;

  try {
    const analysis = await geminiValidateJson({
      prompt: consolidatedPrompt,
      jsonSchemaNote: "Return valid JSON object with ALL required analysis sections as specified",
      temperature: 0.3,
      maxOutputTokens: 8000
    });

    if (!analysis || !analysis.currentStage || !analysis.prediction || !analysis.probabilities || !analysis.timeline || !analysis.situationSummary) {
      throw new Error('Gemini returned incomplete journey/prediction analysis');
    }

    return {
      currentStage: analysis.currentStage,
      prediction: analysis.prediction,
      probabilities: analysis.probabilities,
      timeline: analysis.timeline,
      situationSummary: analysis.situationSummary,
      progressSummary: analysis.progressSummary || null
    };
  } catch (error) {
    console.error('Consolidated journey/prediction analysis error:', error);
    throw new Error(`Failed to generate journey/prediction analysis: ${error.message}`);
  }
}

// CONSOLIDATED CALL 3: Main Actions & Timeline Analysis
async function generateConsolidatedMainActions(journeyData, hildaDatasets, contextualInsights) {
  const {
    biggestChallenges, improvementGoals, employmentStatus, childcareUsage,
    housingType, numberOfChildren, supportNetworkStrength, timeSince,
    stressLevel, incomeBracket, childAge
  } = journeyData;

  const successPatterns = analyzeSuccessPatterns(journeyData, hildaDatasets);

  const consolidatedPrompt = `
You are creating intelligent action plans and timelines for a single parent in Victoria, Australia using HILDA research data.

COMPLETE PARENT PROFILE:
- Location: Based on HILDA survey area and available services data
- Journey: ${timeSince.years} years, ${timeSince.months} months into single parenthood
- Family: ${numberOfChildren} children, youngest ${childAge === 0 ? 'under 1 year old' : childAge === 5 ? 'over 4 years old' : `${childAge} years old`}
- Current stress: ${stressLevel}/10
- Support network: ${supportNetworkStrength}/5
- Employment: ${employmentStatus}
- Housing: ${housingType}
- Income: ${incomeBracket}
- Childcare: ${childcareUsage}
- Main challenges: ${biggestChallenges.join(', ')}
- Goals: ${improvementGoals.join(', ')}

HILDA DATABASE CONTEXT:
${JSON.stringify(successPatterns, null, 2)}

REQUIRED: Generate main action plan with timeline and milestones:
IMPORTANT: Include actions for ALL timeframes - at least 2-3 immediate actions, 2-3 short-term actions, and 2-3 long-term actions.

Return JSON: {
  "actions": [
    {
      "action": "Specific action based on HILDA success patterns",
      "description": "Detailed description with Victoria context", 
      "priority": "high|medium|low",
      "timeframe": "immediate|short-term|long-term",
      "successRate": "X% based on HILDA data",
      "dependencies": ["Prerequisites"],
      "expectedOutcome": "Research-backed outcome"
    }
  ],
  "nextSteps": {
    "week1": "Immediate priority action",
    "month1": "First month focus", 
    "month3": "Three month targets",
    "month6": "Six month achievements"
  },
  "milestones": [
    {
      "milestone": "Key achievement marker",
      "timeframe": "Realistic timeframe",
      "indicators": "Success indicators"
    }
  ]
}
`;

  try {
    const analysis = await geminiValidateJson({
      prompt: consolidatedPrompt,
      jsonSchemaNote: "Return valid JSON object with actions, nextSteps, and milestones",
      temperature: 0.3,
      maxOutputTokens: 8000
    });

    if (!analysis || !analysis.actions) {
      throw new Error('Gemini returned no valid action plan data');
    }

    return {
      actions: analysis.actions,
      nextSteps: analysis.nextSteps,
      milestones: analysis.milestones
    };
  } catch (error) {
    console.error('Main actions analysis error:', error);
    throw new Error(`Failed to generate action plan: ${error.message}`);
  }
}

// CONSOLIDATED CALL 4: Challenge & Goal Specific Actions
async function generateConsolidatedChallengeGoalActions(journeyData, hildaDatasets) {
  const {
    biggestChallenges, improvementGoals, employmentStatus,
    housingType, numberOfChildren, supportNetworkStrength, timeSince,
    stressLevel, incomeBracket, childAge
  } = journeyData;

  const challengeEvidence = await gatherChallengeEvidence(biggestChallenges, journeyData, hildaDatasets);
  const goalEvidence = await gatherGoalEvidence(improvementGoals, journeyData, hildaDatasets);

  const consolidatedPrompt = `
You are creating targeted actions for specific challenges and goals for a single parent in Victoria, Australia.

PARENT SITUATION:
- Journey: ${timeSince.years} years, ${timeSince.months} months into single parenthood
- Family: ${numberOfChildren} children, youngest ${childAge === 0 ? 'under 1 year old' : childAge === 5 ? 'over 4 years old' : `${childAge} years old`}
- Stress: ${stressLevel}/10, Support: ${supportNetworkStrength}/5
- Employment: ${employmentStatus}, Housing: ${housingType}, Income: ${incomeBracket}

CHALLENGES TO ADDRESS: ${biggestChallenges.join(', ')}
GOALS TO ACHIEVE: ${improvementGoals.join(', ')}

CHALLENGE EVIDENCE:
${JSON.stringify(challengeEvidence, null, 2)}

GOAL EVIDENCE:
${JSON.stringify(goalEvidence, null, 2)}

REQUIRED: Generate specific actions for challenges and goals:

Return JSON: {
  "challengeSpecificActions": [
    {
      "challenge": "Exact challenge name",
      "action": "Specific Victoria-based response",
      "evidenceBase": "HILDA success rate", 
      "urgency": "high|medium|low",
      "victoriaSpecific": "Specific Victoria resources/contacts",
      "timeline": "Realistic timeframe",
      "supportRequired": "Support needed"
    }
  ],
  "goalSpecificActions": [
    {
      "goal": "Exact goal name",
      "action": "Practical action plan", 
      "evidenceBase": "HILDA success data",
      "timeframe": "Realistic timeline",
      "localResources": "Programs and services from database",
      "firstStep": "Immediate action",
      "supportRequired": "Support needed",
      "successIndicators": "Progress markers"
    }
  ]
}
`;

  try {
    const analysis = await geminiValidateJson({
      prompt: consolidatedPrompt,
      jsonSchemaNote: "Return valid JSON with challengeSpecificActions and goalSpecificActions arrays",
      temperature: 0.3,
      maxOutputTokens: 8000
    });

    if (!analysis || (!analysis.challengeSpecificActions && !analysis.goalSpecificActions)) {
      throw new Error('Gemini returned no valid challenge/goal actions');
    }

    return {
      challengeSpecificActions: analysis.challengeSpecificActions,
      goalSpecificActions: analysis.goalSpecificActions
    };
  } catch (error) {
    console.error('Challenge/goal actions analysis error:', error);
    throw new Error(`Failed to generate challenge/goal actions: ${error.message}`);
  }
}


function extractRelevantHildaData(assessmentData, hildaDatasets) {
  // Return only raw database data 
  const { timeSince, childAge, numberOfChildren, employmentStatus } = assessmentData;
  
  return {
    userContext: {
      timeSince: timeSince,
      childAge: childAge,
      numberOfChildren: numberOfChildren,
      employmentStatus: employmentStatus
    },
    mentalHealthData: hildaDatasets.mentalHealthData?.find(
      row => row.year_from_onset === timeSince.years
    ) || null,
    housingData: hildaDatasets.housingData?.find(
      row => row.family_type === 'Single parent with dependent children'
    ) || null,
    childcareData: hildaDatasets.childcareData || []
  };
}

function analyzeCrossDatasetPatterns(assessmentData, hildaDatasets) {
  // Return only raw database patterns 
  const { timeSince, numberOfChildren, employmentStatus, incomeBracket, housingType } = assessmentData;

  return {
    userProfile: {
      timeSince: timeSince,
      numberOfChildren: numberOfChildren,
      employmentStatus: employmentStatus,
      incomeBracket: incomeBracket,
      housingType: housingType
    },
    mentalHealthPatterns: hildaDatasets.mentalHealthData?.find(
      row => row.year_from_onset <= timeSince.years
    ) || null,
    housingPatterns: hildaDatasets.housingData?.find(row => 
      row.family_type === 'Single parent with dependent children'
    ) || null,
    childcarePatterns: hildaDatasets.childcareData || []
  };
}

function analyzeSuccessPatterns(assessmentData, hildaDatasets) {
  // Return only raw HILDA database data 
  const { timeSince, numberOfChildren, employmentStatus, supportNetworkStrength } = assessmentData;
  
  return {
    mentalHealthData: hildaDatasets.mentalHealthData || [],
    housingData: hildaDatasets.housingData || [],
    childcareData: hildaDatasets.childcareData || [],
    userProfile: {
      journeyYears: timeSince.years,
      journeyMonths: timeSince.months,
      numberOfChildren,
      employmentStatus,
      supportNetworkStrength
    }
  };
}

async function findSimilarHildaProfiles(journeyData, hildaDatasets) {
  // Return only raw user data and database patterns 
  const { 
    timeSince, stressLevel, supportNetworkStrength, employmentStatus, 
    housingType, incomeBracket, numberOfChildren, childAge 
  } = journeyData;

  return {
    userProfile: {
      timeInJourney: timeSince.totalMonths,
      stressLevel: stressLevel,
      supportLevel: supportNetworkStrength,
      numberOfChildren: numberOfChildren,
      childAge: parseInt(childAge) || 0,
      employmentStatus: employmentStatus,
      housingType: housingType,
      incomeBracket: incomeBracket
    },
    hildaPatterns: {
      mentalHealthData: hildaDatasets.mentalHealthData || [],
      housingData: hildaDatasets.housingData || [],
      childcareData: hildaDatasets.childcareData || []
    }
  };
}

async function gatherChallengeEvidence(challenges, assessmentData, hildaDatasets) {
  // Return only database data and user challenges - no hardcoded service information
  const { incomeBracket, numberOfChildren, timeSince } = assessmentData;
  
  return {
    challengeTypes: challenges,
    userContext: {
      incomeBracket: incomeBracket,
      numberOfChildren: numberOfChildren,
      journeyYears: timeSince.years,
      journeyMonths: timeSince.months
    },
    hildaPatterns: {
      housingData: hildaDatasets.housingData?.filter(d => d.family_type?.includes('single')) || [],
      mentalHealthData: hildaDatasets.mentalHealthData?.filter(d => d.year_from_onset <= timeSince.years) || [],
      childcareData: hildaDatasets.childcareData || []
    }
  };
}

async function gatherGoalEvidence(goals, assessmentData, hildaDatasets) {
  // Return only database data and user goals 
  const { incomeBracket, employmentStatus, timeSince } = assessmentData;
  
  return {
    goalTypes: goals,
    userContext: {
      incomeBracket: incomeBracket,
      employmentStatus: employmentStatus,
      journeyYears: timeSince.years,
      journeyMonths: timeSince.months
    },
    hildaPatterns: {
      mentalHealthData: hildaDatasets.mentalHealthData?.filter(d => d.year_from_onset >= timeSince.years) || [],
      housingData: hildaDatasets.housingData?.filter(d => d.family_type?.includes('single')) || [],
      allHousingData: hildaDatasets.housingData || [],
      childcareData: hildaDatasets.childcareData || []
    }
  };
}


// MAIN JOURNEY MAPPING ENDPOINT

router.post("/journey", asyncHandler(async (req, res) => {
  const { 
    separationDate, 
    childAge, 
    numberOfChildren,
    housingType,
    employmentStatus,
    incomeBracket,
    childcareUsage,
    stressLevel,
    supportNetworkStrength,
    biggestChallenges,
    improvementGoals,
    previousAssessment
  } = req.body;
  
  // Input validation
  if (!separationDate || stressLevel === undefined || numberOfChildren === undefined) {
    return res.status(400).json({ 
      error: "Missing required fields: separationDate, numberOfChildren, stressLevel" 
    });
  }
  
  if (numberOfChildren < 1) {
    return res.status(400).json({ 
      error: "Single parents must have at least 1 child" 
    });
  }
  
  if (childAge === undefined || childAge === null) {
    return res.status(400).json({ 
      error: "Child age is required for single parents" 
    });
  }
  
  if (childAge !== null && childAge !== undefined && (childAge < 0 || childAge > 5)) {
    return res.status(400).json({ 
      error: "Child age must be between 0 and 5 (5 = older than 4 years)" 
    });
  }
  
  if (stressLevel < 1 || stressLevel > 10) {
    return res.status(400).json({ 
      error: "Stress level must be between 1 and 10" 
    });
  }

  try {
    const timeSince = calculateTimeSince(separationDate);
    
    const [mentalHealthData, childcareData, housingData] = await Promise.all([
      getMentalHealthData(timeSince),
      getChildcareCosts(), 
      getHousingStressData()
    ]);
    
    const comprehensiveAnalysis = await generateComprehensiveAnalysis({
      timeSince,
      childAge,
      numberOfChildren,
      housingType,
      employmentStatus,
      incomeBracket,
      childcareUsage,
      stressLevel,
      supportNetworkStrength,
      biggestChallenges,
      improvementGoals,
      previousAssessment,
      hildaDatasets: {
        mentalHealthData,
        childcareData,
        housingData
      }
    });
    
    // Generate frontend-compatible data objects from database
    const mentalHealthMatch = mentalHealthData.find(row => row.year_from_onset === timeSince.years) || {};
    
    // Get housing data for single parents and general population
    const singleParentHousing = housingData.find(row => row.family_type === 'Single parent with dependent children') || {};
    const generalPopHousing = housingData.find(row => row.family_type === 'All people') || {};
    
    // Get childcare data for single parents and couples (use most recent period)
    const singleParentChildcare = childcareData.find(row => row.subcategory === 'Single parents') || {};
    const coupleParentChildcare = childcareData.find(row => row.subcategory === 'Couple parents') || {};

    return res.json({
      success: true,
      userPosition: {
        timeSince: {
          years: timeSince.years,
          months: timeSince.months,
          totalMonths: timeSince.totalMonths
        },
        childAge,
        numberOfChildren,
        housingType,
        employmentStatus,
        incomeBracket,
        childcareUsage,
        stressLevel,
        supportNetworkStrength,
        biggestChallenges,
        improvementGoals,
        assessmentDate: new Date().toISOString()
      },
      comprehensiveAnalysis,
      mentalHealth: {
        singleParentChallengesPct: mentalHealthMatch.single_parent_pct ? parseFloat(mentalHealthMatch.single_parent_pct) : 0,
        populationChallengesPct: mentalHealthMatch.population_pct ? parseFloat(mentalHealthMatch.population_pct) : 0,
        userBetterThan: mentalHealthMatch.single_parent_pct 
          ? Math.max(0, 100 - parseFloat(mentalHealthMatch.single_parent_pct))
          : 0,
        isExactYearMatch: !!mentalHealthMatch.year_from_onset
      },
      childcare: {
        ageSpecificCost: singleParentChildcare.value ? parseFloat(singleParentChildcare.value) : null,
        singleParentAvgCost: singleParentChildcare.value ? parseFloat(singleParentChildcare.value) : null,
        coupleParentAvgCost: coupleParentChildcare.value ? parseFloat(coupleParentChildcare.value) : null,
        singleParentSavings: singleParentChildcare.value && coupleParentChildcare.value 
          ? Math.max(0, parseFloat(coupleParentChildcare.value) - parseFloat(singleParentChildcare.value))
          : null,
        isOlderThanFour: childAge > 4,
        note: childAge > 4 ? 'Childcare costs may be lower for older children' : null
      },
      housingStress: {
        singleParentStressPct: singleParentHousing.stress_pct ? parseFloat(singleParentHousing.stress_pct) : 0,
        allPeopleStressPct: generalPopHousing.stress_pct ? parseFloat(generalPopHousing.stress_pct) : 0,
        riskMultiplier: singleParentHousing.stress_pct && generalPopHousing.stress_pct 
          ? Math.round((parseFloat(singleParentHousing.stress_pct) / parseFloat(generalPopHousing.stress_pct)) * 10) / 10
          : 1.0,
        medianRent: null,
        affordabilityThreshold: 30
      },
      dataSource: "HILDA Survey Statistical Report 2024, Melbourne Institute, CC-BY 3.0 AU"
    });
    
  } catch (error) {
    console.error('Journey mapping error:', error);
    
    // Provide specific error messages based on error type
    if (error.message.includes('Incomplete analysis') || error.message.includes('Failed to generate')) {
      return res.status(500).json({ 
        error: "AI Analysis Unavailable",
        message: "Our AI analysis service is temporarily experiencing issues. Your data is secure, but we're unable to generate personalized insights right now. Please try again in a few minutes, or contact support if the problem persists.",
        suggestion: "You can still access general support resources while we restore full functionality."
      });
    }
    
    if (error.message.includes('HILDA') || error.message.includes('database')) {
      return res.status(500).json({ 
        error: "Data Service Temporarily Unavailable",
        message: "We're experiencing temporary issues accessing the HILDA research database that powers your personalized insights. Please try again in a few minutes.",
        suggestion: "For immediate support, visit your local family services center."
      });
    }
    
    // Generic fallback for other errors
    return res.status(500).json({ 
      error: "Service Temporarily Unavailable",
      message: "We're experiencing technical difficulties processing your assessment. Your information is secure. Please try again in a few minutes.",
      suggestion: "If this continues, you can access general single parent support resources."
    });
  }
}));

module.exports = router;