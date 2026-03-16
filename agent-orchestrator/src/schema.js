const ALLOWED_ACTIONS = new Set(["click", "type", "scroll", "wait", "navigate", "done"]);

function cleanString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function cleanNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateActRequest(body = {}) {
  return {
    url: cleanString(body.url),
    title: cleanString(body.title, "Untitled page"),
    domSummary: cleanString(body.domSummary, "No DOM summary provided."),
    screenshotBase64: cleanString(body.screenshotBase64),
    userIntent: cleanString(body.userIntent, "Analyze the page and choose the next safe action.")
  };
}

export function normalizeAction(raw = {}) {
  const action = cleanString(raw.action, "done").toLowerCase();

  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(`Unsupported action "${action}"`);
  }

  const normalized = {
    action,
    reason: cleanString(raw.reason, "No reason provided by orchestrator.")
  };

  if (action === "click" || action === "type") {
    normalized.selector = cleanString(raw.selector);
  }

  if (action === "type") {
    normalized.text = cleanString(raw.text);
  }

  if (action === "scroll") {
    normalized.deltaY = cleanNumber(raw.deltaY, 500);
  }

  if (action === "wait") {
    normalized.delayMs = cleanNumber(raw.delayMs, 1000);
  }

  if (action === "navigate") {
    normalized.url = cleanString(raw.url);
  }

  return normalized;
}
