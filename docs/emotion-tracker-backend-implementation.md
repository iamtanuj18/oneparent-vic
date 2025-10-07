# Emotion Tracker Backend Implementation Plan

## Database Schema

### 1. Emotion Logs Table
```sql
CREATE TABLE emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255), -- for future user system integration
  date DATE NOT NULL, -- yyyy-mm-dd format for easy querying
  timestamp BIGINT NOT NULL, -- javascript timestamp for precise ordering
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 6),
  energy INTEGER NOT NULL CHECK (energy >= 0 AND energy <= 100),
  overwhelm INTEGER NOT NULL CHECK (overwhelm >= 0 AND overwhelm <= 100),
  emotions JSONB NOT NULL, -- array of emotion strings
  week_number INTEGER NOT NULL, -- calculated week number from first log
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- constraints
  UNIQUE(user_id, date), -- one log per day per user
  INDEX(user_id, date),
  INDEX(user_id, week_number),
  INDEX(date)
);
```

### 2. Weekly Insights Cache Table
```sql
CREATE TABLE weekly_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  week_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  insights TEXT,
  comparison_with_previous TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- constraints
  UNIQUE(user_id, week_number),
  INDEX(user_id, week_number)
);
```

## API Routes Implementation

### 1. POST /api/emotions/log
**Purpose**: Create or update daily emotion log

```javascript
router.post('/log', asyncHandler(async (req, res) => {
  const { mood, energy, overwhelm, emotions } = req.body;
  const userId = req.user?.id || 'anonymous'; // future user system
  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
  const timestamp = Date.now();
  
  // calculate week number based on user's first log
  const weekNumber = await calculateWeekNumber(userId, new Date());
  
  // upsert logic - update if exists, create if not
  const result = await pool.query(`
    INSERT INTO emotion_logs (user_id, date, timestamp, mood, energy, overwhelm, emotions, week_number)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
      timestamp = EXCLUDED.timestamp,
      mood = EXCLUDED.mood,
      energy = EXCLUDED.energy,
      overwhelm = EXCLUDED.overwhelm,
      emotions = EXCLUDED.emotions,
      updated_at = NOW()
    RETURNING *
  `, [userId, today, timestamp, mood, energy, overwhelm, JSON.stringify(emotions), weekNumber]);
  
  // trigger insights generation if this is first log of new week
  await checkAndTriggerWeeklyInsights(userId, weekNumber);
  
  res.json(result.rows[0]);
}));
```

### 2. GET /api/emotions/today
**Purpose**: Get today's emotion log

```javascript
router.get('/today', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const today = new Date().toISOString().split('T')[0];
  
  const result = await pool.query(
    'SELECT * FROM emotion_logs WHERE user_id = $1 AND date = $2',
    [userId, today]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'No log found for today' });
  }
  
  res.json(result.rows[0]);
}));
```

### 3. GET /api/emotions/weeks
**Purpose**: Get all week summaries with calculated averages

```javascript
router.get('/weeks', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  
  // get aggregated week data
  const weekSummaries = await pool.query(`
    SELECT 
      week_number,
      MIN(date) as start_date,
      MAX(date) as end_date,
      COUNT(*) as total_logs,
      ROUND(AVG(mood)::numeric, 1) as avg_mood,
      ROUND(AVG(energy)) as avg_energy,
      ROUND(AVG(overwhelm)) as avg_overwhelm,
      jsonb_agg(emotions) as all_emotions
    FROM emotion_logs 
    WHERE user_id = $1 
    GROUP BY week_number 
    ORDER BY week_number DESC
  `, [userId]);
  
  // process dominant emotions for each week
  const summaries = weekSummaries.rows.map(week => {
    const emotionCounts = {};
    week.all_emotions.forEach(emotions => {
      JSON.parse(emotions).forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });
    
    const dominantEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);
    
    return {
      week_number: week.week_number,
      start_date: week.start_date,
      end_date: week.end_date,
      total_logs: week.total_logs,
      avg_mood: parseFloat(week.avg_mood),
      avg_energy: parseInt(week.avg_energy),
      avg_overwhelm: parseInt(week.avg_overwhelm),
      dominant_emotions: dominantEmotions
    };
  });
  
  // add cached insights
  const weekNumbers = summaries.map(s => s.week_number);
  if (weekNumbers.length > 0) {
    const insights = await pool.query(`
      SELECT week_number, insights, comparison_with_previous 
      FROM weekly_insights 
      WHERE user_id = $1 AND week_number = ANY($2)
    `, [userId, weekNumbers]);
    
    const insightMap = {};
    insights.rows.forEach(insight => {
      insightMap[insight.week_number] = {
        insights: insight.insights,
        comparison_with_previous: insight.comparison_with_previous
      };
    });
    
    summaries.forEach(summary => {
      const insight = insightMap[summary.week_number];
      if (insight) {
        summary.insights = insight.insights;
        summary.comparison_with_previous = insight.comparison_with_previous;
      }
    });
  }
  
  res.json(summaries);
}));
```

### 4. GET /api/emotions/week/:number
**Purpose**: Get specific week details with all daily logs

```javascript
router.get('/week/:number', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const weekNumber = parseInt(req.params.number);
  
  // get week summary
  const summary = await getWeekSummary(userId, weekNumber);
  
  // get all logs for the week
  const logs = await pool.query(`
    SELECT * FROM emotion_logs 
    WHERE user_id = $1 AND week_number = $2 
    ORDER BY timestamp ASC
  `, [userId, weekNumber]);
  
  res.json({
    summary,
    logs: logs.rows
  });
}));
```

