// use express for routing
const express = require("express");
const router = express.Router();
// import gemini and weather helpers
const { geminiValidateJson, geminiGenerateJson } = require("../services/gemini");
const { getWeatherContext } = require("../utils/weather");

// max items and max characters allowed
const MAX_ITEMS = 8;
const MAX_CHARS = 24;

// trim and convert input to string
function trimStr(s) { return (s || "").toString().trim(); }

// sleep for a given time
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// base css for generated ideas
const BASE_CSS = String.raw`
/* ===== PlayDate Base (scoped to .pd-doc; you may vary --accent etc. per idea) ===== */
.pd-doc{--bg:#ffffff;--ink:#0f172a;--muted:#475569;--line:#e5e7eb;--chip:#f1f5f9;--accent:#2563eb;--accent2:#22c55e;--warn:#f59e0b;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,Noto Sans,sans-serif;color:var(--ink);background:var(--bg);
  max-width:780px;margin:0 auto;line-height:1.55}
.pd-hero{border-radius:16px 16px 0 0;padding:20px 22px;color:#fff;background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%)}
.pd-title{margin:0;font-size:28px;font-weight:800}
.pd-sub{margin:6px 0 0;opacity:.95;font-weight:600}
.pd-badges{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
.pd-pill{display:inline-flex;align-items:center;gap:.4rem;background:#0b1220;opacity:.9;color:#fff;border-radius:999px;
  padding:.35rem .7rem;font-size:.92rem}
.pd-body{border:1px solid var(--line);border-top:none;border-radius:0 0 16px 16px;padding:16px 18px;background:var(--bg)}
.pd-section{padding:14px 0;border-top:1px dashed var(--line)}
.pd-h2{margin:0 0 8px;font-size:18px}
.pd-chips{display:flex;flex-wrap:wrap;gap:.5rem}
.pd-chip{background:var(--chip);border:1px dashed #cbd5e1;border-radius:999px;padding:.35rem .6rem}
.pd-checks{display:grid;grid-template-columns:1fr 1fr;gap:.6rem .8rem}
.pd-check{border:1px solid var(--line);border-radius:10px;padding:.55rem .7rem}
.pd-steps{display:flex;flex-direction:column;gap:12px}
.pd-step{border:1px solid var(--line);border-radius:12px;padding:12px 14px;position:relative}
.pd-num{position:absolute;left:-10px;top:-10px;background:#fff;border:2px solid var(--ink);width:24px;height:24px;border-radius:999px;
  display:flex;align-items:center;justify-content:center;font-weight:700}
.pd-meta{color:var(--muted);font-size:.9rem;margin-top:4px}
.pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pd-card{border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.pd-footer{margin-top:10px;padding-top:10px;color:var(--muted);font-size:.85rem;border-top:1px solid var(--line);
  display:flex;justify-content:space-between;align-items:center}
@media (max-width:600px){.pd-checks{grid-template-columns:1fr}.pd-grid{grid-template-columns:1fr}}
@media print{.pd-doc{max-width:100%}.pd-hero{border-radius:0}.pd-body{border-radius:0}}
`;

// accent color combinations for variety
const ACCENT_THEMES = [
  { accent: '#2563eb', accent2: '#22c55e' }, // Blue to Green
  { accent: '#6d28d9', accent2: '#db2777' }, // Purple to Pink
  { accent: '#dc2626', accent2: '#f59e0b' }, // Red to Orange
  { accent: '#059669', accent2: '#0891b2' }, // Green to Cyan
  { accent: '#7c3aed', accent2: '#3b82f6' }, // Violet to Blue
];

