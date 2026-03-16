import { normalizeAction } from "./schema.js";

function buildPrompt(input) {
  return [
    "You are a browser orchestrator for a Chrome extension.",
    "Choose exactly one next browser action.",
    "Return JSON only with no markdown and no prose.",
    'Allowed actions: "click", "type", "scroll", "wait", "navigate", "done".',
    "Rules:",
    "- Prefer done if the intent is already satisfied or you are unsure.",
    "- Only use selectors that are likely to exist on the current page.",
    "- Use navigate only when a direct URL change is clearly the best next step.",
    "- Keep reasons short.",
    "- For type actions, include selector and text.",
    "- For click actions, include selector.",
    "- For scroll actions, include deltaY.",
    "- For wait actions, include delayMs.",
    "- For navigate actions, include url.",
    "",
    `User intent: ${input.userIntent}`,
    `Page URL: ${input.url}`,
    `Page title: ${input.title}`,
    `DOM summary: ${input.domSummary}`,
    `Screenshot bytes present: ${input.screenshotBase64 ? "yes" : "no"}`,
    "",
    "JSON schema:",
    '{"action":"click|type|scroll|wait|navigate|done","reason":"short reason","selector":"optional","text":"optional","deltaY":500,"delayMs":1000,"url":"optional"}'
  ].join("\n");
}

function extractTextParts(payload = {}) {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const firstCandidate = candidates[0];
  const parts = firstCandidate?.content?.parts || [];
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function extractJsonObject(text) {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] || text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model response.");
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

async function callGemini(config, input) {
  if (!config.geminiApiKey) {
    return {
      action: "done",
      reason: "No GEMINI_API_KEY configured on the orchestrator."
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: buildPrompt(input) }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = extractTextParts(data);
  return extractJsonObject(text);
}

export async function decideNextAction(input, config) {
  const rawAction = await callGemini(config, input);
  return normalizeAction(rawAction);
}