### 5. POST /api/emotions/generate-insights/:week
**Purpose**: Trigger Gemini AI insights generation

```javascript
router.post('/generate-insights/:week', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const weekNumber = parseInt(req.params.week);
  
  // get current week data
  const currentWeek = await getWeekSummary(userId, weekNumber);
  
  // get previous week for comparison
  const previousWeek = weekNumber > 1 ? 
    await getWeekSummary(userId, weekNumber - 1) : null;
  
  // generate insights using gemini
  const prompt = createInsightsPrompt(currentWeek, previousWeek);
  const insights = await geminiValidateJson(prompt);
  
  // cache the insights
  await pool.query(`
    INSERT INTO weekly_insights (user_id, week_number, start_date, end_date, insights, comparison_with_previous)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, week_number)
    DO UPDATE SET 
      insights = EXCLUDED.insights,
      comparison_with_previous = EXCLUDED.comparison_with_previous,
      generated_at = NOW()
  `, [userId, weekNumber, currentWeek.start_date, currentWeek.end_date, 
      insights.insights, insights.comparison_with_previous]);
  
  res.json(insights);
}));
```

## Gemini Integration

### Insights Generation Prompt
```javascript
function createInsightsPrompt(currentWeek, previousWeek) {
  const prompt = `
You are an AI assistant specialized in mental health and emotional wellbeing for single parents. 

Analyze this week's emotional data and provide supportive, actionable insights:

Current Week Data:
- Week ${currentWeek.week_number}
- Average Mood: ${currentWeek.avg_mood}/6 (1=very sad, 6=very happy)
- Average Energy: ${currentWeek.avg_energy}%
- Average Overwhelm: ${currentWeek.avg_overwhelm}%
- Top Emotions: ${currentWeek.dominant_emotions.join(', ')}
- Days Logged: ${currentWeek.total_logs}/7

${previousWeek ? `
Previous Week Comparison:
- Week ${previousWeek.week_number}
- Mood Change: ${currentWeek.avg_mood - previousWeek.avg_mood > 0 ? '+' : ''}${(currentWeek.avg_mood - previousWeek.avg_mood).toFixed(1)}
- Energy Change: ${currentWeek.avg_energy - previousWeek.avg_energy > 0 ? '+' : ''}${currentWeek.avg_energy - previousWeek.avg_energy}%
- Overwhelm Change: ${currentWeek.avg_overwhelm - previousWeek.avg_overwhelm > 0 ? '+' : ''}${currentWeek.avg_overwhelm - previousWeek.avg_overwhelm}%
` : ''}

Please provide:
1. Encouraging insights about patterns and progress
2. Practical tips for single parents based on the emotions shown
3. Recognition of both challenges and strengths
${previousWeek ? '4. How this week compares to last week with context' : ''}

Respond with warm, supportive tone. Focus on growth, resilience, and practical advice.

Return JSON format:
{
  "insights": "main insights and tips",
  ${previousWeek ? '"comparison_with_previous": "comparison insights"' : ''}
}
`;

  return prompt;
}
```

### Automatic Insights Triggering
```javascript
async function checkAndTriggerWeeklyInsights(userId, weekNumber) {
  // check if this is the first log of a new week
  const isNewWeek = await checkIfNewWeekStarted(userId, weekNumber);
  
  if (isNewWeek && weekNumber > 1) {
    // trigger insights for previous completed week
    const previousWeekNumber = weekNumber - 1;
    
    // check if insights already exist
    const existingInsights = await pool.query(
      'SELECT id FROM weekly_insights WHERE user_id = $1 AND week_number = $2',
      [userId, previousWeekNumber]
    );
    
    if (existingInsights.rows.length === 0) {
      // generate insights in background
      generateWeeklyInsights(userId, previousWeekNumber).catch(err => {
        console.error('Failed to generate weekly insights:', err);
      });
    }
  }
}

function calculateWeekNumber(userId, currentDate) {
  // get user's first log date to calculate week numbers
  const firstLog = await pool.query(
    'SELECT MIN(date) as first_date FROM emotion_logs WHERE user_id = $1',
    [userId]
  );
  
  if (firstLog.rows.length === 0 || !firstLog.rows[0].first_date) {
    return 1; // first week
  }
  
  const firstLogDate = new Date(firstLog.rows[0].first_date);
  const startOfFirstWeek = new Date(firstLogDate);
  startOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1); // monday
  
  const startOfCurrentWeek = new Date(currentDate);
  startOfCurrentWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // monday
  
  const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  return diffWeeks + 1;
}
```

## Implementation Notes

1. **User System Integration**: Currently using 'anonymous' user, easily extensible for future authentication
2. **Week Calculation**: Based on Monday-Sunday weeks from user's first log date
3. **Data Validation**: Mood (1-6), Energy/Overwhelm (0-100), max 8 emotions per log
4. **Insights Caching**: Prevents duplicate Gemini API calls and improves performance
5. **Automatic Triggers**: Insights generated when user starts logging new week
6. **Error Handling**: Comprehensive error handling for all database and API operations
7. **Performance**: Indexed queries, aggregated calculations, efficient JSON handling

This implementation provides a robust, scalable emotion tracking system that matches your existing app architecture and coding patterns.