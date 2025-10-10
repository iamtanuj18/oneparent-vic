const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../utils/asyncHandler");
const { geminiValidateJson } = require("../services/gemini");

// generate ai insights for weekly emotion data
router.post('/weekly-insights', asyncHandler(async (req, res) => {
  console.log('[Emotion Tracker] Weekly insights generation started');
  
  const { weekData, previousWeekData, emotionLogs } = req.body;
  
  if (!weekData || !emotionLogs || emotionLogs.length === 0) {
    return res.status(400).json({
      error: 'Missing required data: weekData and emotionLogs are required'
    });
  }
  
  try {
    const insights = await generateWeeklyInsights({
      weekData,
      previousWeekData,
      emotionLogs
    });
    
    console.log('[Emotion Tracker] Weekly insights generated successfully');
    
    res.json({
      success: true,
      insights,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Emotion Tracker] Weekly insights generation failed:', error.message);
    
    // handle errors like journey map does
    if (error.message.includes('Gemini') || error.message.includes('API')) {
      return res.status(503).json({
        error: 'AI service temporarily unavailable. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      error: 'Failed to generate weekly insights',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// use gemini ai to analyze weekly emotion patterns
async function generateWeeklyInsights({ weekData, previousWeekData, emotionLogs }) {
  console.log('[Emotion Insights] Starting AI analysis...');
  console.log('[Emotion Insights] Week data:', weekData?.weekNumber);
  console.log('[Emotion Insights] Previous week data:', previousWeekData ? `Week ${previousWeekData.weekNumber}` : 'None');
  
  // prepare emotion data for ai analysis
  const analysisData = prepareAnalysisData({ weekData, previousWeekData, emotionLogs });
  
  try {
    const insights = await geminiValidateJson({
      prompt: buildInsightsPrompt(analysisData),
      expectedKeys: [
        'weeklyOverview',
        'emotionalPatterns', 
        'keyInsights',
        'progressComparison',
        'personalizedTips',
        'concernAreas',
        'positiveHighlights',
        'nextWeekFocus'
      ],
      jsonSchemaNote: `Return a comprehensive JSON object with weekly emotion insights following this structure:
      {
        "weeklyOverview": "2-3 sentence summary of this week's emotional journey",
        "emotionalPatterns": ["pattern 1", "pattern 2", "pattern 3"],
        "keyInsights": ["insight 1", "insight 2", "insight 3"],
        "progressComparison": "comparison with previous week if available",
        "personalizedTips": ["tip 1", "tip 2", "tip 3"],
        "concernAreas": ["concern 1", "concern 2"] or [],
        "positiveHighlights": ["highlight 1", "highlight 2"],
        "nextWeekFocus": "suggestion for next week's focus"
      }`,
      maxRetries: 2,
      temperature: 0.6,
      maxOutputTokens: 1500
    });
    
    if (!insights || !insights.weeklyOverview || !insights.emotionalPatterns) {
      throw new Error('Gemini returned incomplete weekly insights analysis');
    }
    
    return insights;
    
  } catch (error) {
    console.error('[Emotion Insights] Gemini analysis failed:', error.message);
    throw error;
  }
}

// prepare emotion data for ai analysis
function prepareAnalysisData({ weekData, previousWeekData, emotionLogs }) {
  // calculate mood and emotion patterns
  const moodTrend = calculateMoodTrend(emotionLogs);
  const energyPattern = calculateEnergyPattern(emotionLogs);
  const overwhelmPattern = calculateOverwhelmPattern(emotionLogs);
  const emotionFrequency = calculateEmotionFrequency(emotionLogs);
  const sleepPattern = calculateSleepPattern(emotionLogs);
  const activityFrequency = calculateActivityFrequency(emotionLogs);
  
  return {
    weekSummary: {
      totalLogs: emotionLogs.length,
      averageMood: weekData.averageMood,
      averageEnergy: weekData.averageEnergy,
      averageOverwhelm: weekData.averageOverwhelm,
      averageSleep: weekData.averageSleep,
      sleepDataCount: weekData.sleepDataCount,
      topEmotions: weekData.topEmotions,
      topActivities: weekData.topActivities,
      startDate: weekData.startDate,
      endDate: weekData.endDate
    },
    patterns: {
      moodTrend,
      energyPattern,
      overwhelmPattern,
      emotionFrequency,
      sleepPattern,
      activityFrequency
    },
    previousWeek: previousWeekData ? {
      averageMood: previousWeekData.averageMood,
      averageEnergy: previousWeekData.averageEnergy,
      averageOverwhelm: previousWeekData.averageOverwhelm,
      averageSleep: previousWeekData.averageSleep,
      topEmotions: previousWeekData.topEmotions,
      topActivities: previousWeekData.topActivities
    } : null,
    dailyLogs: emotionLogs.map(log => ({
      date: log.date,
      mood: log.mood,
      energy: log.energy,
      overwhelm: log.overwhelm,
      emotions: log.emotions,
      sleepHours: log.sleepHours,
      activities: log.activities || []
    }))
  };
}

// build the prompt for gemini ai
function buildInsightsPrompt({ weekSummary, patterns, previousWeek, dailyLogs }) {
  const sleepInfo = weekSummary.sleepDataCount >= 5 ? 
    `- Average sleep: ${weekSummary.averageSleep.toFixed(1)} hours (based on ${weekSummary.sleepDataCount} days)` : 
    `- Sleep tracking: Only ${weekSummary.sleepDataCount} days logged (need 5+ for analysis)`;
  
  const activitiesInfo = weekSummary.topActivities?.length > 0 ? 
    `- Common activities: ${weekSummary.topActivities.join(', ')}` : 
    '- Activities: None logged this week';

  return `You are a supportive AI assistant helping single parents track their emotional wellbeing. Analyze this week's emotion data to provide encouraging, practical insights.

WEEK OVERVIEW:
- Period: ${weekSummary.startDate} to ${weekSummary.endDate}
- Total entries: ${weekSummary.totalLogs}
- Average mood: ${weekSummary.averageMood}/6 (1=low, 6=high)
- Average energy: ${weekSummary.averageEnergy}/100
- Average overwhelm: ${weekSummary.averageOverwhelm}/100
${sleepInfo}
- Common emotions: ${weekSummary.topEmotions.join(', ')}
${activitiesInfo}

DAILY ENTRIES:
${dailyLogs.map(log => {
  const sleepText = log.sleepHours !== undefined && log.sleepHours !== null ? `, Sleep: ${log.sleepHours}h` : '';
  const activitiesText = log.activities?.length > 0 ? `, Activities: [${log.activities.join(', ')}]` : '';
  return `${log.date}: Mood ${log.mood}/6, Energy ${log.energy}/100, Overwhelm ${log.overwhelm}/100${sleepText}, Felt: [${log.emotions.join(', ')}]${activitiesText}`;
}).join('\n')}

PATTERNS:
- Mood trend: ${patterns.moodTrend}
- Energy levels: ${patterns.energyPattern}
- Overwhelm levels: ${patterns.overwhelmPattern}
${weekSummary.sleepDataCount >= 5 ? `- Sleep pattern: ${patterns.sleepPattern}` : '- Sleep pattern: Insufficient data for analysis'}

${previousWeek ? `PREVIOUS WEEK:
- Mood was: ${previousWeek.averageMood}/6 (this week: ${weekSummary.averageMood}/6)
- Energy was: ${previousWeek.averageEnergy}/100 (this week: ${weekSummary.averageEnergy}/100)
- Overwhelm was: ${previousWeek.averageOverwhelm}/100 (this week: ${weekSummary.averageOverwhelm}/100)
${previousWeek.averageSleep ? `- Sleep was: ${previousWeek.averageSleep.toFixed(1)}h (this week: ${weekSummary.averageSleep ? weekSummary.averageSleep.toFixed(1) + 'h' : 'insufficient data'})` : ''}` : 'No previous week data available.'}

Please provide:
1. A brief, encouraging 2-sentence summary of their week
2. 3 simple observations about patterns you notice
3. 3 practical insights in simple language
4. ${previousWeek ? 'A simple comparison with last week' : 'A general observation about their journey'}
5. 3 gentle, practical tips for busy parents (NOT medical advice)
6. Any concerning patterns (or empty array if none)
7. 2 positive things from this week
8. One simple focus for next week

Keep language simple, supportive, and practical. Avoid medical terminology. Focus on everyday parenting challenges and solutions.`;
}

// figure out if mood got better or worse this week
function calculateMoodTrend(emotionLogs) {
  if (emotionLogs.length < 2) return 'insufficient data';
  
  const sortedLogs = emotionLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstHalf = sortedLogs.slice(0, Math.ceil(sortedLogs.length / 2));
  const secondHalf = sortedLogs.slice(Math.ceil(sortedLogs.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.mood, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.mood, 0) / secondHalf.length;
  
  const difference = secondHalfAvg - firstHalfAvg;
  
  if (difference > 0.5) return 'improving';
  if (difference < -0.5) return 'declining';
  return 'stable';
}

// check if energy levels were high, medium or low
function calculateEnergyPattern(emotionLogs) {
  if (emotionLogs.length === 0) return 'no data';
  
  const avgEnergy = emotionLogs.reduce((sum, log) => sum + log.energy, 0) / emotionLogs.length;
  
  if (avgEnergy >= 70) return 'high energy';
  if (avgEnergy >= 40) return 'moderate energy';
  return 'low energy';
}

// see how overwhelmed they felt this week
function calculateOverwhelmPattern(emotionLogs) {
  if (emotionLogs.length === 0) return 'no data';
  
  const avgOverwhelm = emotionLogs.reduce((sum, log) => sum + log.overwhelm, 0) / emotionLogs.length;
  
  if (avgOverwhelm >= 70) return 'high overwhelm';
  if (avgOverwhelm >= 40) return 'moderate overwhelm';
  return 'low overwhelm';
}

// count which emotions happened most often
function calculateEmotionFrequency(emotionLogs) {
  const frequency = {};
  
  emotionLogs.forEach(log => {
    log.emotions.forEach(emotion => {
      frequency[emotion] = (frequency[emotion] || 0) + 1;
    });
  });
  
  // give back the top 5 most common emotions
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .reduce((acc, [emotion, count]) => {
      acc[emotion] = count;
      return acc;
    }, {});
}

// analyze sleep patterns
function calculateSleepPattern(emotionLogs) {
  const logsWithSleep = emotionLogs.filter(log => log.sleepHours !== undefined && log.sleepHours !== null);
  
  if (logsWithSleep.length === 0) return 'no sleep data';
  
  const avgSleep = logsWithSleep.reduce((sum, log) => sum + log.sleepHours, 0) / logsWithSleep.length;
  
  if (avgSleep >= 8) return 'good sleep (8+ hours)';
  if (avgSleep >= 6.5) return 'adequate sleep (6.5-8 hours)';
  if (avgSleep >= 5) return 'limited sleep (5-6.5 hours)';
  return 'insufficient sleep (<5 hours)';
}

// count which activities happened most often
function calculateActivityFrequency(emotionLogs) {
  const frequency = {};
  
  emotionLogs.forEach(log => {
    (log.activities || []).forEach(activity => {
      frequency[activity] = (frequency[activity] || 0) + 1;
    });
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .reduce((acc, [activity, count]) => {
      acc[activity] = count;
      return acc;
    }, {});
}

module.exports = router;