// escape html to prevent injection
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// convert content structure to html for display
function contentToHtml(content, weather, body, plannedLabel, suburb, placeType, themeIndex = 0) {
  const theme = ACCENT_THEMES[themeIndex % ACCENT_THEMES.length];
  const customCSS = BASE_CSS.replace('--accent:#2563eb;--accent2:#22c55e', `--accent:${theme.accent};--accent2:${theme.accent2}`);
  
  // build badges 
  const badges = [
    `🗓️ Planned: ${plannedLabel || (body.plannedDate + " " + body.plannedTime)}`,
    `📍 Place: ${placeType || "indoor"}`,
    `💰 Budget: ${body.budget || "Free"}`,
    `🗺️ Location: ${suburb || "-"}`,
    `⏱️ ${body.timeAvailable || "30-60 mins"}`,
    `👧 Ages ${content.ageRange || "All"}`
  ].map(badge => `<span class='pd-pill'>${escapeHtml(badge)}</span>`).join('');

  // build mission rewards chips
  const chips = (content.missionRewards || [])
    .map(reward => `<span class='pd-chip'>${escapeHtml(reward)}</span>`)
    .join('');

  // build materials checklist
  const materials = (content.materials || [])
    .map(material => `<span class='pd-check'>${escapeHtml(material)}</span>`)
    .join('');

  // build steps
  const steps = (content.steps || [])
    .map((step, i) => `
      <div class='pd-step'>
        <div class='pd-num'>${i + 1}</div>
        <strong>${escapeHtml(step.title)} (${escapeHtml(step.duration)})</strong>
        <p class='pd-meta'>${escapeHtml(step.description)}</p>
      </div>
    `).join('');

  // weather section
  const weatherSection = weather ? `
    <div class='pd-section'>
      <h2 class='pd-h2'>Weather Insight</h2>
      <p>${escapeHtml(content.weatherInsight || weather.contextString)}</p>
    </div>` : '';

  // budget notes
  const budgetSection = content.budgetNotes ? `
    <div class='pd-section'>
      <h2 class='pd-h2'>Budget Notes</h2>
      <p>${escapeHtml(content.budgetNotes)}</p>
    </div>` : '';

  return `<article class='pd-doc'>
    <style>${customCSS}</style>
    <div class='pd-hero'>
      <h1 class='pd-title'>${escapeHtml(content.title)}</h1>
      <p class='pd-sub'>${escapeHtml(content.subtitle || 'Your Activity Plan')}</p>
      <div class='pd-badges'>${badges}</div>
    </div>
    <div class='pd-body'>
      ${weatherSection}
      <div class='pd-section'>
        <h2 class='pd-h2'>Mission Rewards</h2>
        <div class='pd-chips'>${chips}</div>
      </div>
      <div class='pd-section'>
        <h2 class='pd-h2'>Materials Checklist</h2>
        <div class='pd-checks'>${materials}</div>
      </div>
      <div class='pd-section'>
        <h2 class='pd-h2'>Steps</h2>
        <div class='pd-steps'>${steps}</div>
      </div>
      <div class='pd-section'>
        <h2 class='pd-h2'>Parent Power-Ups</h2>
        <div class='pd-grid'>
          <div class='pd-card'>
            <strong>Bonding Tips</strong>
            <p class='pd-meta'>${escapeHtml(content.bondingTips || 'Focus on fun and connection rather than perfection.')}</p>
          </div>
          <div class='pd-card'>
            <strong>Safety Notes</strong>
            <p class='pd-meta'>${escapeHtml(content.safetyNotes || 'Ensure the activity area is safe and age-appropriate.')}</p>
          </div>
        </div>
      </div>
      ${budgetSection}
      <div class='pd-footer'>
        <span>Generated by <strong>PlayDate AI Planner</strong></span>
        <span>• oneparentvic.me • A4 print-ready</span>
      </div>
    </div>
  </article>`;
}

// process ideas from gemini response
const toIdeas = (result, weather, body, plannedLabel, suburb, placeType) =>
  Array.isArray(result?.ideas)
    ? result.ideas.slice(0, 3).map((idea, index) => ({
        title: idea.title,
        cardTitle: idea.cardTitle,
        cardExcerpt: idea.cardExcerpt,
        summary: idea.summary,
        html: contentToHtml(idea.content, weather, body, plannedLabel, suburb, placeType, index),
      }))
    : [];

// format date and time for display
function formatPlannedLabel(dateISO, time24) {
  if (!trimStr(dateISO)) return "";
  try {
    const iso = time24 ? `${dateISO}T${time24}` : `${dateISO}T00:00`;
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Australia/Melbourne",
    });
    return fmt.format(d);
  } catch {
    return `${dateISO}${time24 ? ` ${time24}` : ""}`;
  }
}

