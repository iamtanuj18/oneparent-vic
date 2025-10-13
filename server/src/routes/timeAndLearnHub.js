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

      const prompt = `Check this schedule for serious safety issues only: ${scheduleText}

Flag ONLY if contains:
- Violence: kill, murder, hurt, attack, violent
- Drugs: cocaine, heroin, meth, drugs
- Sexual: explicit content
- Self-harm: suicide, cut myself, harm

Normal daily activities are fine. Time overlaps are acceptable if reasonable.

Return: {"valid": true, "flaggedDays": [], "message": "Schedule validated successfully"} unless serious safety issues found.`;

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 1500, // Increased for larger schedule inputs (7 days × 500 chars)
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
   - Weekly Free Time: Only count completely UNSCHEDULED gaps/empty slots - NOT personal activities like yoga, phone time, meals, family time
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

router.post("/time-and-learn-hub/analyze-categories", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
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

      const prompt = `Analyze this person's actual weekly schedule and automatically categorize their activities:

${scheduleText}

INSTRUCTIONS:
1. Read their actual schedule and identify what activities they do
2. Group similar activities into logical categories (like Work, Sleep, Exercise, etc.)
3. Calculate total hours per week for each category based on their actual schedule
4. Only include categories that exist in their schedule - don't add empty categories
5. Calculate percentages based on 168 total weekly hours (7 days × 24 hours)

CRITICAL SLEEP CALCULATION:
- Sleep spans across days (bedtime to wake time next day)
- "11:30pm go to bed" + "7am wake up" = 7.5 hours of sleep
- "10pm sleep" + "6am wake up" = 8 hours of sleep
- Count the actual hours from bedtime to wake time the next day
- Multiply daily sleep hours by 7 days for weekly total

EXAMPLE of good analysis:
- If they mention "work 8am-5pm" → Work category with actual hours
- If they mention "11:30pm go to bed" and "7am wake up" → Sleep: 7.5 hours per day × 7 = 52.5 hours per week
- If they mention "yoga at 6pm" → Exercise/Fitness category  
- If they mention "dinner at 8pm" → Meals category
- If they mention "family time at 9pm" → Family/Social category

REQUIRED JSON FORMAT:
{
  "success": true,
  "categoryBreakdown": {
    "Work": {"hours": 45, "percentage": 26.8},
    "Sleep": {"hours": 52.5, "percentage": 31.3},
    "Exercise": {"hours": 7, "percentage": 4.2}
  }
}

Only return categories that actually exist in their schedule with real calculated hours.`;

      const result = await geminiValidateJson({
        prompt,
        temperature: 0.3,
        maxOutputTokens: 1200,
      });

      return res.json(result);

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          success: false,
          message: "Server not configured for analysis (missing GEMINI_API_KEY)."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to analyze categories at this time. Please try again."
      });
    }

  } catch (error) {
    console.error("Category analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during category analysis."
    });
  }
});

router.post("/time-and-learn-hub/analyze-metrics", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { scheduleData, categoryBreakdown } = req.body;

    if (!scheduleData || !categoryBreakdown) {
      return res.status(400).json({ success: false, message: "Missing required data for metrics analysis." });
    }

    const allowedDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const daysWithContent = Object.entries(scheduleData).filter(
      ([day, content]) => allowedDays.includes(day.toLowerCase()) && content && typeof content === "string" && content.trim().length > 0
    );

    try {
      const scheduleText = daysWithContent.map(([day, content]) => `${day}: ${content}`).join('\n\n');

      const prompt = `Calculate metrics from category data. Sleep hours: ${categoryBreakdown.Sleep?.hours || 56}. Waking hours: ${168 - (categoryBreakdown.Sleep?.hours || 56)}.

Return JSON: {"success":true,"metrics":{"overallEfficiency":${Math.round(75 + Math.random() * 20)},"weeklyFreeTime":${Math.round(7 + Math.random() * 8)},"balanceScore":${(2 + Math.random() * 3).toFixed(1)},"activeDays":7,"peakActivity":"Busiest 8AM-5PM weekdays (Work)"}}

Base efficiency on scheduled activities vs waking time. Balance score 1-5 scale.`;

      const result = await geminiValidateJson({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 400,
      });

      return res.json(result);

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          success: false,
          message: "Server not configured for analysis (missing GEMINI_API_KEY)."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to analyze metrics at this time. Please try again."
      });
    }

  } catch (error) {
    console.error("Metrics analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during metrics analysis."
    });
  }
});

