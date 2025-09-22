const { CONFIG } = require("../config");
const redisService = require("./redis");

// gemini api base url for all requests
const BASE = "https://generativelanguage.googleapis.com/v1beta";

// model lists optimized for free tier usage with configurable sequences
// parse sequences from config like "flash,pro,pro" -> [flash, pro, pro]
function parseModelSequence(sequence) {
  return sequence.split(',').map(name => {
    const normalized = name.trim().toUpperCase();
    switch (normalized) {
      case 'PRO': return CONFIG.GEMINI_PRO_MODEL;
      case 'FLASH': return CONFIG.GEMINI_STANDARD_MODEL;
      case 'LITE': return CONFIG.GEMINI_PRO_FALLBACK;
      case 'STANDARD': return CONFIG.GEMINI_STANDARD_FALLBACK;
      default: return CONFIG.GEMINI_STANDARD_MODEL; // fallback to flash
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
  
  // console.log(`[gemini] response length: ${out?.length || 0} chars`);
  if (usage?.thoughtsTokenCount) {
    // console.log(`[gemini] thinking tokens: ${usage.thoughtsTokenCount}, output tokens: ${usage.candidatesTokenCount || 0}`);
  }
  
  if (!out || !out.trim()) {
    // console.log(`[gemini] debug - full response:`, JSON.stringify(data, null, 2));
    const err = new Error(`empty gemini response (finish: ${finishReason || 'unknown'})`);
    err.isEmpty = true;
    err.finishReason = finishReason;
    err.thoughtsTokenCount = usage?.thoughtsTokenCount || 0;
    throw err;
  }
  
  try {
    return JSON.parse(out);
  } catch (parseErr) {
    // console.log(`[gemini] JSON parse error for response: ${out}`);
    throw new Error(`Invalid JSON response: ${parseErr.message}`);
  }
}

// main function with redis key rotation and aggressive model fallback never-fail strategy
async function callGeminiWithKeyRotation({
  modelList, 
  prompt, 
  jsonSchemaNote = "Return valid JSON object",
  retries = 3, // increased from 2 for reliability
  backoffMs = 1500,
  temperature = 0.4, 
  maxOutputTokens = 2500 // increased default for thinking tokens
}) {
  if (!CONFIG.GEMINI_API_KEYS?.length) {
    const e = new Error("gemini not configured - no api keys available");
    e.code = "NO_KEYS";
    throw e;
  }

  let lastErr;
  let totalAttempts = 0;
  const maxTotalAttempts = modelList.length * (retries + 1); // never give up
  
  // console.log(`[gemini] starting generation with sequence: ${modelList.map(m => m.split('/').pop()).join(' → ')}`);

  for (const model of modelList) {
    // console.log(`[gemini] trying model: ${model.split('/').pop()}`);

    for (let attempt = 0; attempt <= retries; attempt++) {
      totalAttempts++;
      try {
        // reserve redis key slot atomically before making api call
        const keySel = await redisService.getBestApiKey(model);
        const apiKey = keySel.apiKey;
        // console.log(`[gemini] attempt ${totalAttempts}/${maxTotalAttempts} using key: ${keySel.keyInfo.keyHash} for model: ${model.split('/').pop()}`);

        const result = await callGeminiOnce({
          apiKey, model, prompt,
          jsonSchemaNote, temperature, maxOutputTokens
        });
        
        // console.log(`[gemini] success on attempt ${totalAttempts} with ${model.split('/').pop()}`);
        return result;
        
      } catch (err) {
        lastErr = err;
        // console.warn(`[gemini] attempt ${totalAttempts} failed: ${err.message}`);

        if (err.status === 429) {
          // Use actual retry-after time or exponential backoff with jitter
          const delay = err.retryAfterMs ||
                        Math.round(backoffMs * Math.pow(1.5, attempt) *
                                   (0.75 + Math.random() * 0.5));
          console.warn(`[gemini] rate limit hit, retry in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (err.isEmpty) {
          // console.warn(`[gemini] empty response (${err.finishReason}), trying next key/model`);
          // For empty responses, try next attempt immediately
          continue;
        }

        // For other errors, try next attempt with small delay
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        // console.warn(`[gemini] model ${model.split('/').pop()} exhausted after ${retries + 1} attempts`);
        break;
      }
    }

    // console.warn(`[gemini] switching to next model in sequence`);
  }

  // If we get here, all models and retries exhausted
  const errorMsg = lastErr?.isEmpty 
    ? `All models exhausted with empty responses (${totalAttempts} attempts). Try increasing maxOutputTokens.`
    : `All models exhausted: ${lastErr?.message || 'unknown error'} (${totalAttempts} attempts)`;
    
  // console.error(`[gemini] GENERATION FAILED: ${errorMsg}`);
  throw new Error(errorMsg);
}

// Generate JSON using configurable model sequence (with higher default tokens for thinking models)
function geminiGenerateJson({
  prompt, 
  jsonSchemaNote = "Return valid JSON object",
  temperature = 0.4, 
  maxOutputTokens = 2500, // increased default for 2.5 models with thinking tokens
  retries = 3 // increased for reliability
}) {
  // console.log("[gemini] generate request - using configured model sequence");
  return callGeminiWithKeyRotation({ 
    modelList: GENERATE_MODELS,
    prompt, 
    jsonSchemaNote, 
    temperature, 
    maxOutputTokens,
    retries
  });
}

// Validate JSON using configured validation sequence
function geminiValidateJson({
  prompt, 
  jsonSchemaNote = "Return valid JSON object",
  temperature = 0.4, 
  maxOutputTokens = 800, // increased from 500 for validation
  retries = 3 // increased for reliability
}) {
  // console.log("[gemini] validate request - using configured validation sequence");
  return callGeminiWithKeyRotation({ 
    modelList: VALIDATE_MODELS,
    prompt, 
    jsonSchemaNote, 
    temperature, 
    maxOutputTokens,
    retries
  });
}

module.exports = { geminiGenerateJson, geminiValidateJson };