// validate playdate input
function quickValidate(body) {
  const issues = [];
  const push = (field, value, reason, index, type = "format") =>
    issues.push({ field, value, reason, index, type });

  // parent age 
  const parentAge = Number(body.parentAge);
  if (!Number.isFinite(parentAge)) {
    push("parentAge", body.parentAge, "Parent age required");
  }

  // children 
  const kids = Array.isArray(body.children) ? body.children : [];
  if (!kids.length) {
    push("children", body.children, "At least one child required");
  }

  const maxChildAge = Number.isFinite(parentAge)
    ? Math.min(20, Math.max(1, parentAge - 20))
    : 15;

  kids.forEach((c, i) => {
    if (!c || typeof c !== "object") {
      return push("children", c, "Invalid child object", i);
    }
    const age = Number(c.age);
    if (!Number.isFinite(age) || age < 1 || age > maxChildAge) {
      push("children.age", c.age, `Age must be 1–${maxChildAge}`, i, "range");
    }
    if (!trimStr(c.gender)) {
      push("children.gender", c.gender, "Gender required", i, "missing");
    }
    if (!trimStr(c.energy_level)) {
      push("children.energy_level", c.energy_level, "Energy level required", i, "missing");
    }
    if (!trimStr(c.learning_style)) {
      push("children.learning_style", c.learning_style, "Learning style required", i, "missing");
    }
  });

  // interests & goals
  [["interests", body.interests], ["goals", body.goals]].forEach(([field, list]) => {
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) {
      push(field, arr.length, "At least one item required", undefined, "missing");
    }
    if (arr.length > MAX_ITEMS) {
      push(field, arr.length, `Max ${MAX_ITEMS} items`, undefined, "range");
    }
    arr.forEach((v, i) => {
      const s = trimStr(v);
      if (!s) return push(field, v, "Must be a non-empty string", i, "missing");
      if (s.length > MAX_CHARS) push(field, v, `Max ${MAX_CHARS} characters`, i, "range");
    });
  });

  // planned date & time 
  if (!trimStr(body.plannedDate)) {
    push("plannedDate", body.plannedDate, "Date required", undefined, "missing");
  }
  if (!trimStr(body.plannedTime)) {
    push("plannedTime", body.plannedTime, "Start time required", undefined, "missing");
  }

  return issues;
}

// check playdate input for safety issues
router.post("/playdate-safety-checks", async (req, res) => {
  try {
    const body = req.body ?? {};
    
    const localIssues = quickValidate(body);
    if (localIssues.length) {
      return res.status(400).json({
        ok: false,
        message: "Please fix highlighted items.",
        issues: localIssues,
      });
    }

    try {
      const jsonSchemaNote = `
        Schema:
        {
          "ok": boolean,
          "bannerMessage": string,
          "message": string,
          "issues": [
            {
              "field": "interests" | "goals",
              "value": string,
              "index": number,
              "type": "unsafe" | "gibberish" | "off_topic",
              "reason": string
            }
          ]
        }`;

      const prompt = `
        Evaluate interests/goals for a family activity planner.
        For EACH item:
        - unsafe for children -> type="unsafe" - Only if the item involves risk, illegal activity, or something clearly inappropriate for children. Interests can be anything reasonable, like eating, movies, music genres, etc.
        - nonsense/gibberish -> type="gibberish" - Only mark as gibberish if the word is totally unrecognizable and not understandable at all, even with typos. If you can understand the word or guess the intent, do NOT mark it as gibberish. Minor typos and less relevant words should be ignored.
        - off-topic for family-friendly planning -> type="off_topic" - Only if the item is totally irrelevant to family activities. Interests and goals can be broad, like relaxation, stress out, bonding, etc. These are NOT off-topic.
        Write a single user-facing summary "bannerMessage" in plain English, max 20 words and include 'and similar items' if needed.
        Keep it simple and actionable (e.g., "Unsafe or gibberish items found. Please replace: 'killing', 'fdsfdsf'").
        Ignore small typing errors if you can understand the word or intent.
        Return ok=false if ANY issues exist.
        Parent age: ${body.parentAge}
        Children: ${JSON.stringify(body.children || [])}
        Interests: ${JSON.stringify(body.interests || [])}
        Goals: ${JSON.stringify(body.goals || [])}
        `.trim();

      const result = await geminiValidateJson({
        jsonSchemaNote,
        prompt,
        temperature: 0,
        maxOutputTokens: 512,
      });

      if (result && result.ok === false) {
        const llmIssues = Array.isArray(result.issues) ? result.issues : [];
        const banner =
          (typeof result.bannerMessage === "string" && result.bannerMessage.trim()) ||
          (typeof result.message === "string" && result.message.trim()) ||
          "Some items need attention.";
        return res.status(400).json({ ok: false, message: banner, issues: llmIssues });
      }

      return res.json({ ok: true });
    } catch (e) {
      if (e && e.code === "NO_KEY") {
        return res.status(501).json({
          ok: false,
          message: "Server not configured for safety validation (missing GEMINI_API_KEY).",
        });
      }
      return res.status(502).json({ ok: false, message: e?.message || "Safety check failed" });
    }
  } catch (e) {
  // console.error(e);
    return res.status(500).json({ ok: false, message: "Validation error" });
  }
});

