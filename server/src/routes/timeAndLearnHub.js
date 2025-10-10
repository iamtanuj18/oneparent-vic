const express = require("express");
const chrono = require("chrono-node");
const router = express.Router();
const { CONFIG } = require("../config");

// middleware for enhanced protection on endpoints
const { strictLimiter } = require("../middleware/rateLimit");
const { aiGenerationBruteForce } = require("../middleware/bruteForceProtection");

const { geminiValidateJson, geminiGenerateJson } = require("../services/gemini");

// validate schedule inputs for safety and completeness
router.post("/time-and-learn-hub/validate-schedule", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { scheduleData } = req.body;

    if (!scheduleData || typeof scheduleData !== "object") {
      return res.status(400).json({ valid: false, message: "Invalid schedule data format.", flaggedDays: [] });
    }

    const allowedDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

    const daysWithContent = Object.entries(scheduleData).filter(
      ([day, content]) => allowedDays.includes(day.toLowerCase()) && content && typeof content === "string" && content.trim().length > 0
    );

    if (daysWithContent.length === 0) {
      return res.status(400).json({ valid: false, message: "Please provide schedule information for at least one valid day.", flaggedDays: [] });
    }

    const prelimFlagged = [];
    daysWithContent.forEach(([day, content]) => {
      const times = chrono.parse(content);
      if (times.length === 0) prelimFlagged.push({ day, issues: ["missing_times"], type: "missing_times" });
      else if (content.trim().split(/\s+/).length < 4) prelimFlagged.push({ day, issues: ["insufficient_detail"], type: "insufficient_detail" });
    });

    if (prelimFlagged.length > 0) {
      return res.status(400).json({ valid: false, message: "Please add detailed time entries for the flagged days.", flaggedDays: prelimFlagged });
    }

    try {
      const jsonSchemaNote = `
        Schema:
        {
          "valid": boolean,
          "flaggedDays": [
            {
              "day": string,
              "issues": [string],
              "type": "harmful" | "time_conflict" | "nonsensical"
            }
          ],
          "message": string
        }`;

      const scheduleText = daysWithContent.map(([day, content]) => `${day}: ${content}`).join('\n\n');

      const prompt = `
COMPREHENSIVE SCHEDULE VALIDATOR

SCHEDULE DATA:
${scheduleText}

VALIDATION CHECKS:

1. SAFETY - Flag dangerous content:
   - Violence: "kill", "murder", "hurt", "attack"
   - Drugs: "cocaine", "heroin", "meth"
   - Sexual: "porn", "sex", "fuck"
   - Self-harm: "suicide", "cut myself"

2. TIME CONFLICTS - Flag timing issues:
   - Same time: "8am wake up, 8am breakfast, 8am work"
   - Invalid times: "25am", "13pm"
   - Impossible order: "11pm work, 10pm dinner"

3. NONSENSICAL - Flag meaningless content:
   - Pure gibberish: "jhfgdsf sdfhsdfh"
   - No logical activities: "abc xyz 123"

RESPONSE RULES:
- All good: {"valid": true, "flaggedDays": [], "message": "Schedule validated successfully"}
- Safety issue: {"valid": false, "flaggedDays": [{"day": "monday", "issues": ["violent language: kill, murder"], "type": "harmful"}], "message": "Violent language detected. Please review and remove harmful content for the following days:"}
- Time conflicts: {"valid": false, "flaggedDays": [{"day": "wednesday", "issues": ["multiple activities at 8am"], "type": "time_conflict"}], "message": "Timing conflicts detected. Please fix scheduling issues for the following days:"}
- Nonsensical: {"valid": false, "flaggedDays": [{"day": "thursday", "issues": ["gibberish text"], "type": "nonsensical"}], "message": "Unclear content detected. Please provide meaningful schedule entries for the following days:"}

MESSAGE EXAMPLES:
- Violence: "Violent language detected. Please review and remove harmful content for the following days:"
- Sexual: "Inappropriate sexual content detected. Please review and remove harmful content for the following days:"
- Drugs: "Drug references detected. Please review and remove harmful content for the following days:"
- Self-harm: "Self-harm content detected. Please review and remove harmful content for the following days:"

The message should clearly state WHAT was detected first, then ask to review/remove for the days.

Approve normal schedules with reasonable time flow. Flag only clear problems.
`.trim();

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 3000,
      });

      if (!result || typeof result.valid !== 'boolean') {
        throw new Error("Invalid validation response format");
      }

      if (result.valid === false) {
        let flaggedDays = Array.isArray(result.flaggedDays) ? result.flaggedDays : [];
        
        if (flaggedDays.length === 0) {
          Object.keys(scheduleData).forEach(dayKey => {
            flaggedDays.push({
              day: dayKey,
              issues: [result.message || "Content flagged by validation system"],
              type: "insufficient_detail"
            });
          });
        }
        
        return res.status(400).json({ 
          valid: false,
          flaggedDays,
          message: result.message || "Schedule needs review before analysis."
        });
      }

      return res.json({ 
        valid: true,
        message: "Schedule validated successfully",
        flaggedDays: []
      });

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          valid: false,
          message: "Server not configured for schedule validation (missing GEMINI_API_KEY).",
          flaggedDays: []
        });
      }

      return res.status(500).json({
        valid: false,
        message: "Unable to validate schedule at this time. Please try again.",
        flaggedDays: []
      });
    }

  } catch (error) {
    console.error("Schedule validation error:", error);
    return res.status(500).json({
      valid: false,
      message: "Server error during validation.",
      flaggedDays: []
    });
  }
});

