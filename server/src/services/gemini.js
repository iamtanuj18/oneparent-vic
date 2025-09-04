// gemini api service for generating and validating json

// get api key and base url
const API_KEY = process.env.GEMINI_API_KEY || "";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

// model names from env or defaults
const MODEL_DEFAULT        = process.env.GEMINI_MODEL            || "models/gemini-2.5-flash";
const MODEL_VALIDATE       = process.env.GEMINI_MODEL_VALIDATE   || "models/gemini-2.5-flash-lite";
const MODEL_GENERATE       = process.env.GEMINI_MODEL_GENERATE   || "models/gemini-2.5-flash";
const MODEL_FALLBACKS_JSON = (process.env.GEMINI_MODEL_FALLBACKS || "models/gemini-2.0-flash,models/gemini-2.0-flash-lite")
  .split(",").map(s => s.trim()).filter(Boolean);

// warn if api key is missing
if (!API_KEY) {
  // console.warn("[gemini] GEMINI_API_KEY not set — routes will return 501.");
}

// get retry time from gemini error body
function extractRetryAfterMs(errBodyText) {
  try {
    const body = JSON.parse(errBodyText);
    const details = body?.error?.details || [];
    const retryInfo = details.find(d => d["@type"]?.includes("RetryInfo"));
    const s = retryInfo?.retryDelay; 
    if (!s) return 0;
    // Convert seconds to ms
    const match = String(s).match(/([\d.]+)s/);
    return match ? Math.round(parseFloat(match[1]) * 1000) : 0;
  } catch {
    return 0;
  }
}

// call gemini api once and return json
async function callGeminiOnce({ model, prompt, jsonSchemaNote = "", temperature = 0.4, maxOutputTokens }) {
  const url = `${BASE}/${model}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `You are a strict JSON generator. ${jsonSchemaNote}
              Respond ONLY with JSON. Do not include markdown fences.

  ${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature,
        ...(maxOutputTokens ? { maxOutputTokens } : {})
      }
    };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    err.retryAfterMs = res.status === 429 ? extractRetryAfterMs(text) : 0;
    err.raw = text;
    throw err;
  }

  const data = JSON.parse(text);
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("Empty Gemini response");
  return JSON.parse(out);
}

// call gemini with retries and model fallbacks
async function geminiJson({
  prompt,
  jsonSchemaNote = "",
  model = MODEL_DEFAULT,
  retries = 2,
  backoffMs = 1500,
  fallbacks = MODEL_FALLBACKS_JSON,
  temperature,
  maxOutputTokens
}) {
  if (!API_KEY) {
    const err = new Error("Gemini not configured");
    err.code = "NO_KEY";
    throw err;
  }

  const modelsToTry = [model, ...fallbacks];

  let lastErr;
  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const useModel = modelsToTry[mIdx];

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await callGeminiOnce({ model: useModel, prompt, jsonSchemaNote, temperature, maxOutputTokens });
      } catch (err) {
        lastErr = err;

        // Only backoff on 429/Quota; otherwise break to next model
        if (err.status !== 429) break;

        // Use server-provided retryAfter if present, else exponential 
        const delay = err.retryAfterMs || Math.round(backoffMs * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5));
        await new Promise(r => setTimeout(r, delay));
      }
    }
    // try next model in fallback list
  }
  throw lastErr;
}

// helper for validation requests
function geminiValidateJson(args) {
  return geminiJson({ ...args, model: MODEL_VALIDATE, retries: 1 });
}
// helper for generation requests
function geminiGenerateJson(args) {
  return geminiJson({ ...args, model: MODEL_GENERATE, retries: 2 });
}

// export helpers and model names
module.exports = {
  geminiValidateJson,
  geminiGenerateJson,
  MODEL_DEFAULT, MODEL_VALIDATE, MODEL_GENERATE
};