// generate playdate ideas using gemini
router.post("/playdate-generate", async (req, res) => {
  const body = req.body ?? {};
  
  // basic shape checks 
  const localIssues = quickValidate(body);
  if (localIssues.length) {
    return res
      .status(400)
      .json({ ok: false, message: "Invalid input.", issues: localIssues });
  }

  // normalize user intent fields
  const suburb = (body.location || "").trim();           
  const placeType = String(body.place || "").toLowerCase(); 
  const plannedLabel = formatPlannedLabel(body.plannedDate, body.plannedTime);

  // weather context
  let weather = null;
  try {
    weather = await getWeatherContext(suburb, body.plannedDate, body.plannedTime);
  } catch {
    weather = null;
  }

  // local dev fallback
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      ideas: [
        {
          title: "Living-room Obstacle Course",
          cardTitle: "Living-room Obstacle Course",
          cardExcerpt: "A quick indoor course with cushions and chairs; fun, low-mess, and great for 30–45 mins.",
          summary: "A quick indoor course with cushions and chairs; fun, low-mess, and great for 30–45 mins.",
          html: contentToHtml({
            title: "Living-room Obstacle Course",
            subtitle: "Your Home Activity",
            ageRange: "All Ages",
            missionRewards: ["Fun", "Physical Activity", "Creativity"],
            materials: ["Pillows/cushions", "Masking tape", "Chairs"],
            steps: [
              { title: "Setup", duration: "10 mins", description: "Arrange cushions and tape pathways" },
              { title: "Play", duration: "20 mins", description: "Navigate the obstacle course" }
            ],
            bondingTips: "Let kids design one obstacle. Celebrate every run with high-fives.",
            safetyNotes: "Keep pathways clear; avoid slippery rugs; supervise climbing.",
            budgetNotes: "Free using household items"
          }, weather, body, plannedLabel, suburb, placeType, 0)
        }
      ],
    });
  }

  try {
    // weather block
    const weatherBlock = weather
      ? `
        WEATHER_CONTEXT:
        - Place: ${weather.place.name}
        - Hour: ${weather.hour.timeISO}, ${Math.round(weather.hour.tempC)}°C, ${Math.round(
                  weather.hour.precipProb
                )}% rain, ${weather.hour.weatherText}, wind ~${Math.round(weather.hour.windKph || 0)} km/h
        - Day: max ${Math.round(weather.day.tMax)}°C / min ${Math.round(weather.day.tMin)}°C, precip sum ${
                  weather.day.precipSum
                } mm
        - Summary: ${weather.contextString}
        `.trim()
      : "WEATHER_CONTEXT: unavailable";

    //  json schema 
    const schemaNote = `
      Schema:
      {
        "ideas": [
          {
            "title": string,
            "summary": string,
            "cardTitle": string,
            "cardExcerpt": string,
            "content": {
              "title": string,
              "subtitle": string,
              "ageRange": string,
              "missionRewards": [string],
              "materials": [string],
              "steps": [
                {
                  "title": string,
                  "duration": string,
                  "description": string
                }
              ],
              "bondingTips": string,
              "safetyNotes": string,
              "weatherInsight": string,
              "budgetNotes": string
            }
          }
        ]
      }`;

    // streamlined prompt 
    const prompt = `
      You are creating polished, SAFE, **strictly ${placeType || "indoor"}** activity ideas for a single parent with kids in Victoria, Australia.
      Return EXACTLY 3 ideas as JSON with structured content (no HTML generation needed).
      
      DEFINITIONS (read carefully):
      • placeType='indoor' means: the activity occurs strictly at the user's dwelling (home/apartment/other private dwelling as provided). 
       Do NOT suggest external venues (libraries, museums, malls, gyms, pools, aquatics, community centres, cafes, shopping centres, play areas, etc.) when placeType='indoor'.
      • placeType='outdoor' may include public places (parks, libraries, museums, pools, centres, etc.) as appropriate. You may use emojis if it makes sense for any of the sections
      
      User context (from the frontend form; use ALL of it):
      - Parent type: ${body.parentType || "-"}
      - Parent age: ${body.parentAge || "-"}
      - Parent energy: ${body.energy || "-"}
      - Kids (gender/age/energy/learning): ${JSON.stringify(body.children || [])}
      - Suburb/town (VIC, Australia): ${suburb || "-"}
      - Place type (MUST respect): ${placeType || "indoor"}
      - Home type: ${body.homeType || "-"}
      - Time available: ${body.timeAvailable || "-"}
      - Budget (from frontend): ${body.budget || "-"} — MUST be respected and displayed; only incur costs if appropriate; if not "Free", clearly note where the money goes
      - Interests: ${JSON.stringify(body.interests || [])}
      - Goals: ${JSON.stringify(body.goals || [])}
      - Planned start (Melbourne time): ${plannedLabel || (body.plannedDate + " " + body.plannedTime)}
      ${weatherBlock}
      
      Content requirements for each idea:
      - title: Main activity name
      - subtitle: Location context (e.g., "Your Home, ${suburb}")
      - ageRange: Age range suitable for the children (e.g., "5-10", "All Ages")
      - missionRewards: Array of 3-6 benefits aligned with user interests/goals
      - materials: Array of required items (minimal/cheap; match the **${placeType || "indoor"}** constraint)
      - steps: Array of 3-5 step objects with title, duration (e.g., "10 mins"), and description
      - bondingTips: One paragraph of parent-child connection advice
      - safetyNotes: One paragraph of safety considerations
      - weatherInsight: If weather exists, 1-2 sentences on how weather affects this activity, otherwise null
      - budgetNotes: If budget ≠ "Free", explain where money goes (AUD), otherwise null
      
      Location selection rules (best-fit):
      - Always remain **${placeType || "indoor"}**.
      - Recommend the **best-fit location** based on ages, energy, time, budget, interests, and WEATHER_CONTEXT
      - If recommending home/private: say "at home" or "in the backyard" — **do not include any address**
      - If recommending public or commercial: list 1–2 plausible **local examples** in or near "${suburb}", using category/name level, **no street numbers**
      
      Weather use (sensible, not forced but always provide insights when available):
      - Consider WEATHER_CONTEXT and adapt only when it materially affects feasibility, comfort, safety, timing, or venue choice
      - Keep weatherInsight concise and directly relevant to the activity
      
      Constraints:
      - The plan MUST be **${placeType || "indoor"}**; do not propose the opposite environment
      - Match difficulty to kids' ages and parent's energy
      - Respect the stated **Budget** and keep cost within that
      - Personalise clearly using at least one provided interest/goal in each idea
      - No adult themes, risky challenges, or personal data exposure
      - Keep "cardExcerpt" <= 160 chars and "summary" to 1–2 sentences
      `.trim();

  // console.log("\nUpdated prompt (content-only):", prompt);

    // generate with multiple lightweight retries if empty ideas
    let result = await geminiGenerateJson({
      prompt,
      jsonSchemaNote: schemaNote,
      temperature: 0.7,
    });
    
    let ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
    
    if (ideas.length === 0) {
  // console.warn('[playdate-generate] Empty ideas on first try. Retrying...');
      await sleep(400); 
      result = await geminiGenerateJson({
        prompt: `${prompt}\n\nRETRY: previous response had no ideas. Return EXACTLY 3 complete ideas.`,
        jsonSchemaNote: schemaNote,
        temperature: 0.6,
      });
      ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
    }
    
    if (ideas.length === 0) {
  // console.warn('[playdate-generate] Empty ideas on second try. Final retry...');
      await sleep(400); 
      result = await geminiGenerateJson({
        prompt: `${prompt}\n\nFINAL RETRY: Return EXACTLY 3 complete structured ideas with all required content fields.`,
        jsonSchemaNote: schemaNote,
        temperature: 0.5,
      });
      ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
    }

    // third retry as requested - most deterministic settings
    if (ideas.length === 0) {
  // console.warn('[playdate-generate] Empty ideas on third try. Last attempt...');
      await sleep(500); 
      result = await geminiGenerateJson({
        prompt: `${prompt}\n\nLAST ATTEMPT: Generate exactly 3 activity ideas. Do not return empty response.`,
        jsonSchemaNote: schemaNote,
        temperature: 0.3,
      });
      ideas = toIdeas(result, weather, body, plannedLabel, suburb, placeType);
    }

    return res.json({ ideas });
  } catch (e) {
  // console.error(e);
    const code = e && e.code === "NO_KEY" ? 501 : 500;
    return res.status(code).json({ ok: false, message: e?.message || "Generation failed" });
  }
});

// export the router
module.exports = router;
