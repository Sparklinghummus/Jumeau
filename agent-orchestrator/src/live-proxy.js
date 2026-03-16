import { WebSocket } from "ws";

const GEMINI_LIVE_ENDPOINT = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

function toBuffer(data, isBinary) {
  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }

  if (typeof data === "string" && isBinary) {
    return Buffer.from(data);
  }

  return data;
}

function tryParseJsonMessage(rawData) {
  if (typeof rawData !== "string") {
    return null;
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
}

function maybeRewriteSetupMessage(rawData, config) {
  const payload = tryParseJsonMessage(rawData);
  if (!payload?.setup) {
    return rawData;
  }

  const rewritten = {
    ...payload,
    setup: {
      ...payload.setup,
      model: payload.setup.model || config.geminiLiveModel
    }
  };

  return JSON.stringify(rewritten);
}

function sendError(clientSocket, message) {
  if (clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.send(JSON.stringify({
      error: {
        message
      }
    }));
  }
}

export function attachLiveProxy(clientSocket, config) {
  if (!config.geminiApiKey) {
    sendError(clientSocket, "Missing GEMINI_API_KEY on the orchestrator.");
    clientSocket.close(1011, "Missing Gemini API key");
    return;
  }

  const upstreamUrl = `${GEMINI_LIVE_ENDPOINT}?key=${encodeURIComponent(config.geminiApiKey)}`;
  const upstreamSocket = new WebSocket(upstreamUrl);
  const pendingMessages = [];
  let upstreamReady = false;
  let clientClosed = false;

  function flushPendingMessages() {
    while (pendingMessages.length && upstreamSocket.readyState === WebSocket.OPEN) {
      const next = pendingMessages.shift();
      upstreamSocket.send(next.data, { binary: next.binary });
    }
  }

  function closeUpstream() {
    if (upstreamSocket.readyState === WebSocket.CLOSING || upstreamSocket.readyState === WebSocket.CLOSED) {
      return;
    }

    upstreamSocket.close();
  }

  upstreamSocket.on("open", () => {
    upstreamReady = true;
    flushPendingMessages();
  });

  upstreamSocket.on("message", (data, isBinary) => {
    if (clientSocket.readyState !== WebSocket.OPEN) {
      closeUpstream();
      return;
    }

    clientSocket.send(toBuffer(data, isBinary), { binary: isBinary });
  });

  upstreamSocket.on("error", (error) => {
    sendError(clientSocket, `Gemini Live upstream error: ${error.message}`);
  });

  upstreamSocket.on("close", (code, reasonBuffer) => {
    if (clientClosed || clientSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const reason = reasonBuffer?.toString?.() || "Gemini Live connection closed.";
    clientSocket.close(code || 1011, reason.slice(0, 120));
  });

  clientSocket.on("message", (data, isBinary) => {
    const rewritten = !isBinary && typeof data === "string"
      ? maybeRewriteSetupMessage(data, config)
      : data;

    const payload = {
      data: toBuffer(rewritten, isBinary),
      binary: isBinary
    };

    if (!upstreamReady || upstreamSocket.readyState !== WebSocket.OPEN) {
      if (pendingMessages.length > 200) {
        sendError(clientSocket, "Upstream queue is full.");
        clientSocket.close(1013, "Upstream queue full");
        closeUpstream();
        return;
      }

      pendingMessages.push(payload);
      return;
    }

    upstreamSocket.send(payload.data, { binary: payload.binary });
  });

  clientSocket.on("close", () => {
    clientClosed = true;
    closeUpstream();
  });

  clientSocket.on("error", () => {
    clientClosed = true;
    closeUpstream();
  });
}
