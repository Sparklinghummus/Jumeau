import { createWeatherMcpBundle } from "./templates/weather-mcp.js";

const STORAGE_KEY = "mcpDeployerUrl";

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function buildEndpoint(baseUrl, pathname) {
  return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

export async function exportWeatherMcp({ name = "weather-mcp" } = {}) {
  const settings = await storageGet([STORAGE_KEY]);
  const deployerUrl = typeof settings[STORAGE_KEY] === "string" ? settings[STORAGE_KEY].trim() : "";

  if (!deployerUrl) {
    throw new Error("Missing deployer URL. Set it in the extension options.");
  }

  const files = createWeatherMcpBundle(name);
  const response = await fetch(buildEndpoint(deployerUrl, "/deploy"), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      name,
      files
    })
  });

  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `MCP deploy failed with ${response.status}`);
  }

  return data;
}
