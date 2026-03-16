const DEFAULT_PORT = 8080;
const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_GEMINI_LIVE_MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";

function readStringEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getConfig() {
  return {
    port: Number(process.env.PORT || DEFAULT_PORT),
    geminiApiKey: readStringEnv("GEMINI_API_KEY"),
    geminiModel: readStringEnv("GEMINI_MODEL", DEFAULT_MODEL),
    geminiLiveModel: readStringEnv("GEMINI_LIVE_MODEL", DEFAULT_GEMINI_LIVE_MODEL)
  };
}
