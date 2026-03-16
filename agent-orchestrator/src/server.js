import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { getConfig } from "./config.js";
import { validateActRequest } from "./schema.js";
import { decideNextAction } from "./orchestrator.js";
import { attachLiveProxy } from "./live-proxy.js";

const config = getConfig();
const websocketServer = new WebSocketServer({ noServer: true });

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of request) {
    totalLength += chunk.length;
    if (totalLength > 6 * 1024 * 1024) {
      throw new Error("Payload too large.");
    }

    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "agent-orchestrator",
      model: config.geminiModel,
      liveModel: config.geminiLiveModel
    });
    return;
  }

  if (request.method === "POST" && request.url === "/act") {
    try {
      const body = await readJsonBody(request);
      const input = validateActRequest(body);
      const action = await decideNextAction(input, config);

      sendJson(response, 200, {
        ok: true,
        action
      });
      return;
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error.message
      });
      return;
    }
  }

  sendJson(response, 404, {
    ok: false,
    error: "Not found."
  });
});

server.on("upgrade", (request, socket, head) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  if (requestUrl.pathname !== "/live") {
    socket.destroy();
    return;
  }

  websocketServer.handleUpgrade(request, socket, head, (clientSocket) => {
    attachLiveProxy(clientSocket, config);
  });
});

server.listen(config.port, () => {
  console.log(`agent-orchestrator listening on :${config.port}`);
});
