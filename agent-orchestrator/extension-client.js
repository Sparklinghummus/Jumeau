const STORAGE_KEY = "orchestratorUrl";

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function tabsQuery(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(tabs);
    });
  });
}

function captureVisibleTab(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 70 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(dataUrl || "");
    });
  });
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

function stripDataUrlPrefix(dataUrl) {
  const marker = "base64,";
  const markerIndex = dataUrl.indexOf(marker);
  return markerIndex === -1 ? dataUrl : dataUrl.slice(markerIndex + marker.length);
}

function buildEndpoint(baseUrl, pathname) {
  return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

export async function runAgentTurn({ userIntent }) {
  const settings = await storageGet([STORAGE_KEY]);
  const orchestratorUrl = typeof settings[STORAGE_KEY] === "string" ? settings[STORAGE_KEY].trim() : "";

  if (!orchestratorUrl) {
    throw new Error("Missing orchestrator URL. Set it in the extension options.");
  }

  const tabs = await tabsQuery({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    throw new Error("No active tab found.");
  }

  const pageContextResponse = await sendTabMessage(activeTab.id, {
    type: "MVP_GET_PAGE_CONTEXT"
  });

  const screenshotDataUrl = await captureVisibleTab(activeTab.windowId);
  const payload = {
    url: pageContextResponse?.context?.url || activeTab.url || "",
    title: pageContextResponse?.context?.title || activeTab.title || "Untitled page",
    domSummary: pageContextResponse?.context?.domSummary || "No DOM summary available.",
    screenshotBase64: stripDataUrlPrefix(screenshotDataUrl),
    userIntent: typeof userIntent === "string" && userIntent.trim()
      ? userIntent.trim()
      : "Analyze the current page and choose the next safe browser action."
  };

  const response = await fetch(buildEndpoint(orchestratorUrl, "/act"), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Orchestrator request failed with ${response.status}`);
  }

  const action = data.action;
  let execution = null;

  if (action.action !== "done") {
    execution = await sendTabMessage(activeTab.id, {
      type: "MVP_EXECUTE_ACTION",
      action
    });
  }

  return {
    action,
    execution,
    context: payload
  };
}
