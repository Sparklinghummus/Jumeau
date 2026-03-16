declare const chrome: any;

export interface PersistedWorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action" | "branch";
  title: string;
  category: string;
  description: string;
  status: "pending" | "running" | "completed";
  children: string[];
  branchLabels?: string[];
  params?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
}

export interface PersistedWorkflow {
  id: string;
  title: string;
  goal: string;
  trigger: string;
  summary: string;
  domain: string;
  status: "draft" | "published" | "archived";
  entryNodeId: string | null;
  createdAt: number;
  updatedAt: number;
  nodes: PersistedWorkflowNode[];
}

export interface LiveCanvasState {
  version: number;
  currentWorkflowId: string | null;
  workflows: PersistedWorkflow[];
  questions: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  transcriptions: Array<Record<string, unknown>>;
}

const LIVE_CANVAS_STORAGE_KEY = "liveCanvasState";

function emptyState(): LiveCanvasState {
  return {
    version: 2,
    currentWorkflowId: null,
    workflows: [],
    questions: [],
    actions: [],
    transcriptions: [],
  };
}

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function normalizeNodeType(rawType: unknown, rawNode: Record<string, unknown>) {
  const type = cleanText(rawType).toLowerCase();
  const childCount = Array.isArray(rawNode.children) ? rawNode.children.length : 0;
  const branchLabelCount = Array.isArray(rawNode.branchLabels) ? rawNode.branchLabels.length : 0;

  if (type === "trigger" || type === "condition" || type === "action" || type === "branch") {
    return type === "condition" && (childCount > 1 || branchLabelCount > 1) ? "branch" : type;
  }

  if (type === "decision") {
    return childCount > 1 || branchLabelCount > 1 ? "branch" : "condition";
  }

  return childCount > 1 || branchLabelCount > 1 ? "branch" : "action";
}

function normalizeNodeStatus(value: unknown): PersistedWorkflowNode["status"] {
  const status = cleanText(value, "pending").toLowerCase();
  if (status === "completed" || status === "running") {
    return status;
  }
  if (status === "done") {
    return "completed";
  }
  return "pending";
}

function normalizeWorkflowNode(rawNode: Record<string, unknown>): PersistedWorkflowNode {
  const type = normalizeNodeType(rawNode.type, rawNode);
  return {
    id: cleanText(rawNode.id),
    type: type as PersistedWorkflowNode["type"],
    title: cleanText(rawNode.title || rawNode.label, "Untitled node"),
    category: cleanText(rawNode.category, type === "trigger" ? "Voice" : type === "action" ? "Actions" : "Condition"),
    description: cleanText(rawNode.description || rawNode.details, "Workflow step"),
    status: normalizeNodeStatus(rawNode.status),
    children: cleanStringArray(rawNode.children),
    branchLabels: cleanStringArray(rawNode.branchLabels),
    params:
      rawNode.params && typeof rawNode.params === "object" && !Array.isArray(rawNode.params)
        ? (rawNode.params as Record<string, unknown>)
        : {},
    createdAt: typeof rawNode.createdAt === "number" ? rawNode.createdAt : Date.now(),
    updatedAt: typeof rawNode.updatedAt === "number" ? rawNode.updatedAt : Date.now(),
  };
}

function deriveEntryNodeId(nodes: PersistedWorkflowNode[]) {
  const explicitTrigger = nodes.find((node) => node.type === "trigger");
  if (explicitTrigger) {
    return explicitTrigger.id;
  }

  const children = new Set(nodes.flatMap((node) => node.children || []));
  const root = nodes.find((node) => !children.has(node.id));
  return root?.id || nodes[0]?.id || null;
}

function normalizeWorkflow(rawWorkflow: Record<string, unknown>): PersistedWorkflow {
  const nodes = Array.isArray(rawWorkflow.nodes)
    ? rawWorkflow.nodes.map((node) => normalizeWorkflowNode(node as Record<string, unknown>))
    : [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const entryNodeId = cleanText(rawWorkflow.entryNodeId);

  return {
    id: cleanText(rawWorkflow.id),
    title: cleanText(rawWorkflow.title || rawWorkflow.name, "Untitled workflow"),
    goal: cleanText(rawWorkflow.goal, ""),
    trigger: cleanText(rawWorkflow.trigger, ""),
    summary: cleanText(rawWorkflow.summary || rawWorkflow.description, ""),
    domain: cleanText(rawWorkflow.domain, ""),
    status: cleanText(rawWorkflow.status, "draft") === "published"
      ? "published"
      : cleanText(rawWorkflow.status, "draft") === "archived"
        ? "archived"
        : "draft",
    entryNodeId: nodeIds.has(entryNodeId) ? entryNodeId : deriveEntryNodeId(nodes),
    createdAt: typeof rawWorkflow.createdAt === "number" ? rawWorkflow.createdAt : Date.now(),
    updatedAt: typeof rawWorkflow.updatedAt === "number" ? rawWorkflow.updatedAt : Date.now(),
    nodes: nodes.map((node) => ({
      ...node,
      children: node.children.filter((childId) => nodeIds.has(childId)),
      branchLabels:
        node.type === "branch"
          ? (node.branchLabels || []).slice(0, node.children.length)
          : undefined,
    })),
  };
}

export function normalizeLiveCanvasState(rawState: unknown): LiveCanvasState {
  if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
    return emptyState();
  }

  const state = rawState as Record<string, unknown>;
  const workflows = Array.isArray(state.workflows)
    ? state.workflows.map((workflow) => normalizeWorkflow(workflow as Record<string, unknown>)).filter((workflow) => workflow.id)
    : [];

  return {
    version: typeof state.version === "number" ? state.version : 2,
    currentWorkflowId: cleanText(state.currentWorkflowId) || workflows[0]?.id || null,
    workflows,
    questions: Array.isArray(state.questions) ? state.questions : [],
    actions: Array.isArray(state.actions) ? state.actions : [],
    transcriptions: Array.isArray(state.transcriptions) ? state.transcriptions : [],
  };
}

export async function readLiveCanvasState() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return emptyState();
  }

  const result = await chrome.storage.local.get([LIVE_CANVAS_STORAGE_KEY]);
  return normalizeLiveCanvasState(result?.[LIVE_CANVAS_STORAGE_KEY]);
}

export function subscribeToLiveCanvasState(onChange: (state: LiveCanvasState) => void) {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener = (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
    if (areaName !== "local" || !changes[LIVE_CANVAS_STORAGE_KEY]) {
      return;
    }

    onChange(normalizeLiveCanvasState(changes[LIVE_CANVAS_STORAGE_KEY].newValue));
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export function countWorkflowBranches(workflow: PersistedWorkflow) {
  return workflow.nodes.filter((node) => node.type === "branch").length;
}

export function formatRelativeTime(timestamp?: number) {
  if (!timestamp) {
    return "just now";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
