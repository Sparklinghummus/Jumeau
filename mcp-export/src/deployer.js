import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function cleanServiceName(name) {
  return String(name || "weather-mcp")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "weather-mcp";
}

function uniqueServiceName(name) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${cleanServiceName(name)}-${suffix}`.slice(0, 49);
}

function validateFiles(files) {
  if (!files || typeof files !== "object" || Array.isArray(files)) {
    throw new Error("Expected a files object.");
  }

  const entries = Object.entries(files);
  if (!entries.length) {
    throw new Error("Bundle is empty.");
  }

  if (entries.length > 20) {
    throw new Error("Bundle has too many files.");
  }

  for (const [filePath, content] of entries) {
    if (typeof filePath !== "string" || !filePath.trim()) {
      throw new Error("Invalid file path.");
    }

    if (path.isAbsolute(filePath) || filePath.includes("..")) {
      throw new Error(`Unsafe file path: ${filePath}`);
    }

    if (typeof content !== "string") {
      throw new Error(`File content must be a string: ${filePath}`);
    }

    if (content.length > 500_000) {
      throw new Error(`File too large: ${filePath}`);
    }
  }

  return entries;
}

async function writeBundle(bundleDir, files) {
  const entries = validateFiles(files);

  for (const [relativePath, content] of entries) {
    const absolutePath = path.join(bundleDir, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }
}

async function execGcloud(args) {
  const { stdout, stderr } = await execFileAsync("gcloud", args, {
    maxBuffer: 10 * 1024 * 1024
  });

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim()
  };
}

export async function deployBundle({ name, files, projectId, region, allowUnauthenticated }) {
  if (!projectId) {
    throw new Error("Missing GCP_PROJECT_ID.");
  }

  if (!region) {
    throw new Error("Missing GCP_REGION.");
  }

  const serviceName = uniqueServiceName(name);
  const bundleDir = await mkdtemp(path.join(tmpdir(), `${serviceName}-`));

  await writeBundle(bundleDir, files);

  const deployArgs = [
    "run",
    "deploy",
    serviceName,
    "--source",
    bundleDir,
    "--project",
    projectId,
    "--region",
    region,
    "--quiet"
  ];

  deployArgs.push(allowUnauthenticated ? "--allow-unauthenticated" : "--no-allow-unauthenticated");

  await execGcloud(deployArgs);

  const serviceDescribe = await execGcloud([
    "run",
    "services",
    "describe",
    serviceName,
    "--project",
    projectId,
    "--region",
    region,
    "--format=value(status.url)"
  ]);

  const serviceUrl = serviceDescribe.stdout;
  if (!serviceUrl) {
    throw new Error("Cloud Run deploy succeeded but no service URL was returned.");
  }

  return {
    serviceName,
    serviceUrl,
    mcpUrl: `${serviceUrl}/mcp`
  };
}
