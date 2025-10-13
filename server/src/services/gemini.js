const { CONFIG } = require("../config");
const redisService = require("./redis");

// gemini api base url for all requests
const BASE = "https://generativelanguage.googleapis.com/v1beta";

// parse model sequences from config
function parseModelSequence(sequence) {
  return sequence.split(',').map(name => {
    const normalized = name.trim().toUpperCase();
    switch (normalized) {
      case 'PRO': return CONFIG.GEMINI_PRO_MODEL;
      case 'FLASH': return CONFIG.GEMINI_STANDARD_MODEL;
      case 'LITE': return CONFIG.GEMINI_PRO_FALLBACK;
      case 'STANDARD': return CONFIG.GEMINI_STANDARD_FALLBACK;
      default: return CONFIG.GEMINI_STANDARD_MODEL;
    }
  });
}

const GENERATE_MODELS = parseModelSequence(CONFIG.GENERATE_MODEL_SEQUENCE || "FLASH,PRO,PRO");
const VALIDATE_MODELS = parseModelSequence(CONFIG.VALIDATE_MODEL_SEQUENCE || "LITE,FLASH");

// extract retry delay from gemini error response
function extractRetryAfterMs(body) {
  try {
    const json = JSON.parse(body);
    const details = json?.error?.details || [];
    const retryInfo = details.find(d => d["@type"]?.includes("RetryInfo"));
    const s = retryInfo?.retryDelay;
    const m = s && String(s).match(/([\d.]+)s/);
    return m ? Math.round(parseFloat(m[1]) * 1000) : 0;
  } catch { return 0; }
}

// make single api call to gemini with enforced json response
async function callGeminiOnce({
  apiKey, model, prompt,
  jsonSchemaNote = "Return valid JSON object", 
  temperature = 0.4, 
  maxOutputTokens = 1000
}) {
  const url = `${BASE}/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      role: "user",
      parts: [{
        text: `${jsonSchemaNote}

${prompt}`
      }]
    }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature,
      maxOutputTokens
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`gemini ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    err.retryAfterMs = res.status === 429 ? extractRetryAfterMs(text) : 0;
    throw err;
  }

  const data = JSON.parse(text);
  const candidate = data?.candidates?.[0];
  const out = candidate?.content?.parts?.[0]?.text;
  const finishReason = candidate?.finishReason;
  const usage = data?.usageMetadata;
  
  if (!out || !out.trim()) {
    console.error(`[gemini] empty response (finish: ${finishReason || 'unknown'})`);
    const err = new Error(`empty gemini response (finish: ${finishReason || 'unknown'})`);
    err.isEmpty = true;
    err.finishReason = finishReason;
    throw err;
  }
  
  try {
    return JSON.parse(out);
  } catch (parseErr) {
    console.error(`[gemini] json parse failed: ${parseErr.message}`);
    throw new Error(`Invalid JSON response: ${parseErr.message}`);
  }
}

// main function with redis key rotation and model fallback strategy
async function callGeminiWithKeyRotation({
  modelList, 
  prompt, 
  jsonSchemaNote = "Return valid JSON object",
  retries = 3,
  backoffMs = 1500,
  temperature = 0.4, 
  maxOutputTokens = 2500
}) {
  if (!CONFIG.GEMINI_API_KEYS?.length) {
    const e = new Error("gemini not configured - no api keys available");
    e.code = "NO_KEYS";
    throw e;
  }

  let lastErr;
  let totalAttempts = 0;
  const maxTotalAttempts = modelList.length * (retries + 1);

  for (const model of modelList) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      totalAttempts++;
      try {
        // reserve redis key slot atomically before making api call
        const keySel = await redisService.getBestApiKey(model);
        const apiKey = keySel.apiKey;

        const result = await callGeminiOnce({
          apiKey, model, prompt,
          jsonSchemaNote, temperature, maxOutputTokens
        });
        
        return result;
        
      } catch (err) {
        lastErr = err;

        if (err.status === 429) {
          // use actual retry after time or exponential backoff with jitter
          const delay = err.retryAfterMs ||
                        Math.round(backoffMs * Math.pow(1.5, attempt) *
                                   (0.75 + Math.random() * 0.5));
          console.warn(`[gemini] rate limit hit, retry in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (err.isEmpty) {
          // for empty responses try next attempt immediately
          continue;
        }

        // for other errors try next attempt with small delay
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        break;
      }
    }
  }

  // if we get here all models and retries exhausted
  const errorMsg = lastErr?.isEmpty 
    ? `All models exhausted with empty responses (${totalAttempts} attempts). Try increasing maxOutputTokens.`
    : `All models exhausted: ${lastErr?.message || 'unknown error'} (${totalAttempts} attempts)`;
    
  throw new Error(errorMsg);
}

// generate json using configurable model sequence
function geminiGenerateJson({
  prompt, 
  jsonSchemaNote = "Return valid JSON object",
  temperature = 0.4, 
  maxOutputTokens = 2500,
  retries = 3
}) {
  return callGeminiWithKeyRotation({ 
    modelList: GENERATE_MODELS,
    prompt, 
    jsonSchemaNote, 
    temperature, 
    maxOutputTokens,
    retries
  }).catch(error => {
    console.error(`[gemini] generation failed: ${error.message}`);
    throw error;
  });
}

// validate json using configured validation sequence
function geminiValidateJson({
  prompt, 
  jsonSchemaNote = "Return valid JSON object",
  temperature = 0.4, 
  maxOutputTokens = 800,
  retries = 3
}) {
  return callGeminiWithKeyRotation({ 
    modelList: VALIDATE_MODELS,
    prompt, 
    jsonSchemaNote, 
    temperature, 
    maxOutputTokens,
    retries
  }).catch(error => {
    console.error(`[gemini] validation failed: ${error.message}`);
    throw error;
  });
}

module.exports = { geminiGenerateJson, geminiValidateJson };