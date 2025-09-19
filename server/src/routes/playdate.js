
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
        Evaluate interests/goals for a PARENT-ONLY activity planner on OneParent VIC.
        This is a supportive platform for single parents in Victoria, Australia.
        
        Context:
        - Parent age: ${parentAge}
        - Parent energy level: ${activityEnergyLevel}
        - Platform: Community support for single parents
        - Policy: Only flag genuinely harmful or inappropriate content
        
        INTERESTS to validate: ${JSON.stringify(interests)}
        GOALS to validate: ${JSON.stringify(goals)}
        
        ONLY FLAG THESE CLEARLY PROBLEMATIC ITEMS:
        1. EXPLICIT SEXUAL CONTENT: Clear sexual references like "porn", "xxx", explicit sexual acts
        2. ILLEGAL DRUGS: "cocaine", "heroin", "meth", etc. (NOT alcohol which is legal for adults)
        3. VIOLENCE/HARM: "murder", "killing people", "violence against others", "weapons for harm"
        4. PURE GIBBERISH: Random keyboard mashing like "asdfghjkl", "zxcvbnm", completely unreadable text
        5. CLEARLY HARMFUL GOALS: "hurting others", "revenge on people", "illegal activities"
        6. INAPPROPRIATE ACTIVITY GOALS: "money" (what activity teaches money?), "revenge" (negative), "power" (aggressive), "fame" (unrealistic for activities), "control" (negative), "dominance" (aggressive)
        7. PROFESSIONAL ADVICE REQUESTS: "medicine", "medical", "doctor", "investment", "finance", "legal" (activities can't provide professional advice)
        
        NORMAL INTERESTS/GOALS THAT ARE PERFECTLY FINE:
        - Entertainment: "music", "movies", "comedy", "Netflix", "gaming", "reading"
        - Technology: "coding", "programming", "google", "tesla", "tech", "computers"
        - Health/Wellness: "sleep", "nap", "relaxation", "exercise", "meditation", "yoga"
        - Food/Cooking: "eating", "food", "cooking", "baking", "recipes", "nutrition"
        - Learning: "science", "education", "courses", "skills", "languages"
        - Hobbies: "art", "photography", "writing", "crafts", "gardening", "sports"
        - Social: "friends", "community", "networking", "socializing"
        - Personal Growth: "self-care", "confidence", "happiness", "fun", "creativity"
        - Career/Professional: "work skills", "productivity", "learning", "networking" (NOT just "money")
        
        THINK ABOUT ACTIVITY CONTEXT:
        - "money" makes no sense as an activity interest - flag it
        - "revenge" is negative and aggressive - flag it  
        - "power" is aggressive and inappropriate - flag it
        - "fame" is unrealistic for personal activities - flag it
        - But "budgeting", "financial literacy", "career development" would be fine as they're educational
        
        BE VERY PERMISSIVE - only flag things that are genuinely harmful or completely nonsensical.
        Normal adult interests like technology, entertainment, food, sleep, work, etc. are all fine.
        This is for parents who deserve to have normal interests and goals.
        
        Return safe=false ONLY if there are genuinely problematic items.
        For flaggedItems, return ONLY the exact problematic text values.
        `.trim();

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 800,
      });

      if (!result || typeof result.safe !== 'boolean') {
        throw new Error("Invalid validation response format");
      }

      if (result.safe === false) {
        const flaggedItems = Array.isArray(result.flaggedItems) 
          ? result.flaggedItems 
          : Array.isArray(result.issues) 
            ? result.issues.map(issue => issue.value).filter(Boolean) 
            : [];
        
        return res.status(400).json({ 
          safe: false,
          flaggedItems,
          message: "Some inputs need review for appropriateness."
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
        Evaluate interests/goals for FAMILY ACTIVITIES on OneParent VIC.
        This is a supportive platform for single parents in Victoria, Australia.
        Children will be present - activities should be appropriate for the family.
        
        Context:
        - Parent age: ${parentAge}
        - Children ages: ${kidsAges}
        - Youngest child: ${youngestAge} years old
        - Oldest child: ${oldestAge} years old
        - Parent energy level: ${activityEnergyLevel}
        - Platform: Community support for single parents
        
        INTERESTS to validate: ${JSON.stringify(interests)}
        GOALS to validate: ${JSON.stringify(goals)}
        
        ONLY FLAG THESE CLEARLY PROBLEMATIC ITEMS:
        1. EXPLICIT SEXUAL CONTENT: Clear sexual references like "porn", "xxx", explicit sexual acts
        2. ILLEGAL DRUGS: "cocaine", "heroin", "meth", etc. (NOT alcohol which parents can discuss responsibly)
        3. VIOLENCE/HARM: "murder", "killing people", "violence against others", "weapons for harm"
        4. PURE GIBBERISH: Random keyboard mashing like "asdfghjkl", "zxcvbnm", completely unreadable text
        5. CLEARLY HARMFUL GOALS: "hurting others", "revenge on people", "illegal activities"
        6. GENUINELY DANGEROUS: Activities that could seriously harm children (not normal activities)
        7. INAPPROPRIATE ACTIVITY GOALS: "money" (what family activity teaches money?), "revenge" (negative), "power" (aggressive), "fame" (unrealistic), "control" (negative), "dominance" (aggressive)
        8. PROFESSIONAL ADVICE REQUESTS: "medicine", "medical", "doctor", "investment", "finance", "legal" (activities can't provide professional advice)
        
        NORMAL FAMILY INTERESTS/GOALS THAT ARE PERFECTLY FINE:
        - Entertainment: "music", "movies", "comedy", "games", "dancing", "singing"
        - Technology: "coding", "programming", "google", "tesla", "tech", "computers", "science"
        - Health/Wellness: "sleep", "nap", "relaxation", "exercise", "sports", "outdoor activities"
        - Food/Cooking: "eating", "food", "cooking", "baking", "recipes", "nutrition"
        - Learning: "science", "education", "courses", "skills", "reading", "learning"
        - Hobbies: "art", "photography", "writing", "crafts", "gardening", "nature"
        - Social: "friends", "community", "family time", "bonding", "socializing"
        - Personal: "fun", "creativity", "exploration", "adventure", "discovery"
        - Educational: "learning together", "skill building", "problem solving" (NOT just "money" or "power")
        
        THINK ABOUT FAMILY ACTIVITY CONTEXT:
        - "money" doesn't make sense as a family activity interest - flag it
        - "revenge" is negative and teaches bad values to kids - flag it
        - "power" is aggressive and inappropriate for family time - flag it
        - "fame" is unrealistic and teaches wrong values - flag it
        - But "saving", "budgeting skills", "teamwork", "leadership" would be educational
        
        AGE CONSIDERATIONS - BE REASONABLE:
        - For very young kids (under 5): Obviously inappropriate things like horror movies
        - For school age (5-12): Most normal activities are fine, they're not babies
        - For teens (13+): Almost all normal interests are appropriate
        
        BE VERY PERMISSIVE - only flag things that are genuinely harmful or completely nonsensical.
        Normal family interests like technology, music, food, learning, sports, etc. are all fine.
        Parents and children can enjoy normal activities together.
        
        Return safe=false ONLY if there are genuinely problematic items.
        For flaggedItems, return ONLY the exact problematic text values.
        `.trim();

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 800,
      });

      if (!result || typeof result.safe !== 'boolean') {
        throw new Error("Invalid validation response format");
      }

      if (result.safe === false) {
        const flaggedItems = Array.isArray(result.flaggedItems) ? result.flaggedItems : 
                           Array.isArray(result.issues) ? result.issues.map(issue => issue.value).filter(Boolean) : [];
        
        return res.status(400).json({ 
          safe: false,
          flaggedItems,
          message: "Some inputs need review for child safety and age-appropriateness."
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
          // Determine if weather is suitable for outdoor activities
          const temp = weather.hour.tempC;
          const precipProb = weather.hour.precipProb || 0;
          const windKph = weather.hour.windKph || 0;
          const isSuitableOutdoor = temp >= 10 && temp <= 35 && precipProb < 70 && windKph < 40;
          
          weatherContext = `Weather: ${Math.round(temp)}°C, ${weather.hour.weatherText}, ${precipProb}% rain chance, ${Math.round(windKph)} km/h wind. ${isSuitableOutdoor ? 'Good for outdoor activities.' : 'Consider indoor alternatives or weather protection.'}`;
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

    const prompt = `
      Generate a sophisticated, meaningful activity for a SINGLE PARENT (no children) on OneParent VIC.
      This is for adult self-care, personal growth, and meaningful experiences in Victoria, Australia.
      
      ${regenerationNote}
      
      PARENT PROFILE:
      - Type: ${parentType || 'Parent'} 
      - Age: ${parentAge || 'Not specified'}
      - Energy Level: ${activityEnergyLevel || 'moderate'} (${energyLevelContext[activityEnergyLevel] || 'balanced effort'})
      - Location: ${suburb || 'Victoria, Australia'}
      - Preference: ${preference || 'indoor'} activity
      - Time Available: ${timeAvailable ? timeAvailable.replace('-', ' to ') + ' hours' : '1-2 hours'}
      - Budget: ${budget === 'free' ? 'Free activities only' : `Up to $${budget} budget`}
      
      INTERESTS: ${interests.length ? interests.join(', ') : 'General wellness'}
      GOALS: ${goals.length ? goals.join(', ') : 'Personal enjoyment'}
      ${customIdea ? `CUSTOM IDEA: ${customIdea}` : ''}
      
      ${weatherContext}
      
      ETHICAL REQUIREMENTS:
      - NO medical advice, diagnosis, or treatment (even if "medicine" is an interest)
      - NO financial advice or investment guidance
      - NO dangerous activities or substance use
      - Educational/recreational approach only
      - Safe, responsible recommendations
      
      ACTIVITY REQUIREMENTS - ADULT-FOCUSED & MEANINGFUL:
      - FOR ADULT PARENT ONLY (sophisticated, age-appropriate activities)
      - NOT childish or juvenile activities - focus on adult interests and growth
      - ${preference === 'indoor' ? 'INDOOR ACTIVITIES: Can include creative pursuits, learning, relaxation, hobbies, cooking, crafts, reading, meditation, skill development' : 'OUTDOOR: Include social meetups, community activities, parks, cafes, local venues, exercise, nature walks, farmers markets'}
      - ${preference === 'outdoor' ? 'SOCIAL OPPORTUNITIES: Consider meeting friends, connecting with neighbors, joining community groups, local classes, hobby groups' : 'PERSONAL DEVELOPMENT: Focus on skills, creativity, mindfulness, learning, or meaningful solo activities'}
      - Match energy level and create genuine personal fulfillment
      - Respect budget constraints and suggest realistic local options
      - Consider adult interests: ${interests.join(', ') || 'personal growth and wellness'}
      - Achieve meaningful goals: ${goals.join(', ') || 'personal satisfaction and self-care'}
      
      GENERATE:
      - title: Engaging adult activity name (5-8 words)
      - description: 2-3 sentences about this meaningful experience
      - location: ${preference === 'indoor' ? '"Your Home" with specific areas/setups' : `"${suburb || 'Local area'}" with specific venues, cafes, parks, or community spaces`}
      - duration: Realistic adult timeframe (e.g., "1 hour", "2-3 hours")
      - budget: Honest cost estimate (e.g., "Free", "$15-20", "$30-40")
      - isOutdoor: ${preference === 'outdoor' ? 'true' : 'false'}
      ${preference === 'outdoor' && weatherContext ? '- weatherInsight: How weather affects this activity and any necessary adaptations' : ''}
      - outcomes: 3-4 adult benefits (stress relief, skill building, social connection, personal growth)
      - materials: Specific items needed (quality materials for indoor, what to bring for outdoor)
      - steps: 4-6 detailed adult-level instructions with realistic timing
      - safetyTips: 2-3 practical safety considerations for adults
      - bondingTips: 2-3 ways to enhance personal meaning or connect with others during this activity
      - budgetNotes: Cost breakdown, value for money, alternatives for different budgets
      
      ${weatherContext ? 'WEATHER CONSIDERATIONS:\nProvide thoughtful weather adaptations that enhance rather than limit the experience. Consider how weather can be part of the enjoyment.\n' : ''}
      
      STYLE: Respectful, sophisticated, personally enriching. Remember this is meaningful adult time, not parent-child activity.
      FOCUS: Activities should feel rewarding, age-appropriate, and personally fulfilling for an adult parent.
      `.trim();

    const result = await geminiGenerateJson({
      jsonSchemaNote,
      prompt,
      temperature: 0.5, // Lowered for more consistent, reliable results
      maxOutputTokens: 6000, // Increased to give more room for thinking + complete JSON output
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
          // Determine if weather is suitable for outdoor family activities
          const temp = weather.hour.tempC;
          const precipProb = weather.hour.precipProb || 0;
          const windKph = weather.hour.windKph || 0;
          const isSuitableOutdoor = temp >= 10 && temp <= 35 && precipProb < 70 && windKph < 40;
          
          weatherContext = `Weather: ${Math.round(temp)}°C, ${weather.hour.weatherText}, ${precipProb}% rain chance, ${Math.round(windKph)} km/h wind. ${isSuitableOutdoor ? 'Good for family outdoor activities.' : 'Consider indoor alternatives or weather protection.'}`;
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
    const prompt = `
      Generate a safe, family-friendly activity for single parent + children on OneParent VIC.
      This activity should be safe, engaging, and appropriate for ALL family members involved.
      
      ${regenerationNote}
      
      FAMILY PROFILE:
      - Parent: ${parentType || 'Parent'}, ${parentAge || 'not specified'} years old
      - Parent Energy: ${activityEnergyLevel || 'moderate'} (${energyLevelContext[activityEnergyLevel] || 'balanced'})
      - Children:
        ${kidsContext || 'No children information provided'}
      - Age Range: ${youngestAge < 100 ? `${youngestAge}-${oldestAge} years` : 'Not specified'}
      - Location: ${suburb || 'Victoria, Australia'}
      - Preference: ${preference || 'indoor'} activity
      - Time Available: ${timeAvailable ? timeAvailable.replace('-', ' to ') + ' hours' : '1-2 hours'}
      - Budget: ${budget === 'free' ? 'Free activities only' : `Up to $${budget} budget`}
      
      FAMILY INTERESTS: ${interests.length ? interests.join(', ') : 'General family fun'}
      FAMILY GOALS: ${goals.length ? goals.join(', ') : 'Quality bonding time'}
      ${customIdea ? `CUSTOM IDEA: ${customIdea}` : ''}
      
      ${weatherContext}
      
      ETHICAL & SAFETY REQUIREMENTS:
      - NO medical advice/diagnosis (even if "medicine" is interest)
      - NO financial advice or money handling activities
      - Age-appropriate for youngest child (${youngestAge < 100 ? youngestAge + 'yrs' : 'young children'})
      - NO dangerous activities, substances, or harmful content
      - Educational/recreational approach only
      - Family-safe recommendations
      
      ACTIVITY REQUIREMENTS:
      - FAMILY-FRIENDLY: Safe and engaging for youngest child (${youngestAge < 100 ? youngestAge + ' years old' : 'all ages'})
      - ${preference === 'indoor' ? 'INDOOR ONLY: Must be doable at home/apartment' : 'OUTDOOR: Can include parks, venues, family-friendly public spaces'}
      - Match parent's energy level while keeping kids engaged
      - Respect budget constraints (${budget === 'free' ? 'completely free' : `maximum $${budget}`})
      - Incorporate interests: ${interests.join(', ') || 'family bonding'}
      - Achieve goals: ${goals.join(', ') || 'quality time together'}
      - Consider individual children's activity preferences: ${kids.map(k => k.activityStyle).filter(Boolean).join(', ') || 'mixed activities'}
      
      GENERATE:
      - title: Family-friendly activity name (5-8 words)
      - description: 2-3 sentences about what the family will do together
      - location: ${preference === 'indoor' ? '"Your Home" or "Your ' + (suburb || 'Home') + '"' : `"${suburb || 'Local area'}" or specific family venue`}
      - duration: Realistic time (consider children's attention spans)
      - budget: Actual cost estimate (e.g., "Free", "$10-15", "$20-25")
      - isOutdoor: ${preference === 'outdoor' ? 'true' : 'false'}
      ${preference === 'outdoor' && weatherContext ? '- weatherInsight: Weather suitability for family activity and any needed adaptations' : ''}
      - outcomes: 3-4 benefits for family (bonding, learning, fun, skills)
      - materials: Specific items needed (household items for indoor, what to bring for outdoor)
      - steps: 4-6 clear family-friendly steps with durations
      - safetyTips: 2-3 child safety considerations (age-appropriate warnings)
      - bondingTips: 2-3 tips for enhancing parent-child connection during activity
      - budgetNotes: Cost breakdown, free alternatives, money-saving tips
      
      ${weatherContext ? 'WEATHER CONSIDERATIONS:\nConsider how the current weather conditions can enhance or affect the family activity. Provide thoughtful adaptations that work with the weather rather than against it. Include practical tips for comfort and safety based on the forecast.\n' : ''}
      
      CRITICAL: Ensure all suggestions are appropriate for youngest child (${youngestAge < 100 ? youngestAge + ' years old' : 'young children'}).
      STYLE: Warm, encouraging, practical for single parents managing children.
      `.trim();

    // Generate activity using Gemini AI
    const result = await geminiGenerateJson({
      jsonSchemaNote,
      prompt,
      temperature: 0.5, // Lowered for more consistent family-safe results
      maxOutputTokens: 6000, // Increased to give more room for thinking + complete JSON output
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

// legacy playdate generation route for older client implementations
// router.post("/playdate-generate", strictLimiter, aiGenerationBruteForce.prevent, async (req, res) => {
//   const body = req.body ?? {};
  
//     // validate input structure
//   const localIssues = quickValidate(body);
//   if (localIssues.length) {
//     return res
//       .status(400)
//       .json({ ok: false, message: "Invalid input.", issues: localIssues });
//   }

//   // normalize and extract user parameters
//   const suburb = (body.location || "").trim();           
//   const placeType = String(body.place || "").toLowerCase(); 
//   const plannedLabel = formatPlannedLabel(body.plannedDate, body.plannedTime);

//   // Fetch weather context for activity planning
//   let weather = null;
//   try {
//     weather = await getWeatherContext(suburb, body.plannedDate, body.plannedTime);
//   } catch {
//     weather = null;
//   }

//   // Development fallback when Gemini API key is not configured
//   if (!CONFIG.GEMINI_API_KEY) {
//     return res.json({
//       ideas: [
//         {
//           title: "Living-room Obstacle Course",
//           cardTitle: "Living-room Obstacle Course",
//           cardExcerpt: "A quick indoor course with cushions and chairs; fun, low-mess, and great for 30–45 mins.",
//           summary: "A quick indoor course with cushions and chairs; fun, low-mess, and great for 30–45 mins.",
//           html: contentToHtml({
//             title: "Living-room Obstacle Course",
//             subtitle: "Your Home Activity",
//             ageRange: "All Ages",
//             missionRewards: ["Fun", "Physical Activity", "Creativity"],
//             materials: ["Pillows/cushions", "Masking tape", "Chairs"],
//             steps: [
//               { title: "Setup", duration: "10 mins", description: "Arrange cushions and tape pathways" },
//               { title: "Play", duration: "20 mins", description: "Navigate the obstacle course" }
//             ],
//             bondingTips: "Let kids design one obstacle. Celebrate every run with high-fives.",
//             safetyNotes: "Keep pathways clear; avoid slippery rugs; supervise climbing.",
//             budgetNotes: "Free using household items"
//           }, weather, body, plannedLabel, suburb, placeType, 0)
//         }
//       ],
//     });
//   }

//   try {
//     // Build weather context block for AI prompt
//     const weatherBlock = weather
//       ? `
//         WEATHER_CONTEXT:
//         - Place: ${weather.place.name}
//         - Hour: ${weather.hour.timeISO}, ${Math.round(weather.hour.tempC)}°C, ${Math.round(
//                   weather.hour.precipProb
//                 )}% rain, ${weather.hour.weatherText}, wind ~${Math.round(weather.hour.windKph || 0)} km/h
//         - Day: max ${Math.round(weather.day.tMax)}°C / min ${Math.round(weather.day.tMin)}°C, precip sum ${
//                   weather.day.precipSum
//                 } mm
//         - Summary: ${weather.contextString}
//         `.trim()
//       : "WEATHER_CONTEXT: unavailable";

//     // Define JSON schema for structured response
//     const schemaNote = `
//       Schema:
//       {
//         "ideas": [
//           {
//             "title": string,
//             "summary": string,
//             "cardTitle": string,
//             "cardExcerpt": string,
//             "content": {
//               "title": string,
//               "subtitle": string,
//               "ageRange": string,
//               "missionRewards": [string],
//               "materials": [string],
//               "steps": [
//                 {
//                   "title": string,
//                   "duration": string,
//                   "description": string
//                 }
//               ],
//               "bondingTips": string,
//               "safetyNotes": string,
//               "weatherInsight": string,
//               "budgetNotes": string
//             }
//           }
//         ]
//       }`;

//     // Build comprehensive AI prompt for activity generation
//     const prompt = `
//       You are creating polished, SAFE, **strictly ${placeType || "indoor"}** activity ideas for a single parent with kids in Victoria, Australia.
//       Return EXACTLY 3 ideas as JSON with structured content (no HTML generation needed).
      
//       DEFINITIONS (read carefully):
//       • placeType='indoor' means: the activity occurs strictly at the user's dwelling (home/apartment/other private dwelling as provided). 
//        Do NOT suggest external venues (libraries, museums, malls, gyms, pools, aquatics, community centres, cafes, shopping centres, play areas, etc.) when placeType='indoor'.
//       • placeType='outdoor' may include public places (parks, libraries, museums, pools, centres, etc.) as appropriate. You may use emojis if it makes sense for any of the sections
      
//       User context (from the frontend form; use ALL of it):
//       - Parent type: ${body.parentType || "-"}
//       - Parent age: ${body.parentAge || "-"}
//       - Parent energy: ${body.energy || "-"}
//       - Kids (gender/age/energy/learning): ${JSON.stringify(body.children || [])}
//       - Suburb/town (VIC, Australia): ${suburb || "-"}
//       - Place type (MUST respect): ${placeType || "indoor"}
//       - Home type: ${body.homeType || "-"}
//       - Time available: ${body.timeAvailable || "-"}
//       - Budget (from frontend): ${body.budget || "-"} — MUST be respected and displayed; only incur costs if appropriate; if not "Free", clearly note where the money goes
//       - Interests: ${JSON.stringify(body.interests || [])}
//       - Goals: ${JSON.stringify(body.goals || [])}
//       - Planned start (Melbourne time): ${plannedLabel || (body.plannedDate + " " + body.plannedTime)}
//       ${weatherBlock}
      
//       Content requirements for each idea:
//       - title: Main activity name
//       - subtitle: Location context (e.g., "Your Home, ${suburb}")
//       - ageRange: Age range suitable for the children (e.g., "5-10", "All Ages")
//       - missionRewards: Array of 3-6 benefits aligned with user interests/goals
//       - materials: Array of required items (minimal/cheap; match the **${placeType || "indoor"}** constraint)
//       - steps: Array of 3-5 step objects with title, duration (e.g., "10 mins"), and description
//       - bondingTips: One paragraph of parent-child connection advice
//       - safetyNotes: One paragraph of safety considerations
//       - weatherInsight: If weather exists, 1-2 sentences on how weather affects this activity, otherwise null
//       - budgetNotes: If budget ≠ "Free", explain where money goes (AUD), otherwise null
      
//       Location selection rules (best-fit):
//       - Always remain **${placeType || "indoor"}**.
//       - Recommend the **best-fit location** based on ages, energy, time, budget, interests, and WEATHER_CONTEXT
//       - If recommending home/private: say "at home" or "in the backyard" — **do not include any address**
//       - If recommending public or commercial: list 1–2 plausible **local examples** in or near "${suburb}", using category/name level, **no street numbers**
      
//       Weather use (sensible, not forced but always provide insights when available):
//       - Consider WEATHER_CONTEXT and adapt only when it materially affects feasibility, comfort, safety, timing, or venue choice
//       - Keep weatherInsight concise and directly relevant to the activity
      
//       Constraints:
//       - The plan MUST be **${placeType || "indoor"}**; do not propose the opposite environment
//       - Match difficulty to kids' ages and parent's energy
//       - Respect the stated **Budget** and keep cost within that
//       - Personalise clearly using at least one provided interest/goal in each idea
//       - No adult themes, risky challenges, or personal data exposure
//       - Keep "cardExcerpt" <= 160 chars and "summary" to 1–2 sentences
//       `.trim();

//     // Generate activity ideas with retry logic for reliability
//     let result = await geminiGenerateJson({
//       prompt,
//       jsonSchemaNote: schemaNote,
//       temperature: 0.7,
//     });
    
//     let ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
    
//     // First retry if no ideas generated
//     if (ideas.length === 0) {
//       await sleep(400); 
//       result = await geminiGenerateJson({
//         prompt: `${prompt}\n\nRETRY: previous response had no ideas. Return EXACTLY 3 complete ideas.`,
//         jsonSchemaNote: schemaNote,
//         temperature: 0.6,
//       });
//       ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
//     }
    
//     // Second retry with more deterministic settings
//     if (ideas.length === 0) {
//       await sleep(400); 
//       result = await geminiGenerateJson({
//         prompt: `${prompt}\n\nFINAL RETRY: Return EXACTLY 3 complete structured ideas with all required content fields.`,
//         jsonSchemaNote: schemaNote,
//         temperature: 0.5,
//       });
//       ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
//     }

//     // Final retry with most conservative settings
//     if (ideas.length === 0) {
//       await sleep(500); 
//       result = await geminiGenerateJson({
//         prompt: `${prompt}\n\nLAST ATTEMPT: Generate exactly 3 activity ideas. Do not return empty response.`,
//         jsonSchemaNote: schemaNote,
//         temperature: 0.3,
//       });
//       ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
//     }

//     return res.json({ ideas });
    
//   } catch (e) {
//     // Handle API configuration and generation errors
//     const code = e && e.code === "NO_KEY" ? 501 : 500;
//     return res.status(code).json({ 
//       ok: false, 
//       message: e?.message || "Generation failed" 
//     });
//   }
// });

// module exports
module.exports = router;

