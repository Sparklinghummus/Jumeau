# MCP Export

This folder is the Cloud Run deployer for the one-click MCP export.

## What it does

- receives generated MCP files from the extension
- writes them to `/tmp`
- runs `gcloud run deploy --source`
- returns the final hosted `/mcp` URL

## Required env vars

- `GCP_PROJECT_ID`
- `GCP_REGION`
- optional: `ALLOW_UNAUTHENTICATED=true`

## Important GCP note

The deployer needs a service account that can deploy Cloud Run services.

For a fast MVP, give the deployer service account these roles on the project:

- `Cloud Run Admin`
- `Cloud Build Editor`
- `Artifact Registry Writer`
- `Service Account User`

## Local run

You need the `gcloud` CLI already installed and authenticated on your machine.

```bash
cd mcp-export
npm install
GCP_PROJECT_ID=YOUR_PROJECT_ID GCP_REGION=europe-west1 npm start
```

## Fast GCP setup

1. Enable APIs once:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

2. Create or choose a deployer service account.
3. Give it the roles listed above.
4. Deploy this service with its Dockerfile:

```bash
cd mcp-export
gcloud run deploy jumeau-mcp-export \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT_ID,GCP_REGION=europe-west1
```

5. Copy the Cloud Run URL.
6. In the extension options page, paste that URL into `MCP Deployer URL`.

## MVP flow

- the extension sends a small weather MCP bundle
- this service deploys it
- it returns `serviceUrl` and `mcpUrl`
