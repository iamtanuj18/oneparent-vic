const API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const BASE = "https://api-inference.huggingface.co/models";

// Default models - using text generation models that work well with JSON
const MODEL_DEFAULT = process.env.HUGGINGFACE_MODEL || "microsoft/DialoGPT-large";
const MODEL_VALIDATE = process.env.HUGGINGFACE_MODEL_VALIDATE || "microsoft/DialoGPT-large";
const MODEL_GENERATE = process.env.HUGGINGFACE_MODEL_GENERATE || "microsoft/DialoGPT-large";

if (!API_KEY) {
  console.warn("[huggingface] HUGGINGFACE_API_KEY not set — routes will return 501.");
}

async function callHuggingFaceOnce({ model, prompt, jsonSchemaNote = "", temperature = 0.3, maxOutputTokens = 2000 }) {
  const url = `${BASE}/${model}`;

  const body = {
    inputs: `You are a strict JSON generator. ${jsonSchemaNote}
Respond ONLY with JSON. Do not include markdown fences.

${prompt}

JSON:`,
    parameters: {
      max_new_tokens: maxOutputTokens,
      temperature,
      return_full_text: false,
      do_sample: temperature > 0
    }
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
    const err = new Error(`HuggingFace ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  const data = JSON.parse(text);
  
  // Handle different response formats
  let out;
  if (Array.isArray(data) && data[0]?.generated_text) {
    out = data[0].generated_text;
  } else if (data?.generated_text) {
    out = data.generated_text;
  } else {
    throw new Error("Empty HuggingFace response");
  }

  // Clean the response and parse JSON
  const cleanedText = out.trim().replace(/``````\n?/g, '');
  return JSON.parse(cleanedText);
}

async function huggingFaceJson({
  prompt,
  jsonSchemaNote = "",
  model = MODEL_DEFAULT,
  retries = 2,
  backoffMs = 2000,
  temperature,
  maxOutputTokens
}) {
  if (!API_KEY) {
    const err = new Error("HuggingFace not configured");
    err.code = "NO_KEY";
    throw err;
  }

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callHuggingFaceOnce({ model, prompt, jsonSchemaNote, temperature, maxOutputTokens });
    } catch (err) {
      lastErr = err;
      
      // Handle model loading delays
      if (err.status === 503 && attempt < retries) {
        const delay = Math.round(backoffMs * Math.pow(1.5, attempt));
        await new Promise(r => setTimeout(r, delay));
      } else if (err.status === 429 && attempt < retries) {
        const delay = Math.round(backoffMs * Math.pow(2, attempt));
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

// Specialized helpers
function huggingFaceValidateJson(args) {
  return huggingFaceJson({ ...args, model: MODEL_VALIDATE, retries: 1 });
}

function huggingFaceGenerateJson(args) {
  return huggingFaceJson({ ...args, model: MODEL_GENERATE, retries: 2 });
}

module.exports = {
  huggingFaceValidateJson,
  huggingFaceGenerateJson,
  MODEL_DEFAULT, MODEL_VALIDATE, MODEL_GENERATE
};