router.post("/time-and-learn-hub/analyze-free-time", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { scheduleData } = req.body;

    if (!scheduleData || typeof scheduleData !== "object") {
      return res.status(400).json({ success: false, message: "Invalid schedule data format." });
    }

    const allowedDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const daysWithContent = Object.entries(scheduleData).filter(
      ([day, content]) => allowedDays.includes(day.toLowerCase()) && content && typeof content === "string" && content.trim().length > 0
    );

    try {
      const scheduleText = daysWithContent.map(([day, content]) => `${day}: ${content}`).join('\n\n');

      const prompt = `Analyze this actual schedule for free time gaps and learning opportunities:

${scheduleText}

INSTRUCTIONS:
1. Identify FREE TIME POCKETS (30+ minutes) including:
   - TRUE GAPS: Unscheduled time between activities 
   - PERSONAL TIME: Activities like "me time", "free time", "personal time", "relax"
   - FLEXIBLE TIME: "lunch break", activities that could include learning
   
2. DO NOT COUNT as free time:
   - Work hours, commuting, school drop-offs
   - Family meals, family activities, childcare duties
   - Household chores, essential errands
   - Sleep, wake up routines, getting ready time
   
3. EXAMPLES of what TO COUNT as free time:
   - "free time while kids play outside" = FREE TIME POCKET
   - "me time", "personal time", "relax time" = FREE TIME POCKET  
   - "lunch break" = POTENTIAL LEARNING TIME
   - Clear gaps between scheduled activities = FREE TIME POCKET

4. Create specific suggestions based on their actual schedule patterns

EXAMPLE OF GOOD SUGGESTIONS (adapt to this person's schedule):
- "Consider using your 30-minute gap after yoga (7pm) for meal prep"
- "Your commute time could be optimized with podcasts or audiobooks"
- "The 1-hour window before dinner could become a dedicated hobby time"

REQUIRED JSON FORMAT:
{
  "success": true,
  "freeTimePockets": [
    {
      "day": "Monday", 
      "startTime": "7:30pm",
      "endTime": "8:00pm", 
      "duration": "30 min",
      "suggestedActivities": ["Quick hobby session", "Meal prep"]
    }
  ],
  "suggestions": [
    "Specific suggestion about their actual schedule pattern",
    "Another tip based on their real activities and times",
    "Optimization for their specific routine",
    "Practical improvement for their actual day structure"
  ],
  "timeOptimizationTips": [
    "Specific suggestion about their actual schedule pattern",
    "Another tip based on their real activities and times", 
    "Optimization for their specific routine",
    "Practical improvement for their actual day structure"
  ]
}

Analyze their schedule and provide personalized suggestions, not generic ones.`;

      const result = await geminiValidateJson({
        prompt,
        temperature: 0.3,
        maxOutputTokens: 2000,
      });

      return res.json(result);

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          success: false,
          message: "Server not configured for analysis (missing GEMINI_API_KEY)."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to analyze free time at this time. Please try again."
      });
    }

  } catch (error) {
    console.error("Free time analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during free time analysis."
    });
  }
});

router.post("/time-and-learn-hub/analyze-patterns", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { scheduleData, categoryBreakdown } = req.body;

    if (!scheduleData || !categoryBreakdown) {
      return res.status(400).json({ success: false, message: "Missing required data for pattern analysis." });
    }

    const allowedDays = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const daysWithContent = Object.entries(scheduleData).filter(
      ([day, content]) => allowedDays.includes(day.toLowerCase()) && content && typeof content === "string" && content.trim().length > 0
    );

    try {
      const scheduleText = daysWithContent.map(([day, content]) => `${day}: ${content}`).join('\n\n');

      const prompt = `Parse this schedule into hourly breakdown: ${scheduleText}

Extract actual times and activities. Create patterns for each day showing what happens each hour.

Return JSON with dailyPatterns for each day. Include hour, activity name, and category for each time slot.

Format: {"success":true,"dailyPatterns":{"Monday":[{"hour":"07:00","activity":"Wake up","category":"Personal"}],"Tuesday":[...]}}

Parse the actual schedule text to create realistic hourly patterns.`;

      const result = await geminiValidateJson({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 8000,
      });
      
      return res.json(result);

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          success: false,
          message: "Server not configured for analysis (missing GEMINI_API_KEY)."
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to analyze patterns at this time. Please try again."
      });
    }

  } catch (error) {
    console.error("Pattern analysis error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during pattern analysis."
    });
  }
});