router.post("/time-and-learn-hub/analyze-schedule", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { scheduleData } = req.body;

    if (!scheduleData || typeof scheduleData !== "object") {
      return res.status(400).json({ success: false, message: "Invalid schedule data format." });
    }

    const allowedDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const daysWithContent = Object.entries(scheduleData).filter(
      ([day, content]) => allowedDays.includes(day.toLowerCase()) && content && typeof content === "string" && content.trim().length > 0
    );

    if (daysWithContent.length === 0) {
      return res.status(400).json({ success: false, message: "No valid schedule data provided." });
    }

    try {
      const scheduleText = daysWithContent.map(([day, content]) => `${day}: ${content}`).join('\n\n');

      const prompt = `
SCHEDULE ANALYZER

SCHEDULE DATA:
${scheduleText}

ANALYSIS REQUIREMENTS:

1. CATEGORIZE ACTIVITIES:
   - Group activities: Work, Childcare, Personal, Sleep, Exercise, Meals, Commute, Household, Learning, Social, Other
   - Calculate total hours per category

2. FIND FREE TIME POCKETS (Max 9):
   - Identify gaps between activities (minimum 30 minutes)
   - For each pocket, suggest 3-4 specific activities based on:
     * Duration (short activities for <1h, deeper learning for 1h+)
     * Time of day (energetic activities for morning, relaxing for evening)
     * Context (work breaks vs weekend leisure)
   - Format with suggestions: 
     {
       "day": "Monday",
       "startTime": "2:00pm", 
       "endTime": "3:30pm",
       "duration": "1.5 hours",
       "suggestedActivities": [
         "Complete a course module",
         "Meal prep", 
         "Creative hobby time"
       ]
     }

4. DAILY PATTERNS:
   - Hour-by-hour breakdown for each day (6AM-11PM)
   - Show dominant activity per time slot
   - Use categories: Work, Childcare, Personal, Sleep, Exercise, Meals, Commute, Household, Learning, Social, Free

5. OPTIMIZATION SUGGESTIONS (4-6 suggestions):
   - Analyze schedule for improvement opportunities
   - Focus on efficiency, balance, and learning opportunities
   - Be specific and actionable

6. TIME OPTIMIZATION TIPS (3-4 tips):
   - Provide general time management insights based on schedule patterns
   - Focus on practical improvements like batching, energy management, consistency
   - Keep professional tone, no emojis or decorative language

3. CALCULATE METRICS:
   - Overall Efficiency (60-100%): (Scheduled Hours / Total Waking Hours) * 100
     * Total Waking Hours = 168 - Sleep Hours (assume 8 hours/day if not specified)
     * Higher = more structured schedule
   - Weekly Free Time: Total unscheduled waking hours
   - Balance Score (1-5): Based on work-life balance
     * 5 = Excellent balance (work ≤40hrs, good personal/family time)
     * 4 = Good balance (work 40-50hrs, decent personal time)
     * 3 = Fair balance (work 50-60hrs, limited personal time)
     * 2 = Poor balance (work >60hrs, minimal personal time)
     * 1 = No balance (excessive work, no personal time)
   - Active Days: Days with scheduled activities
   - Peak Activity: Busiest time periods description

RESPONSE FORMAT (JSON):
{
  "success": true,
  "analysis": {
    "categoryBreakdown": {
      "Work": { "hours": 40, "percentage": 23.8 },
      "Childcare": { "hours": 35, "percentage": 20.8 }
    },
    "metrics": {
      "overallEfficiency": 85,
      "weeklyFreeTime": 12,
      "balanceScore": 4.2,
      "activeDays": 7,
      "peakActivity": "Busiest: 9AM-5PM weekdays"
    },
    "freeTimePockets": [
      {
        "day": "Monday",
        "startTime": "2:00pm",
        "endTime": "3:30pm",
        "duration": "1.5 hours",
        "suggestedActivities": [
          "Complete a course module",
          "Meal prep",
          "Creative hobby time"
        ]
      }
    ],
    "dailyPatterns": {
      "Monday": [
        { "hour": "09:00", "activity": "Work", "category": "Work" },
        { "hour": "14:00", "activity": "Free", "category": "Free" }
      ],
      "Tuesday": [
        { "hour": "09:00", "activity": "Work", "category": "Work" }
      ]
    },
    "suggestions": [
      "Consider batching similar tasks together for better efficiency",
      "Your Wednesday lunch break could be used for a quick learning session",
      "Weekend mornings show consistent free time - perfect for longer courses"
    ],
    "timeOptimizationTips": [
      "Use longer slots (1+ hours) for focused learning and skill development",
      "Regular daily slots work better than sporadic long sessions",
      "Turn short breaks (15-30 min) into micro-learning opportunities"
    ]
  }
}

Be concise and accurate.
`.trim();

      const result = await geminiGenerateJson({
        prompt,
        temperature: 0.3,
        maxOutputTokens: 12000,
      });

      // geminiGenerateJson already returns parsed JSON
      const analysisData = result;

      if (!analysisData.success || !analysisData.analysis) {
        throw new Error("Analysis failed");
      }

      return res.json(analysisData);

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          success: false,
          message: "Server not configured for schedule analysis (missing GEMINI_API_KEY)."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to analyze schedule at this time. Please try again."
      });
    }

  } catch (error) {
    console.error("Schedule analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during analysis."
    });
  }
});

module.exports = router;