const API_KEY = process.env.COHERE_API_KEY || "";
const BASE = "https://api.cohere.ai/v1";

// Default models
const MODEL_DEFAULT = process.env.COHERE_MODEL || "command-r-plus";
const MODEL_VALIDATE = process.env.COHERE_MODEL_VALIDATE || "command-r-plus";
const MODEL_GENERATE = process.env.COHERE_MODEL_GENERATE || "command-r-plus";

if (!API_KEY) {
  console.warn("[cohere] COHERE_API_KEY not set — routes will return 501.");
}

async function callCohereOnce({ model, prompt, jsonSchemaNote = "", temperature = 0.3, maxOutputTokens = 2000 }) {
  const url = `${BASE}/generate`;

  const body = {
    model,
    prompt: `You are a strict JSON generator. ${jsonSchemaNote}
Respond ONLY with JSON. Do not include markdown fences.

${prompt}

Return valid JSON:`,
    max_tokens: maxOutputTokens,
    temperature,
    truncate: "END"
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Cohere ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  const data = JSON.parse(text);
  const out = data?.generations?.[0]?.text;
  if (!out) throw new Error("Empty Cohere response");
  
  // Clean the response and parse JSON
  const cleanedText = out.trim().replace(/``````\n?/g, '');
  return JSON.parse(cleanedText);
}

async function cohereJson({
  prompt,
  jsonSchemaNote = "",
  model = MODEL_DEFAULT,
  retries = 2,
  backoffMs = 1000,
  temperature,
  maxOutputTokens
}) {
  if (!API_KEY) {
    const err = new Error("Cohere not configured");
    err.code = "NO_KEY";
    throw err;
  }

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callCohereOnce({ model, prompt, jsonSchemaNote, temperature, maxOutputTokens });
    } catch (err) {
      lastErr = err;
      
      // Rate limit backoff
      if (err.status === 429 && attempt < retries) {
        const delay = Math.round(backoffMs * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5));
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

// Specialized helpers
function cohereValidateJson(args) {
  return cohereJson({ ...args, model: MODEL_VALIDATE, retries: 1 });
}

function cohereGenerateJson(args) {
  return cohereJson({ ...args, model: MODEL_GENERATE, retries: 2 });
}

module.exports = {
  cohereValidateJson,
  cohereGenerateJson,
  MODEL_DEFAULT, MODEL_VALIDATE, MODEL_GENERATE
};
