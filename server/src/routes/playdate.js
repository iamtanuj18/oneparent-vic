
const express = require("express");
const router = express.Router();
const { CONFIG } = require("../config");

// middleware for enhanced protection on ai endpoints
const { strictLimiter } = require("../middleware/rateLimit");
const { aiGenerationBruteForce } = require("../middleware/bruteForceProtection");

// ai and utility services
const { geminiValidateJson, geminiGenerateJson } = require("../services/gemini");
const { getWeatherContext } = require("../utils/weather");

// safety validation for parent-only activities
router.post("/playdate/myself/safetychecks", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { 
      interests = [], 
      goals = [], 
      customIdea = "", 
      parentAge, 
      activityEnergyLevel 
    } = req.body;

    // input validation
    if (!Array.isArray(interests) || !Array.isArray(goals)) {
      return res.status(400).json({
        safe: false,
        message: "Invalid input format.",
        flaggedItems: []
      });
    }

    if (!interests.length && !goals.length) {
      return res.status(400).json({
        safe: false,
        message: "Please provide at least one interest or goal.",
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
              "field": "interests" | "goals",
              "value": string,
              "index": number,
              "type": "inappropriate" | "gibberish" | "harmful" | "adult_only",
              "reason": string
            }
          ]
        }`;

      const prompt = `
Validate parent activity inputs for OneParent VIC (Victoria, Australia).
Parent: ${parentAge}y, ${activityEnergyLevel} energy

INPUTS:
Interests: ${JSON.stringify(interests)}
Goals: ${JSON.stringify(goals)}

Use common sense to identify genuinely harmful content. Most normal adult interests and activities are safe.

FLAG only if content is:
- Explicit sexual material
- Hard illegal drugs
- Violence or harm to people
- Illegal activities
- Complete gibberish/spam
- Harmful goals: money, revenge, envy, theft, scams, manipulation
- Negative emotions as goals: anger, hatred, jealousy

Most entertainment, hobbies, food, technology, learning, wellness, social activities, legitimate work interests, and positive personal goals are perfectly normal and should be approved.

Return safe=true for typical adult activities and interests.
`.trim();

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 1500, // Increased for maximum input scenarios
      });

      if (!result || typeof result.safe !== 'boolean') {
        throw new Error("Invalid validation response format");
      }

      if (result.safe === false) {
        // Extract flagged items more thoroughly
        let flaggedItems = [];
        
        // Try multiple ways to get the flagged items
        if (Array.isArray(result.flaggedItems) && result.flaggedItems.length > 0) {
          // Check if AI returned field names instead of actual values
          const hasFieldNames = result.flaggedItems.some(item => 
            item.toLowerCase() === 'interests' || item.toLowerCase() === 'goals'
          );
          
          if (!hasFieldNames) {
            flaggedItems = result.flaggedItems;
          } else {
            // AI returned field names, use fallback
            const allInputs = [...interests, ...goals];
            const harmfulWords = ['sex', 'drugs', 'money', 'revenge', 'envy', 'theft', 'scam', 'manipulation', 'anger', 'hatred', 'jealousy'];
            flaggedItems = allInputs.filter(item => 
              harmfulWords.some(word => item.toLowerCase().includes(word.toLowerCase()))
            );
            console.log('AI returned field names, using fallback:', flaggedItems);
          }
        } else if (Array.isArray(result.issues) && result.issues.length > 0) {
          flaggedItems = result.issues.map(issue => issue.value).filter(Boolean);
        } else {
          // Fallback: check for any mention of flagged content in the response
          const allInputs = [...interests, ...goals];
          const harmfulWords = ['sex', 'drugs', 'money', 'revenge', 'envy', 'theft', 'scam', 'manipulation', 'anger', 'hatred', 'jealousy'];
          flaggedItems = allInputs.filter(item => 
            harmfulWords.some(word => item.toLowerCase().includes(word.toLowerCase()))
          );
          
       
        }
        
        console.log('Final response - flaggedItems:', flaggedItems);
        console.log('Final response - message:', flaggedItems.length > 0 ? "Please review and remove the following items:" : "Some inputs need review for appropriateness.");
        
        return res.status(400).json({ 
          safe: false,
          flaggedItems,
          message: flaggedItems.length > 0 
            ? "Please review and remove the following items:"
            : "Some inputs need review for appropriateness."
        });
      }

      return res.json({ 
        safe: true,
        message: "Your interests and goals look great! Ready to generate activities."
      });

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          safe: false,
          message: "Server not configured for safety validation (missing GEMINI_API_KEY).",
          flaggedItems: []
        });
      }
      
      return res.status(502).json({ 
        safe: false, 
        message: "Safety validation failed. Please review your inputs and try again.",
        flaggedItems: []
      });
    }

  } catch (error) {
    console.error("Safety validation error (myself):", error);
    res.status(500).json({
      safe: false,
      message: "Unable to validate inputs at this time. Please try again.",
      flaggedItems: []
    });
  }
});

/**
 * Safety validation for family activities with children
 * Enhanced validation considering child safety and age-appropriateness
 */
router.post("/playdate/withkids/safetychecks", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { 
      interests = [], 
      goals = [], 
      customIdea = "", 
      kids = [], 
      parentAge,
      activityEnergyLevel 
    } = req.body;

    // input validation
    if (!Array.isArray(interests) || !Array.isArray(goals) || !Array.isArray(kids)) {
      return res.status(400).json({
        safe: false,
        message: "Invalid input format.",
        flaggedItems: []
      });
    }

    if (!interests.length && !goals.length) {
      return res.status(400).json({
        safe: false,
        message: "Please provide at least one interest or goal.",
        flaggedItems: []
      });
    }

    // extract kids context for age-appropriate validation
    const youngestAge = kids.length 
      ? Math.min(...kids.map(k => Number(k.age)).filter(age => !isNaN(age))) 
      : 0;
    const oldestAge = kids.length 
      ? Math.max(...kids.map(k => Number(k.age)).filter(age => !isNaN(age))) 
      : 18;
    const kidsAges = kids.map(k => `${k.age} (${k.gender})`).join(', ');

    try {
      const jsonSchemaNote = `
        Schema:
        {
          "safe": boolean,
          "flaggedItems": [string],
          "issues": [
            {
              "field": "interests" | "goals",
              "value": string,
              "index": number,
              "type": "age_inappropriate" | "unsafe" | "gibberish" | "harmful" | "adult_only",
              "reason": string
            }
          ]
        }`;

      const prompt = `
Validate family activity inputs for OneParent VIC (Victoria, Australia).
Parent: ${parentAge}y, ${activityEnergyLevel} energy
Children: ${kidsAges} (youngest: ${youngestAge}y)

INPUTS:
Interests: ${JSON.stringify(interests)}
Goals: ${JSON.stringify(goals)}

Use common sense for family-appropriate content. Most normal family interests and activities are safe.

FLAG only if content is:
- Adult/sexual material
- Drugs or substances
- Violence or danger inappropriate for children
- Illegal activities
- Complete gibberish/spam
- Dark humor or themes
- Harmful goals: money, revenge, envy, theft, manipulation
- Teaching negative values: greed, dishonesty, harmful behavior

Most family entertainment, food activities, learning, sports, creative projects, social activities, and positive educational goals are normal and should be approved.

Consider youngest child age (${youngestAge}y) for appropriateness, but be reasonable - most family activities work across age ranges.

Return safe=true for typical family interests and activities.
`.trim();

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 1500, // Increased for maximum input scenarios
      });

      if (!result || typeof result.safe !== 'boolean') {
        throw new Error("Invalid validation response format");
      }

      if (result.safe === false) {
        // Extract flagged items more thoroughly
        let flaggedItems = [];
        
        // Try multiple ways to get the flagged items
        if (Array.isArray(result.flaggedItems) && result.flaggedItems.length > 0) {
          // Check if AI returned field names instead of actual values
          const hasFieldNames = result.flaggedItems.some(item => 
            item.toLowerCase() === 'interests' || item.toLowerCase() === 'goals'
          );
          
          if (!hasFieldNames) {
            flaggedItems = result.flaggedItems;
          } else {
            // AI returned field names, use fallback
            const allInputs = [...interests, ...goals];
            const harmfulWords = ['sex', 'drugs', 'money', 'revenge', 'envy', 'theft', 'manipulation', 'greed', 'dishonesty'];
            flaggedItems = allInputs.filter(item => 
              harmfulWords.some(word => item.toLowerCase().includes(word.toLowerCase()))
            );
            console.log('AI returned field names (family), using fallback:', flaggedItems);
          }
        } else if (Array.isArray(result.issues) && result.issues.length > 0) {
          flaggedItems = result.issues.map(issue => issue.value).filter(Boolean);
        } else {
          // Fallback: check for any mention of flagged content in the response
          const allInputs = [...interests, ...goals];
          const harmfulWords = ['sex', 'drugs', 'money', 'revenge', 'envy', 'theft', 'manipulation', 'greed', 'dishonesty'];
          flaggedItems = allInputs.filter(item => 
            harmfulWords.some(word => item.toLowerCase().includes(word.toLowerCase()))
          );
          
          // console.log('No flaggedItems from AI (family), using fallback:', flaggedItems);
          // console.log('All inputs:', allInputs);
          // console.log('AI result:', result);
        }
        
        console.log('Final response (family) - flaggedItems:', flaggedItems);
        console.log('Final response (family) - message:', flaggedItems.length > 0 ? "Please review and remove the following items:" : "Some inputs need review for child safety and age-appropriateness.");
        
        return res.status(400).json({ 
          safe: false,
          flaggedItems,
          message: flaggedItems.length > 0 
            ? "Please review and remove the following items:"
            : "Some inputs need review for child safety and age-appropriateness."
        });
      }

      return res.json({ 
        safe: true,
        message: "Your family activity preferences are perfect! Ready to generate activities."
      });

    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          safe: false,
          message: "Server not configured for safety validation (missing GEMINI_API_KEY).",
          flaggedItems: []
        });
      }
      return res.status(502).json({ 
        safe: false, 
        message: "Safety validation failed. Please review your inputs and try again.",
        flaggedItems: []
      });
    }
  } catch (error) {
    console.error("Safety validation error (with kids):", error);
    res.status(500).json({
      safe: false,
      message: "Unable to validate inputs at this time. Please try again.",
      flaggedItems: []
    });
  }
});

// generate personalized activities for parent-only time with weather integration and budget constraints
router.post("/playdate/myself/generate", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    const { 
      interests = [], 
      goals = [], 
      customIdea = "", 
      parentAge,
      parentType,
      activityEnergyLevel,
      suburb,
      date,
      time,
      preference, // indoor/outdoor
      timeAvailable,
      budget,
      currentActivity // for regeneration
    } = req.body;

    // input validation
    if (!Array.isArray(interests) || !Array.isArray(goals)) {
      return res.status(400).json({
        error: "Invalid input format.",
      });
    }

    // Get weather context for outdoor activities
    let weatherContext = "";
    if (preference === 'outdoor' && suburb && date && time) {
      try {
        const weather = await getWeatherContext(suburb, date, time);
        
        if (weather) {
          // Send raw weather data to Gemini for insights
          const temp = weather.hour.tempC;
          const precipProb = weather.hour.precipProb || 0;
          const windKph = weather.hour.windKph || 0;
          
          weatherContext = `Weather: ${Math.round(temp)}°C, ${weather.hour.weatherText}, ${precipProb}% rain chance, ${Math.round(windKph)} km/h wind.`;
          console.log(weatherContext);
        }
      } catch (e) {
        console.warn("Weather data unavailable, continuing without it");
      }
    }

    // context about energy levels for ai
    const energyLevelContext = {
      'low': 'minimal physical effort, relaxing, calm activities that require little energy',
      'moderate': 'balanced activities with some physical engagement but not exhausting',
      'high': 'active and engaging activities that require good energy and movement',
      'very-high': 'high-energy, physically demanding activities for those feeling very energetic'
    };

    // handle activity regeneration with emphasis on variety
    const regenerationNote = currentActivity 
      ? `CRITICAL REGENERATION REQUIREMENTS: The user already tried this activity: "${currentActivity}". 
         You MUST generate something COMPLETELY different by:
         - Using different interests from their list: ${interests.join(', ')}
         - Focusing on different goals: ${goals.join(', ')}
         - Choosing a completely different activity type, location, or approach
         - If they had indoor activity, prefer outdoor (weather permitting) or vice versa
         - Use different materials, different energy level, different time of day
         - Make it feel like a totally fresh experience, not a variation of the same thing`
      : "";

    const jsonSchemaNote = `
      Return exactly this JSON structure:
      {
        "title": string,
        "description": string,
        "location": string,
        "duration": string,
        "budget": string,
        "isOutdoor": boolean,
        "weatherInsight": string (only if outdoor activity, otherwise omit),
        "outcomes": [string],
        "materials": [string],
        "steps": [
          {
            "title": string,
            "description": string,
            "duration": string
          }
        ],
        "safetyTips": [string],
        "bondingTips": [string],
        "budgetNotes": string
      }`;

    const prompt = `Adult activity for single parent, Victoria AU.
${regenerationNote ? `AVOID: ${currentActivity} - create something completely different.` : ''}
User: ${parentAge}y, ${activityEnergyLevel} energy, ${suburb}, ${preference}, ${timeAvailable}, ${budget === 'free' ? 'free' : `$${budget}`}
Interests: ${interests.join(', ')}
Goals: ${goals.join(', ')}
${customIdea ? `Custom: ${customIdea}` : ''}
${weatherContext ? `Weather: ${weatherContext}` : ''}
Create ${preference} activity. Be creative with locations - cafes, libraries, studios, workshops, trails, beaches, markets, etc.
${weatherContext ? 'Include weatherInsight with specific advice for these conditions.' : 'IMPORTANT: Do not include weatherInsight field - no weather data available.'}`.trim();

    const result = await geminiGenerateJson({
      jsonSchemaNote,
      prompt,
      temperature: 0.5, // Optimized for speed and consistency
      maxOutputTokens: 5000, // Fixed allocation for reliability
    });

    if (!result || !result.title) {
      throw new Error("Invalid response format");
    }

    return res.json(result);

  } catch (e) {
    console.error("Activity generation error:", e.message);
    if (e && e.code === "NO_KEY") {
      return res.status(501).json({
        error: "Server not configured for activity generation."
      });
    }
    console.error("Activity generation error (myself):", e);
    return res.status(500).json({ 
      error: "Failed to generate activity. Please try again."
    });
  }
});

// generate family activities 
router.post("/playdate/withkids/generate", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
  try {
    // extract request parameters
    const { 
      interests = [], 
      goals = [], 
      customIdea = "", 
      parentAge,
      parentType,
      activityEnergyLevel,
      kids = [],
      suburb,
      date,
      time,
      preference, // indoor/outdoor
      timeAvailable,
      budget,
      currentActivity // for regeneration
    } = req.body;

    // validate input structure
    if (!Array.isArray(interests) || !Array.isArray(goals) || !Array.isArray(kids)) {
      return res.status(400).json({
        error: "Invalid input format.",
      });
    }

    // Get weather context for outdoor activities
    let weatherContext = "";
    if (preference === 'outdoor' && suburb && date && time) {
      try {
        const weather = await getWeatherContext(suburb, date, time);
        if (weather) {
          // Send raw weather data to Gemini for insights
          const temp = weather.hour.tempC;
          const precipProb = weather.hour.precipProb || 0;
          const windKph = weather.hour.windKph || 0;
          
          weatherContext = `Weather: ${Math.round(temp)}°C, ${weather.hour.weatherText}, ${precipProb}% rain chance, ${Math.round(windKph)} km/h wind.`;
          console.log(weatherContext);
        }
      } catch (e) {
        console.warn("Weather data unavailable, continuing without it");
      }
    }

    // process children information for context
    const kidsContext = kids.map((kid, idx) => {
      const ageStr = kid.age ? `${kid.age} years old` : 'age not specified';
      const genderStr = kid.gender || 'gender not specified';
      const styleStr = kid.activityStyle || 'activity style not specified';
      return `Child ${idx + 1}: ${genderStr}, ${ageStr}, prefers ${styleStr} activities`;
    }).join('\n- ');

    // Calculate age range for appropriate activities
    const youngestAge = kids.reduce((min, kid) => {
      const age = parseInt(kid.age);
      return isNaN(age) ? min : Math.min(min, age);
    }, 100);

    const oldestAge = kids.reduce((max, kid) => {
      const age = parseInt(kid.age);
      return isNaN(age) ? max : Math.max(max, age);
    }, 0);

    // Energy level context for activity planning
    const energyLevelContext = {
      'low': 'calm, gentle activities with minimal physical demands suitable for tired parents',
      'moderate': 'balanced family activities with some engagement but not exhausting',
      'high': 'active, engaging family activities that involve movement and energy',
      'very-high': 'high-energy, physically demanding family activities for very energetic days'
    };

    // handle activity regeneration with maximum variety for families
    const regenerationNote = currentActivity 
      ? `CRITICAL REGENERATION REQUIREMENTS: The user already tried this family activity: "${currentActivity}". 
         You MUST create something COMPLETELY different by:
         - Targeting different family interests: ${interests.join(', ')}  
         - Emphasizing different family goals: ${goals.join(', ')}
         - Changing the activity category entirely (if was craft, try physical; if was cooking, try outdoor exploration)
         - Using different skills for children (if was creative, try analytical; if was active, try quiet)
         - Selecting different venue type or location within home
         - Considering different child energy preferences: ${kids.map(k => k.activityStyle).filter(Boolean).join(', ')}
         - Make it appeal to different aspects of parent-child bonding
         - Ensure it feels like a completely fresh family experience`
      : "";

    // Define JSON response structure
    const jsonSchemaNote = `
      Return exactly this JSON structure:
      {
        "title": string,
        "description": string,
        "location": string,
        "duration": string,
        "budget": string,
        "isOutdoor": boolean,
        "weatherInsight": string (only if outdoor activity, otherwise omit),
        "outcomes": [string],
        "materials": [string],
        "steps": [
          {
            "title": string,
            "description": string,
            "duration": string
          }
        ],
        "safetyTips": [string],
        "bondingTips": [string],
        "budgetNotes": string
      }`;

    // Build comprehensive AI prompt for family activity generation
    const prompt = `Family activity for single parent + children, Victoria AU.
${regenerationNote ? `AVOID: ${currentActivity} - create different activity.` : ''}
Parent: ${parentAge}y, ${activityEnergyLevel} energy
Children: ${kidsContext || kids.map(k => `${k.age}y`).join(', ')} (ages ${youngestAge < 100 ? `${youngestAge}-${oldestAge}` : 'mixed'})
Location: ${suburb}, ${preference}, ${timeAvailable}, ${budget === 'free' ? 'free' : `$${budget}`}
Interests: ${interests.join(', ')}
Goals: ${goals.join(', ')}
${customIdea ? `Custom: ${customIdea}` : ''}
${weatherContext ? `Weather: ${weatherContext}` : ''}
Create ${preference} activity safe for ${youngestAge < 100 ? youngestAge + 'y+' : 'children'}. Be creative with locations - libraries, community centers, beaches, nature reserves, markets, studios.
${weatherContext ? 'Include weatherInsight with specific advice for these conditions.' : 'IMPORTANT: Do not include weatherInsight field - no weather data available.'}`.trim();

    // Generate activity using Gemini AI
    const result = await geminiGenerateJson({
      jsonSchemaNote,
      prompt,
      temperature: 0.5, // Optimized for speed and family-safe results
      maxOutputTokens: 5000, // Fixed allocation for reliability
    });

    // Validate AI response
    if (!result || !result.title) {
      throw new Error("Invalid response format from AI");
    }

    return res.json(result);

  } catch (e) {
    // Handle API key configuration errors
    if (e && e.code === "NO_KEY") {
      return res.status(501).json({
        error: "Server not configured for activity generation (missing GEMINI_API_KEY)."
      });
    }
    
    // Log and handle general errors
    console.error("Activity generation error (with kids):", e);
    return res.status(500).json({ 
      error: "Failed to generate family activity. Please try again."
    });
  }
});

module.exports = router;