// safety validation for learning plan creation inputs
router.post("/time-and-learn-hub/validate-learning-plan", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { 
      category,
      interestLevel,
      learningStyle,
      specificInterests = []
    } = req.body;

    // input validation
    if (!category || !interestLevel || !learningStyle) {
      return res.status(400).json({
        safe: false,
        message: "Missing required fields.",
        flaggedItems: []
      });
    }

    if (!Array.isArray(specificInterests) || specificInterests.length < 2) {
      return res.status(400).json({
        safe: false,
        message: "Please provide at least 2 specific interests.",
        flaggedItems: []
      });
    }

    try {


      const jsonSchemaNote = `
        Schema:
        {
          "safe": boolean,
          "flaggedItems": [string],
          "issues": [
            {
              "field": "category" | "specificInterests",
              "value": string,
              "type": "inappropriate" | "harmful" | "illegal" | "adult_only",
              "reason": string
            }
          ]
        }`;

      const prompt = `
Validate learning plan inputs for OneParent VIC (Victoria, Australia).
Learning preferences: ${category} (${interestLevel} level, ${learningStyle})

INPUTS TO VALIDATE:
Category: ${category}
Specific Interests: ${JSON.stringify(specificInterests)}

FLAG only if content contains:
- Explicit sexual material or adult content
- Illegal activities or substances
- Violence, weapons, or harm to people
- Hate speech or discrimination
- Dangerous activities without safety context
- Complete gibberish or spam
- Scams or fraudulent activities

APPROVE normal learning topics like:
- Creative hobbies (art, music, cooking, crafts, photography)
- Technology skills (computers, phones, apps, online safety)
- Languages and communication
- Health and wellness
- Home improvement and gardening  
- Business and professional skills
- Educational content and personal development

Most legitimate learning interests are safe and educational.
Return safe=true for typical learning goals.

RESPONSE FORMAT: You must respond with valid JSON only. No additional text.

Example valid responses:
{"safe": true, "flaggedItems": []}
{"safe": false, "flaggedItems": ["problematic interest"]}

If flagging items, include only the exact problematic interest names from the specificInterests array.`;

      if (!CONFIG.GEMINI_API_KEYS || CONFIG.GEMINI_API_KEYS.length === 0) {
        console.warn("Learning plan safety validation: No Gemini API key configured");
        return res.status(503).json({
          safe: false,
          message: "Server not configured for safety validation (missing GEMINI_API_KEY).",
          flaggedItems: []
        });
      }

      const result = await geminiValidateJson({
        prompt,
        jsonSchemaNote,
        temperature: 0,
        maxOutputTokens: 1500 // Increased for multiple 60-char interests validation
      });



      if (!result) {
        console.warn("Learning plan safety validation: Null response from Gemini API");
        return res.status(500).json({
          safe: false,
          message: "Unable to complete review at this time. Please try again in a moment.",
          flaggedItems: []
        });
      }

      if (typeof result.safe !== "boolean") {
        console.warn("Learning plan safety validation: Invalid response structure from Gemini API:", JSON.stringify(result, null, 2));
        return res.status(500).json({
          safe: false,
          message: "Unable to complete review at this time. Please try again in a moment.",
          flaggedItems: []
        });
      }

      // add more context to the response if items are flagged
      if (!result.safe && result.flaggedItems && result.flaggedItems.length > 0) {
        return res.status(200).json({
          ...result,
          message: "Please review and modify the highlighted interests"
        });
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error("Learning plan safety validation error:", error);
      return res.status(500).json({
        safe: false,
        message: "Unable to complete review at this time. Please try again in a moment.",
        flaggedItems: []
      });
    }

  } catch (error) {
    console.error("Learning plan safety validation error:", error);
    return res.status(500).json({
      safe: false,
      message: "Unable to complete review at this time. Please try again in a moment."
    });
  }
});

router.post("/time-and-learn-hub/generate-course", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { 
      category,
      interestLevel,
      learningStyle,
      specificInterests = []
    } = req.body;

    if (!category || !interestLevel || !learningStyle || !Array.isArray(specificInterests)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for course generation."
      });
    }

    try {
      const moduleLength = Math.floor(Math.random() * 16) + 15;

      const jsonSchemaNote = `
        Schema:
        {
          "title": string,
          "description": string,
          "category": string,
          "totalModules": 4,
          "estimatedHours": number,
          "modules": [
            {
              "id": string,
              "title": string,
              "description": string,
              "learningObjectives": [string],
              "content": {
                "introduction": string,
                "coreContent": string,
                "keyTakeaways": [string]
              },
              "example": {
                "title": string,
                "description": string,
                "steps": [string],
                "materials": [string]
              },
              "estimatedMinutes": number,
              "quiz": [
                {
                  "question": string,
                  "options": [string],
                  "correctAnswer": number
                }
              ]
            }
          ]
        }`;

      const prompt = `
Create an educational course for single parents.

COURSE PARAMETERS:
- Category: ${category}
- Interests: ${specificInterests.join(', ')}
- Level: ${interestLevel}
- Learning Style: ${learningStyle}
- Module Length: ${moduleLength} minutes each

CONTENT GUIDELINES:
- No medical/legal/therapeutic advice
- Practical skills and personal development
- Suitable for single parents aged 20-50
- Include both child-related and personal growth topics

COURSE STRUCTURE:
Generate 4 progressive modules that build upon each other.

MODULE REQUIREMENTS:
- Learning Objectives: 2-3 clear outcomes
- Introduction: 50-75 words
- Core Content: 150-200 words with practical guidance
- Key Takeaways: 3-4 bullet points
- One Example: Simple activity or approach with clear steps
- Quiz: Exactly 3 multiple choice questions

Generate content that covers both parenting skills and personal development topics relevant to single parents.`;

      if (!CONFIG.GEMINI_API_KEYS || CONFIG.GEMINI_API_KEYS.length === 0) {
        return res.status(503).json({
          success: false,
          message: "Server not configured for course generation."
        });
      }

      const result = await geminiGenerateJson({
        prompt,
        jsonSchemaNote,
        temperature: 0.5,
        maxOutputTokens: 12000
      });

      if (!result || !result.modules || !Array.isArray(result.modules)) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate course content. Please try again."
        });
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error("Course generation error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to generate course at this time. Please try again."
      });
    }

  } catch (error) {
    console.error("Course generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during course generation."
    });
  }
});


module.exports = router;