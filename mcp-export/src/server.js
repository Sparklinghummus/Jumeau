import { createServer } from "node:http";
import { deployBundle } from "./deployer.js";

const port = Number(process.env.PORT || 8080);
const projectId = process.env.GCP_PROJECT_ID || "";
const region = process.env.GCP_REGION || "europe-west1";
const allowUnauthenticated = process.env.ALLOW_UNAUTHENTICATED !== "false";

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
    if (totalLength > 2 * 1024 * 1024) {
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
      service: "mcp-export",
      projectId,
      region
    });
    return;
  }

  if (request.method === "POST" && request.url === "/deploy") {
    try {
      const body = await readJsonBody(request);
      const result = await deployBundle({
        name: body.name,
        files: body.files,
        projectId,
        region,
        allowUnauthenticated
      });

      sendJson(response, 200, {
        ok: true,
        ...result
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

server.listen(port, () => {
  console.log(`mcp-export listening on :${port}`);
});
