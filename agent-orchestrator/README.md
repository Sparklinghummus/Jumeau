# Agent Orchestrator

This folder is the Cloud Run live orchestrator for the browser MVP.

## What it does

- exposes `POST /act` for one-shot action tests
- exposes `GET /health`
- exposes `WS /live` for the real Gemini Live proxy session

For the live path:
- the extension opens a WebSocket to Cloud Run
- Cloud Run opens the Gemini Live WebSocket
- Cloud Run proxies audio, screenshots, text, tool calls, and tool responses
- the Gemini API key stays only on the backend

## Required env vars

- `GEMINI_API_KEY`
- optional: `GEMINI_MODEL`
- optional: `GEMINI_LIVE_MODEL`

## Local run

```bash
cd agent-orchestrator
npm install
GEMINI_API_KEY=YOUR_KEY npm start
```

Health check:

```bash
curl http://localhost:8080/health
```

Live WebSocket endpoint:

```txt
ws://localhost:8080/live
```

## Fast GCP setup

1. Pick your project and region.
2. Enable Cloud Run once:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

3. Deploy:

```bash
cd agent-orchestrator
gcloud run deploy jumeau-agent-orchestrator \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

4. Copy the Cloud Run URL.
5. In the extension options page, paste that URL into `Orchestrator URL`.

## Notes

- The extension can still use `POST /act`, but the real replacement for the old client-side Gemini Live session is `WS /live`.
- The extension keeps local capture and local browser execution.
- Cloud Run now owns the upstream Gemini Live session.
