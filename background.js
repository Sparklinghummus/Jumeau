import { runAgentTurn } from "./agent-orchestrator/extension-client.js";
import { exportWeatherMcp } from "./mcp-export/extension-client.js";

// Service Worker (background.js)
console.log("Jumeau Service Worker initialisé - Mode Live API");

let isRecording = false;
let isInputPaused = false;
let geminiWs = null;
let screenshotInterval = null;
let geminiSessionReady = false;
let isGeminiSpeaking = false;
let currentVoiceActivityLevel = 0;
const GEMINI_LIVE_MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";
const GEMINI_LIVE_ENDPOINT =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const GEMINI_CONNECT_TIMEOUT_MS = 10000;
const LIVE_CANVAS_STORAGE_KEY = "liveCanvasState";
const LIVE_CANVAS_SCHEMA_VERSION = 2;
const MAX_ACTIONS = 60;
const MAX_TRANSCRIPTIONS = 80;
const MAX_QUESTIONS = 12;
const MAX_WORKFLOW_NODES = 24;
let liveCanvasState = createEmptyLiveCanvasState();
let liveCanvasStateLoaded = false;
const liveCanvasStateReady = loadLiveCanvasState();

function logLaunch(label, details) {
  if (details === undefined) {
    console.log(`[LAUNCH] ${label}`);
    return;
  }
  console.log(`[LAUNCH] ${label}`, details);
}

function summarizeFunctionDeclaration(fn) {
  return {
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters,
  };
}

function summarizeGeminiPayload(payload) {
  if (payload.setup) {
    const functionDeclarations = payload.setup.tools?.flatMap((tool) => tool.functionDeclarations || []) || [];
    return {
      type: "setup",
      model: payload.setup.model,
      systemInstruction: payload.setup.systemInstruction?.parts?.map((part) => part.text || "").join("\n") || "",
      tools: functionDeclarations.map(summarizeFunctionDeclaration),
      generationConfig: payload.setup.generationConfig || null,
    };
  }

  if (payload.realtimeInput?.audio) {
    return {
      type: "realtimeInput.audio",
      mimeType: payload.realtimeInput.audio.mimeType,
      base64Length: payload.realtimeInput.audio.data?.length || 0,
    };
  }

  if (payload.realtimeInput?.video) {
    return {
      type: "realtimeInput.video",
      mimeType: payload.realtimeInput.video.mimeType,
      base64Length: payload.realtimeInput.video.data?.length || 0,
    };
  }

  if (payload.clientContent) {
    return {
      type: "clientContent",
      turnComplete: Boolean(payload.clientContent.turnComplete),
      turns: payload.clientContent.turns || [],
    };
  }

  if (payload.toolResponse) {
    return {
      type: "toolResponse",
      functionResponses: payload.toolResponse.functionResponses || [],
    };
  }

  return payload;
}

// Gérer la création du sidepanel au clic sur l'icône de l'extension
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

function createEmptyLiveCanvasState() {
  return {
    version: LIVE_CANVAS_SCHEMA_VERSION,
    currentWorkflowId: null,
    workflows: [],
    questions: [],
    actions: [],
    transcriptions: [],
  };
}

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, resolve);
  });
}

function toWebSocketUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/live";
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function loadLiveCanvasState() {
  try {
    const result = await storageGet([LIVE_CANVAS_STORAGE_KEY]);
    if (result[LIVE_CANVAS_STORAGE_KEY]) {
      liveCanvasState = normalizeLiveCanvasState(result[LIVE_CANVAS_STORAGE_KEY]);
    }
  } catch (error) {
    console.error("Erreur lors du chargement du live canvas :", error);
    liveCanvasState = createEmptyLiveCanvasState();
  } finally {
    liveCanvasStateLoaded = true;
  }
}

async function ensureLiveCanvasStateReady() {
  if (!liveCanvasStateLoaded) {
    await liveCanvasStateReady;
  }
}

function normalizeLiveCanvasState(rawState = {}) {
  const state = createEmptyLiveCanvasState();
  const rawWorkflows = Array.isArray(rawState.workflows) ? rawState.workflows : [];
  const workflowIds = new Set();

  state.workflows = rawWorkflows
    .map((workflow) => normalizeWorkflowRecord(workflow))
    .filter((workflow) => {
      if (workflowIds.has(workflow.id)) {
        return false;
      }
      workflowIds.add(workflow.id);
      return true;
    });

  state.questions = (Array.isArray(rawState.questions) ? rawState.questions : []).map((question) =>
    normalizeWorkflowQuestion(question),
  );
  state.actions = (Array.isArray(rawState.actions) ? rawState.actions : []).map((action) =>
    createCanvasAction(action),
  );
  state.transcriptions = (Array.isArray(rawState.transcriptions) ? rawState.transcriptions : []).map((entry) =>
    createCanvasTranscription(entry),
  );
  state.currentWorkflowId =
    cleanText(rawState.currentWorkflowId) && workflowIds.has(rawState.currentWorkflowId)
      ? rawState.currentWorkflowId
      : state.workflows[0]?.id || null;

  trimLiveCanvasState(state);
  return state;
}

function cloneLiveCanvasState() {
  return JSON.parse(JSON.stringify(liveCanvasState));
}

function createEntityId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function cleanStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 8);
}

function cleanObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

function parseJsonValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function normalizeWorkflowStatus(value) {
  const status = cleanText(value, "draft").toLowerCase();
  if (status === "published" || status === "archived") {
    return status;
  }
  return "draft";
}

function normalizeWorkflowNodeStatus(value) {
  const status = cleanText(value, "pending").toLowerCase();
  if (status === "done") return "completed";
  if (status === "thinking") return "running";
  if (status === "ready" || status === "draft") return "pending";
  if (status === "completed" || status === "running") return status;
  return "pending";
}

function defaultBranchLabel(index) {
  if (index === 0) return "True";
  if (index === 1) return "False";
  return `Path ${index + 1}`;
}

function normalizeWorkflowNodeType(value, rawNode = {}) {
  const type = cleanText(value).toLowerCase();
  const childCount = Array.isArray(rawNode.children) ? rawNode.children.filter(Boolean).length : 0;
  const branchLabelCount = Array.isArray(rawNode.branchLabels) ? rawNode.branchLabels.filter(Boolean).length : 0;

  if (type === "trigger" || type === "condition" || type === "action" || type === "branch") {
    return type === "condition" && (childCount > 1 || branchLabelCount > 1) ? "branch" : type;
  }

  if (type === "decision") {
    return childCount > 1 || branchLabelCount > 1 ? "branch" : "condition";
  }

  if (type === "observe" || type === "step" || type === "output" || type === "question" || type === "integration") {
    return "action";
  }

  return childCount > 1 || branchLabelCount > 1 ? "branch" : "action";
}

function normalizeWorkflowNodeCategory(value, type, params = {}) {
  const category = cleanText(value);
  if (category) {
    return category;
  }

  if (type === "trigger") {
    return "Voice";
  }

  if (type === "condition" || type === "branch") {
    return "Condition";
  }

  if (cleanText(params.integration)) {
    return "Integrations";
  }

  const operation = cleanText(params.operation).toLowerCase();
  if (operation.includes("classif") || operation.includes("enrich")) return "AI";
  if (operation.includes("list")) return "Lists";
  if (operation.includes("record") || operation.includes("tracker")) return "Records";

  return "Actions";
}

function normalizeNodeParams(value, rawNode = {}) {
  const parsed = typeof value === "string" ? parseJsonValue(value) : value;
  const params = cleanObject(parsed);

  if (cleanText(rawNode.rationale) && !params.rationale) {
    params.rationale = cleanText(rawNode.rationale);
  }

  return params;
}

function normalizeWorkflowNodeRecord(rawNode = {}) {
  const type = normalizeWorkflowNodeType(rawNode.type || rawNode.nodeType, rawNode);
  const params = normalizeNodeParams(rawNode.params, rawNode);

  return {
    id: cleanText(rawNode.id, createEntityId("node")),
    type,
    title: cleanText(rawNode.title || rawNode.label, "Untitled node"),
    category: normalizeWorkflowNodeCategory(rawNode.category, type, params),
    description: cleanText(rawNode.description || rawNode.details, "Workflow step"),
    status: normalizeWorkflowNodeStatus(rawNode.status),
    children: cleanStringArray(rawNode.children),
    branchLabels: cleanStringArray(rawNode.branchLabels),
    params,
    createdAt: typeof rawNode.createdAt === "number" ? rawNode.createdAt : Date.now(),
    updatedAt: typeof rawNode.updatedAt === "number" ? rawNode.updatedAt : Date.now(),
  };
}

function deriveEntryNodeId(nodes = []) {
  const triggerNode = nodes.find((node) => node.type === "trigger");
  if (triggerNode) {
    return triggerNode.id;
  }

  const childIds = new Set(nodes.flatMap((node) => (Array.isArray(node.children) ? node.children : [])));
  const rootNode = nodes.find((node) => !childIds.has(node.id));
  return rootNode?.id || nodes[0]?.id || null;
}

function normalizeWorkflowRecord(rawWorkflow = {}) {
  const rawNodes = Array.isArray(rawWorkflow.nodes) ? rawWorkflow.nodes : [];
  const seenNodeIds = new Set();
  const nodes = rawNodes
    .map((node) => normalizeWorkflowNodeRecord(node))
    .filter((node) => {
      if (seenNodeIds.has(node.id)) {
        return false;
      }
      seenNodeIds.add(node.id);
      return true;
    });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const normalizedNodes = nodes.map((node) => {
    const maxChildren = node.type === "branch" ? 8 : 1;
    const children = cleanStringArray(node.children)
      .filter((childId) => childId !== node.id && nodeIds.has(childId))
      .slice(0, maxChildren);
    const nextNode = {
      ...node,
      children,
    };

    if (node.type === "branch") {
      const branchLabels = cleanStringArray(node.branchLabels);
      nextNode.branchLabels = children.map((_, index) => branchLabels[index] || defaultBranchLabel(index));
    } else {
      delete nextNode.branchLabels;
    }

    return nextNode;
  });

  const explicitEntryNodeId = cleanText(rawWorkflow.entryNodeId);

  return {
    id: cleanText(rawWorkflow.id, createEntityId("workflow")),
    title: cleanText(rawWorkflow.title || rawWorkflow.name, "Untitled workflow"),
    goal: cleanText(rawWorkflow.goal || rawWorkflow.objective, "Workflow detected during observation"),
    trigger: cleanText(rawWorkflow.trigger, ""),
    summary: cleanText(rawWorkflow.summary || rawWorkflow.description, ""),
    domain: cleanText(rawWorkflow.domain, ""),
    status: normalizeWorkflowStatus(rawWorkflow.status),
    entryNodeId: nodeIds.has(explicitEntryNodeId) ? explicitEntryNodeId : deriveEntryNodeId(normalizedNodes),
    createdAt: typeof rawWorkflow.createdAt === "number" ? rawWorkflow.createdAt : Date.now(),
    updatedAt: typeof rawWorkflow.updatedAt === "number" ? rawWorkflow.updatedAt : Date.now(),
    nodes: normalizedNodes,
  };
}

function normalizeWorkflowQuestion(rawQuestion = {}) {
  return {
    id: cleanText(rawQuestion.id, createEntityId("question")),
    workflowId: cleanText(rawQuestion.workflowId) || null,
    text: cleanText(rawQuestion.text || rawQuestion.question, "What is the next step of this workflow?"),
    context: cleanText(rawQuestion.context, ""),
    suggestedAnswers: cleanStringArray(rawQuestion.suggestedAnswers || rawQuestion.options),
    createdAt: typeof rawQuestion.createdAt === "number" ? rawQuestion.createdAt : Date.now(),
  };
}

function trimLiveCanvasState(state) {
  state.version = LIVE_CANVAS_SCHEMA_VERSION;
  state.actions = state.actions.slice(-MAX_ACTIONS);
  state.transcriptions = state.transcriptions.slice(-MAX_TRANSCRIPTIONS);
  state.questions = state.questions.slice(-MAX_QUESTIONS);
  state.workflows = state.workflows.map((workflow) => ({
    ...workflow,
    nodes: Array.isArray(workflow.nodes) ? workflow.nodes.slice(-MAX_WORKFLOW_NODES) : [],
  }));
  if (!state.workflows.some((workflow) => workflow.id === state.currentWorkflowId)) {
    state.currentWorkflowId = state.workflows[0]?.id || null;
  }
}

async function syncLiveCanvasState() {
  await storageSet({ [LIVE_CANVAS_STORAGE_KEY]: liveCanvasState });
  chrome.runtime
    .sendMessage({
      target: "sidepanel",
      type: "SYNC_CANVAS_STATE",
      state: cloneLiveCanvasState(),
    })
    .catch(() => {});
}

async function mutateLiveCanvasState(mutator) {
  await ensureLiveCanvasStateReady();
  const result = mutator(liveCanvasState);
  liveCanvasState = normalizeLiveCanvasState(liveCanvasState);
  await syncLiveCanvasState();
  return result;
}

async function clearLiveCanvasState() {
  await ensureLiveCanvasStateReady();
  liveCanvasState = createEmptyLiveCanvasState();
  await syncLiveCanvasState();
  return cloneLiveCanvasState();
}

function createCanvasAction(action) {
  return {
    id: createEntityId("action"),
    title: cleanText(action.title, "Action"),
    description: cleanText(action.description, ""),
    icon: cleanText(action.icon, "sparkles"),
    timestamp: action.timestamp || Date.now(),
  };
}

function createCanvasTranscription(entry) {
  return {
    id: createEntityId("tx"),
    role: entry.role === "user" ? "user" : "assistant",
    text: cleanText(entry.text, ""),
    timestamp: entry.timestamp || Date.now(),
  };
}

async function addCanvasAction(action) {
  return mutateLiveCanvasState((state) => {
    state.actions.push(createCanvasAction(action));
  });
}

async function addCanvasTranscription(entry) {
  return mutateLiveCanvasState((state) => {
    state.transcriptions.push(createCanvasTranscription(entry));
  });
}

function findWorkflow(state, args = {}) {
  const workflowId = cleanText(args.workflowId);
  const workflowTitle = cleanText(args.workflowTitle || args.title || args.name).toLowerCase();
  const currentWorkflowId = cleanText(state.currentWorkflowId);

  if (!workflowId && !workflowTitle && currentWorkflowId) {
    return state.workflows.find((workflow) => workflow.id === currentWorkflowId) || null;
  }

  return (
    state.workflows.find((workflow) => {
      if (workflowId && workflow.id === workflowId) {
        return true;
      }

      return workflowTitle && workflow.title.toLowerCase() === workflowTitle;
    }) || null
  );
}

function ensureWorkflowRecord(state, args = {}) {
  let workflow = findWorkflow(state, args);

  if (workflow) {
    return workflow;
  }

  const title = cleanText(args.workflowTitle || args.title || args.name, "Current workflow");
  workflow = normalizeWorkflowRecord({
    id: cleanText(args.workflowId, createEntityId("workflow")),
    title,
    goal: cleanText(args.workflowGoal || args.goal, "Structure the observed process"),
    trigger: cleanText(args.trigger, "Triggered from sidepanel"),
    summary: cleanText(args.summary, "Workflow created to receive new nodes"),
    domain: cleanText(args.domain, ""),
    status: cleanText(args.workflowStatus || args.status, "draft"),
    nodes: [],
  });
  state.workflows.push(workflow);
  return workflow;
}

function findWorkflowNode(workflow, args = {}) {
  const nodeId = cleanText(args.nodeId);
  const nodeTitle = cleanText(args.nodeTitle || args.title || args.label).toLowerCase();

  return (
    (workflow.nodes || []).find((node) => {
      if (nodeId && node.id === nodeId) {
        return true;
      }

      return nodeTitle && node.title.toLowerCase() === nodeTitle;
    }) || null
  );
}

async function upsertWorkflowFromTool(args = {}) {
  return mutateLiveCanvasState((state) => {
    const title = cleanText(args.title || args.name, "Nouveau workflow");
    const goal = cleanText(args.goal || args.objective, "Workflow détecté pendant l’observation");
    const trigger = cleanText(args.trigger, "Déclenché depuis le contexte écran");
    const summary = cleanText(args.summary || args.description, "Blueprint en cours de construction");
    const domain = cleanText(args.domain, "");

    let workflow = findWorkflow(state, { workflowId: args.workflowId, workflowTitle: title });
    let created = false;

    if (!workflow) {
      workflow = normalizeWorkflowRecord({
        id: createEntityId("workflow"),
        title,
        goal,
        trigger,
        summary,
        domain,
        status: cleanText(args.status, "draft"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodes: [],
      });
      state.workflows.push(workflow);
      created = true;
    } else {
      workflow.goal = goal || workflow.goal;
      workflow.trigger = trigger || workflow.trigger;
      workflow.summary = summary || workflow.summary;
      workflow.domain = domain || workflow.domain;
      workflow.status = normalizeWorkflowStatus(args.status || workflow.status);
      workflow.updatedAt = Date.now();
    }

    state.currentWorkflowId = workflow.id;
    state.actions.push(
      createCanvasAction({
        title: created ? `Nouveau workflow : ${workflow.title}` : `Workflow mis à jour : ${workflow.title}`,
        description: created ? workflow.goal : workflow.summary,
        icon: "git-branch",
      }),
    );

    return { workflow, created };
  });
}

async function addWorkflowNodeFromTool(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = ensureWorkflowRecord(state, args);
    const existingNode = findWorkflowNode(workflow, args);
    const node = normalizeWorkflowNodeRecord({
      ...existingNode,
      id: cleanText(args.nodeId, existingNode?.id || createEntityId("node")),
      type: args.nodeType || args.type || existingNode?.type,
      title: args.title || args.label || existingNode?.title,
      category: args.category || existingNode?.category,
      description: args.description || args.details || existingNode?.description,
      status: args.status || existingNode?.status,
      children: args.children || existingNode?.children,
      branchLabels: args.branchLabels || existingNode?.branchLabels,
      params: args.params ?? existingNode?.params,
      rationale: args.rationale || existingNode?.params?.rationale,
      createdAt: existingNode?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });

    if (existingNode) {
      workflow.nodes = workflow.nodes.map((currentNode) => (currentNode.id === node.id ? node : currentNode));
    } else {
      workflow.nodes.push(node);
    }

    if (!workflow.entryNodeId || node.type === "trigger") {
      workflow.entryNodeId = workflow.entryNodeId || node.id;
    }

    workflow.updatedAt = Date.now();
    state.currentWorkflowId = workflow.id;
    state.actions.push(
      createCanvasAction({
        title: `${existingNode ? "Noeud mis à jour" : "Noeud ajouté"} : ${node.title}`,
        description: `${workflow.title} · ${node.description}`,
        icon: "plus",
      }),
    );

    return { workflow, node, created: !existingNode };
  });
}

async function addWorkflowQuestionFromTool(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = findWorkflow(state, args);
    const question = {
      id: createEntityId("question"),
      workflowId: workflow?.id || state.currentWorkflowId || null,
      text: cleanText(args.question, "Quelle est la prochaine étape de ce process ?"),
      context: cleanText(args.context, ""),
      suggestedAnswers: cleanStringArray(args.suggestedAnswers || args.options),
      createdAt: Date.now(),
    };

    state.questions.push(question);
    state.actions.push(
      createCanvasAction({
        title: "Question de clarification",
        description: question.text,
        icon: "message-square",
      }),
    );

    return question;
  });
}

async function linkWorkflowNodesFromTool(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = ensureWorkflowRecord(state, args);
    const fromNodeId = cleanText(args.from || args.fromNodeId);
    const toNodeId = cleanText(args.to || args.toNodeId);

    if (!fromNodeId || !toNodeId) {
      throw new Error("Both from and to node ids are required");
    }

    const fromNode = (workflow.nodes || []).find((node) => node.id === fromNodeId);
    const toNode = (workflow.nodes || []).find((node) => node.id === toNodeId);

    if (!fromNode || !toNode) {
      throw new Error("Both linked nodes must exist in the workflow");
    }

    const nextChildren = Array.from(new Set([...(Array.isArray(fromNode.children) ? fromNode.children : []), toNodeId]));
    fromNode.children = fromNode.type === "branch" ? nextChildren.slice(0, 8) : nextChildren.slice(0, 1);
    fromNode.updatedAt = Date.now();
    workflow.updatedAt = Date.now();
    if (!workflow.entryNodeId && fromNode.type === "trigger") {
      workflow.entryNodeId = fromNode.id;
    }
    state.currentWorkflowId = workflow.id;
    state.actions.push(
      createCanvasAction({
        title: "Lien de workflow ajouté",
        description: `${fromNode.title} -> ${toNode.title}`,
        icon: "git-branch",
      }),
    );

    return { workflow, fromNode, toNode };
  });
}

async function setWorkflowBranchFromTool(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = ensureWorkflowRecord(state, args);
    const branchNode = findWorkflowNode(workflow, args);

    if (!branchNode) {
      throw new Error("Branch node not found");
    }

    const rawBranches = Array.isArray(args.branches) ? args.branches : parseJsonValue(args.branches);
    if (!Array.isArray(rawBranches) || rawBranches.length < 2) {
      throw new Error("At least two branch definitions are required");
    }

    const branches = rawBranches
      .map((branch, index) => ({
        label: cleanText(branch?.label, defaultBranchLabel(index)),
        to: cleanText(branch?.to || branch?.toNodeId || branch?.nodeId),
      }))
      .filter((branch) => branch.to);

    if (branches.length < 2) {
      throw new Error("At least two valid branch targets are required");
    }

    const nodeIds = new Set((workflow.nodes || []).map((node) => node.id));
    const validBranches = branches.filter((branch) => nodeIds.has(branch.to));
    if (validBranches.length < 2) {
      throw new Error("Branch targets must reference existing nodes");
    }

    branchNode.type = "branch";
    branchNode.category = "Condition";
    branchNode.children = validBranches.map((branch) => branch.to);
    branchNode.branchLabels = validBranches.map((branch) => branch.label);
    branchNode.params = {
      ...cleanObject(branchNode.params),
      ...normalizeNodeParams(args.params),
      mode: cleanText(args.mode, cleanText(branchNode.params?.mode, "label_match")),
      field: cleanText(args.field, cleanText(branchNode.params?.field, "")),
    };
    branchNode.updatedAt = Date.now();
    workflow.updatedAt = Date.now();
    state.currentWorkflowId = workflow.id;
    state.actions.push(
      createCanvasAction({
        title: `Branches mises à jour : ${branchNode.title}`,
        description: validBranches.map((branch) => branch.label).join(" · "),
        icon: "git-branch",
      }),
    );

    return { workflow, node: branchNode };
  });
}

async function setWorkflowEntryFromTool(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = ensureWorkflowRecord(state, args);
    const nodeId = cleanText(args.nodeId || args.entryNodeId);
    const node = (workflow.nodes || []).find((currentNode) => currentNode.id === nodeId);

    if (!node) {
      throw new Error("Entry node not found");
    }

    workflow.entryNodeId = node.id;
    workflow.updatedAt = Date.now();
    state.currentWorkflowId = workflow.id;
    state.actions.push(
      createCanvasAction({
        title: `Entrée du workflow définie`,
        description: `${workflow.title} démarre sur ${node.title}`,
        icon: "play",
      }),
    );

    return { workflow, node };
  });
}

async function setCurrentWorkflowFromMessage(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = findWorkflow(state, args);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    state.currentWorkflowId = workflow.id;
    return workflow;
  });
}

async function reorderWorkflowNodesFromMessage(args = {}) {
  return mutateLiveCanvasState((state) => {
    const workflow = findWorkflow(state, args);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const requestedNodeIds = Array.isArray(args.nodeIds)
      ? args.nodeIds.map((nodeId) => cleanText(nodeId)).filter(Boolean)
      : [];

    if (!requestedNodeIds.length) {
      throw new Error("No node order provided");
    }

    const nodeMap = new Map((workflow.nodes || []).map((node) => [node.id, node]));
    const reorderedNodes = [];

    requestedNodeIds.forEach((nodeId) => {
      const node = nodeMap.get(nodeId);
      if (!node) {
        return;
      }

      reorderedNodes.push(node);
      nodeMap.delete(nodeId);
    });

    workflow.nodes = reorderedNodes.concat(Array.from(nodeMap.values()));
    workflow.updatedAt = Date.now();
    state.currentWorkflowId = workflow.id;

    return workflow;
  });
}

function normalizeToolArgs(args) {
  if (!args) return {};
  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch (_) {
      return {};
    }
  }
  return args;
}

function sendSidepanelStatus(status) {
  chrome.runtime
    .sendMessage({
      target: "sidepanel",
      type: "STATUS_UPDATE",
      status,
    })
    .catch(() => {});
}

function sendSidepanelPauseState() {
  chrome.runtime
    .sendMessage({
      target: "sidepanel",
      type: "INPUT_PAUSE_UPDATE",
      isPaused: isInputPaused,
    })
    .catch(() => {});
}

function getCurrentSessionStatus() {
  if (!isRecording) {
    return "ready";
  }

  if (isGeminiSpeaking) {
    return "thinking";
  }

  return isInputPaused ? "paused" : "listening";
}

function sendGeminiToolResponse(mode, functionCall, response) {
  const payload =
    mode === "root"
      ? {
          toolResponse: {
            functionResponses: [
              {
                id: functionCall.id,
                name: functionCall.name,
                response,
              },
            ],
          },
        }
      : {
          clientContent: {
            turns: [
              {
                role: "user",
                parts: [
                  {
                    functionResponse: {
                      id: functionCall.id,
                      name: functionCall.name,
                      response,
                    },
                  },
                ],
              },
            ],
            turnComplete: true,
          },
        };

  logLaunch("Outbound Gemini tool response", summarizeGeminiPayload(payload));

  if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
    geminiWs.send(JSON.stringify(payload));
  }
}

function normalizeCursorCommands(functionCall) {
  let commands = normalizeToolArgs(functionCall.args).commands || [];
  if (commands.length > 0 && typeof commands[0] === "string") {
    const command = commands.find((entry) => entry.startsWith("cursor"));
    const reason = commands.find((entry) => entry.startsWith("reason:"));
    commands = command ? [{ command, reason: reason ? reason.replace("reason:", "").trim() : "" }] : [];
  }
  return commands;
}

async function executeCursorCommands(functionCall, mode) {
  const commands = normalizeCursorCommands(functionCall);

  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs.length) {
        resolve({
          result: "No active tab",
          details: "Impossible de déplacer le curseur sans onglet actif.",
        });
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          type: "EXECUTE_CURSOR_COMMANDS",
          commands,
        },
        async function () {
          await addCanvasAction({
            title: "Action déclenchée",
            description: "Jumeau a déplacé le curseur pour montrer un élément à l’écran.",
            icon: "mouse-pointer",
          });

          const response = {
            result: "Commands executed successfully",
            details: "Cursor has successfully moved to the target cells.",
          };
          sendGeminiToolResponse(mode, functionCall, response);
          resolve(response);
        },
      );
    });
  });
}

async function handleGeminiFunctionCall(functionCall, mode) {
  const args = normalizeToolArgs(functionCall.args);
  logLaunch("Inbound Gemini tool call", {
    mode,
    id: functionCall.id,
    name: functionCall.name,
    args,
  });

  if (functionCall.name === "execute_cursor_commands") {
    await executeCursorCommands(functionCall, mode);
    return;
  }

  if (functionCall.name === "create_workflow" || functionCall.name === "workflow_upsert") {
    const result = await upsertWorkflowFromTool(args);
    sendGeminiToolResponse(mode, functionCall, {
      ok: true,
      mocked: true,
      workflowId: result.workflow.id,
      title: result.workflow.title,
      result: result.created ? "Workflow created in sidepanel" : "Workflow updated in sidepanel",
    });
    return;
  }

  if (functionCall.name === "add_workflow_node" || functionCall.name === "workflow_add_node") {
    const result = await addWorkflowNodeFromTool(args);
    sendGeminiToolResponse(mode, functionCall, {
      ok: true,
      mocked: true,
      workflowId: result.workflow.id,
      nodeId: result.node.id,
      result: "Workflow node added to sidepanel",
    });
    return;
  }

  if (functionCall.name === "workflow_link_nodes") {
    const result = await linkWorkflowNodesFromTool(args);
    sendGeminiToolResponse(mode, functionCall, {
      ok: true,
      mocked: true,
      workflowId: result.workflow.id,
      fromNodeId: result.fromNode.id,
      toNodeId: result.toNode.id,
      result: "Workflow nodes linked in sidepanel",
    });
    return;
  }

  if (functionCall.name === "workflow_set_branch") {
    const result = await setWorkflowBranchFromTool(args);
    sendGeminiToolResponse(mode, functionCall, {
      ok: true,
      mocked: true,
      workflowId: result.workflow.id,
      nodeId: result.node.id,
      result: "Workflow branch configured in sidepanel",
    });
    return;
  }

  if (functionCall.name === "workflow_set_entry") {
    const result = await setWorkflowEntryFromTool(args);
    sendGeminiToolResponse(mode, functionCall, {
      ok: true,
      mocked: true,
      workflowId: result.workflow.id,
      nodeId: result.node.id,
      result: "Workflow entry set in sidepanel",
    });
    return;
  }

  if (functionCall.name === "ask_workflow_question" || functionCall.name === "workflow_ask_question") {
    const question = await addWorkflowQuestionFromTool(args);
    sendGeminiToolResponse(mode, functionCall, {
      ok: true,
      mocked: true,
      questionId: question.id,
      result: "Clarifying question added to sidepanel",
    });
    return;
  }

  sendGeminiToolResponse(mode, functionCall, {
    ok: false,
    error: `Unsupported tool: ${functionCall.name}`,
  });
}

// Gérer la création de l'offscreen document pour l'audio
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  if (chrome.offscreen) {
    try {
      await chrome.offscreen.createDocument({
        url: path,
        reasons: ["USER_MEDIA"],
        justification: "Enregistrement audio pour interaction vocale IA",
      });
      console.log("Offscreen document créé avec succès.");
    } catch (e) {
      console.error("Erreur lors de la création de l'offscreen :", e);
    }
  }
}

function sendOffscreenMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response || response.ok !== false) {
        resolve(response);
        return;
      }

      reject(deserializeError(response.error));
    });
  });
}

function deserializeError(errorLike) {
  const error = new Error(errorLike?.message || "Erreur inconnue");
  error.name = errorLike?.name || "Error";

  if (errorLike?.constraint) {
    error.constraint = errorLike.constraint;
  }

  if (errorLike?.stack) {
    error.stack = errorLike.stack;
  }

  return error;
}

function formatError(error) {
  if (!error) {
    return "Erreur inconnue";
  }

  if (typeof error === "string") {
    return error;
  }

  const parts = [error.name, error.message].filter(Boolean);

  if (error.constraint) {
    parts.push(`constraint=${error.constraint}`);
  }

  return parts.join(": ");
}

function toUserErrorMessage(error) {
  if (!error) {
    return "Erreur inconnue";
  }

  if (error.name === "NotAllowedError") {
    return 'Accès micro refusé ou demande fermée. Ouvre les options de l\'extension puis clique sur "Autoriser le Micro".';
  }

  if (error.name === "NotFoundError") {
    return "Aucun microphone disponible. Vérifie qu'un micro est connecté et activé.";
  }

  if (error.message && error.message.includes("API key not valid")) {
    return "La clé API Gemini est invalide ou expirée. Veuillez la vérifier dans les options de l'extension.";
  }

  if (error.name === "NotReadableError") {
    return "Le microphone est occupé par une autre application ou inaccessible.";
  }

  return formatError(error);
}

// Connexion WebSockets vers Gemini Multimodal Live API
async function connectToGeminiLive() {
  return new Promise((resolve, reject) => {
    let settled = false;
    let connectTimeout = null;

    function settleWithError(error) {
      if (settled) return;
      settled = true;
      if (connectTimeout) {
        clearTimeout(connectTimeout);
      }
      reject(error);
    }

    function settleSuccess() {
      if (settled) return;
      settled = true;
      if (connectTimeout) {
        clearTimeout(connectTimeout);
      }
      resolve();
    }

    // Récupérer les settings Live
    chrome.storage.local.get(["apiKey", "orchestratorUrl"], (result) => {
      const apiKey = result.apiKey?.trim();
      const orchestratorUrl = result.orchestratorUrl?.trim();

      if (!orchestratorUrl && !apiKey) {
        console.error("Clé API Gemini introuvable. Veuillez la configurer dans les options.");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) chrome.sidePanel.open({ tabId: tabs[0].id }).catch(() => {});
        });
        chrome.runtime.sendMessage({ target: "sidepanel", type: "SHOW_SETUP" }).catch(() => {});
        settleWithError(new Error("Configure either Orchestrator URL or Gemini API key in the extension options."));
        return;
      }

      let wsUrl = "";
      if (orchestratorUrl) {
        wsUrl = toWebSocketUrl(orchestratorUrl);
        console.error(`[INFO FORCÉE] Tentative de connexion au live orchestrator: ${wsUrl}`);
      } else {
        console.error(`[INFO FORCÉE] Tentative de connexion avec la clé API: ${apiKey.substring(0, 5)}...`);
        wsUrl = `${GEMINI_LIVE_ENDPOINT}?key=${apiKey}`;
      }

      const ws = new WebSocket(wsUrl);
      geminiWs = ws;
      geminiSessionReady = false;
      connectTimeout = setTimeout(() => {
        console.error("⛔️ Timeout de connexion Live. Le serveur n'a jamais envoyé 'setupComplete'.");
        try {
          ws.close();
        } catch (_) {}
        settleWithError(new Error("Timeout de connexion Live"));
      }, GEMINI_CONNECT_TIMEOUT_MS);

      // Hook the send method to log outbound messages
      const originalWsSend = ws.send.bind(ws);
      ws.send = (data) => {
        try {
          const parsed = JSON.parse(data);
          logLaunch("Outbound Gemini payload", summarizeGeminiPayload(parsed));
        } catch (e) {
          /* binary */
        }
        originalWsSend(data);
      };

      ws.onopen = () => {
        if (geminiWs !== ws) {
          return;
        }
        console.error("🟢 [WS OPEN] Socket Live ouverte ! Envoi du setupMessage...");

        // Envoi du message Setup initial
        const setupMessage = {
          setup: {
            model: GEMINI_LIVE_MODEL,
            systemInstruction: {
              parts: [
                {
                  text: `Tu es Jumeau, un assistant IA ambiant qui voit l'écran de l'utilisateur en temps réel, écoute son process et construit un blueprint de workflow dans le sidepanel.

Tu reçois des captures d'écran avec une grille 8x8 superposée (colonnes A-H, lignes 1-8). Cette grille te sert uniquement à localiser les éléments à l'écran.

OBJECTIF :
- Observer ce que l'utilisateur fait.
- Réagir de manière naturelle à ce que tu vois.
- Identifier les étapes répétables ou intéressantes.
- Poser des questions sur le process quand il manque une règle métier.
- Construire un workflow en direct dans le sidepanel via les tools.

COMPORTEMENT ATTENDU :
- Si tu détectes un process ou une automatisation potentielle, annonce-le naturellement puis crée ou mets à jour un workflow via workflow_upsert.
- Dès qu'une étape utile apparaît, ajoute ou mets à jour un noeud via workflow_add_node.
- Relie explicitement les noeuds entre eux via workflow_link_nodes.
- Si un noeud route vers plusieurs issues, configure-le via workflow_set_branch.
- Définis explicitement le point d'entrée via workflow_set_entry dès qu'il est connu.
- Quand une zone reste ambiguë, utilise workflow_ask_question et pose aussi la question à voix haute.
- Les tools ne lancent aucune vraie automatisation : ils servent uniquement à construire un aperçu mocké visible dans le sidepanel.
- Tu peux dire des phrases comme : "c'est intéressant, je crée un nouveau workflow", "j'ajoute un noeud pour cette étape", "il me manque une règle ici".
- Tu comprends toutes les langues de l'utilisateur, y compris le français, mais tu réponds toujours en anglais naturel et fluide.

RÈGLES CRITIQUES :
- RÉPONDS TOUJOURS EN ANGLAIS, même si l'utilisateur parle en français ou dans une autre langue.
- Ne change jamais la langue de tes réponses, sauf si l'utilisateur demande explicitement une traduction ou une citation dans une autre langue.
- Quand tu veux montrer quelque chose à l'utilisateur, utilise le tool execute_cursor_commands avec la cellule correspondante (ex: "cursor move_to D4").
- NE MENTIONNE JAMAIS les coordonnées de grille dans ta parole (pas de "D4", "cellule A1", "case B3", etc.). Parle naturellement : "je te montre ici", "regarde là", "cet élément", etc.
- Parle comme un copilote de process, pas comme un simple commentateur d'écran.`,
                },
              ],
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "execute_cursor_commands",
                    description:
                      "Move the virtual cursor to a specific cell on the screen based on the 8x8 grid (e.g. A1, H8). NEVER mention grid coordinates in speech.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        commands: {
                          type: "ARRAY",
                          description: "Array of commands to execute",
                          items: {
                            type: "OBJECT",
                            properties: {
                              command: {
                                type: "STRING",
                                description: "Command format: 'cursor move_to [cell_id]' (e.g. 'cursor move_to A1')",
                              },
                              reason: { type: "STRING", description: "Reason for the command" },
                            },
                            required: ["command", "reason"],
                          },
                        },
                      },
                      required: ["commands"],
                    },
                  },
                  {
                    name: "workflow_upsert",
                    description:
                      "Create or update a workflow container in the sidepanel using the canonical workflow protocol.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        workflowId: { type: "STRING" },
                        title: { type: "STRING", description: "Workflow title visible in the workflow editor." },
                        goal: { type: "STRING", description: "What the workflow tries to achieve." },
                        trigger: { type: "STRING", description: "What event or action starts the workflow." },
                        summary: { type: "STRING", description: "Short summary of the workflow." },
                        domain: { type: "STRING", description: "Optional domain or app context." },
                        status: { type: "STRING", description: "draft, published, archived." },
                      },
                      required: ["title", "goal"],
                    },
                  },
                  {
                    name: "workflow_add_node",
                    description:
                      "Create or update a workflow node. Use only the canonical node types: trigger, condition, action, branch.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        workflowId: { type: "STRING" },
                        workflowTitle: { type: "STRING" },
                        nodeId: { type: "STRING" },
                        title: { type: "STRING", description: "Node title visible in the editor." },
                        description: { type: "STRING", description: "What this node represents." },
                        category: { type: "STRING", description: "Semantic category such as Voice, Condition, AI, Records, Lists, Integrations." },
                        nodeType: {
                          type: "STRING",
                          description: "One of trigger, condition, action, branch.",
                        },
                        status: { type: "STRING", description: "pending, running, completed." },
                        params: {
                          type: "OBJECT",
                          description: "Type-specific semantic parameters. Never send visual fields here.",
                        },
                      },
                      required: ["title", "description", "category", "nodeType"],
                    },
                  },
                  {
                    name: "workflow_link_nodes",
                    description: "Create a directed edge between two existing nodes in the same workflow.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        workflowId: { type: "STRING" },
                        workflowTitle: { type: "STRING" },
                        from: { type: "STRING", description: "Source node id." },
                        to: { type: "STRING", description: "Target node id." },
                      },
                      required: ["workflowId", "from", "to"],
                    },
                  },
                  {
                    name: "workflow_set_branch",
                    description:
                      "Configure a branch node with labeled outgoing paths. Use this only for branch nodes with two or more outcomes.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        workflowId: { type: "STRING" },
                        workflowTitle: { type: "STRING" },
                        nodeId: { type: "STRING", description: "Branch node id." },
                        branches: {
                          type: "ARRAY",
                          description: "Branch definitions with a visible label and an existing target node id.",
                          items: {
                            type: "OBJECT",
                            properties: {
                              label: { type: "STRING" },
                              to: { type: "STRING" },
                            },
                            required: ["label", "to"],
                          },
                        },
                        mode: { type: "STRING", description: "Optional branching mode like label_match or boolean_split." },
                        field: { type: "STRING", description: "Optional source field used by the branch condition." },
                        params: { type: "OBJECT", description: "Optional semantic configuration." },
                      },
                      required: ["workflowId", "nodeId", "branches"],
                    },
                  },
                  {
                    name: "workflow_set_entry",
                    description: "Set the entry node for the workflow.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        workflowId: { type: "STRING" },
                        workflowTitle: { type: "STRING" },
                        nodeId: { type: "STRING", description: "Entry node id." },
                      },
                      required: ["workflowId", "nodeId"],
                    },
                  },
                  {
                    name: "workflow_ask_question",
                    description:
                      "Store a clarifying workflow question outside the graph when a business rule is missing or ambiguous.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        workflowId: { type: "STRING" },
                        workflowTitle: { type: "STRING" },
                        question: { type: "STRING", description: "The clarification question to ask the user." },
                        context: { type: "STRING", description: "Why the question matters." },
                        suggestedAnswers: {
                          type: "ARRAY",
                          description: "Optional short answer ideas to display in the sidepanel.",
                          items: { type: "STRING" },
                        },
                      },
                      required: ["question"],
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede", // Voix féminine douce
                  },
                },
              },
            },
          },
        };

        logLaunch("Gemini setup prepared", summarizeGeminiPayload(setupMessage));
        ws.send(JSON.stringify(setupMessage));
      };

      ws.onmessage = async (event) => {
        if (geminiWs !== ws) {
          return;
        }
        // Gemini peut renvoyer du binaire ou du JSON en string
        try {
          let textData = event.data;
          if (event.data instanceof Blob) {
            textData = await event.data.text();
          }

          const responseData = JSON.parse(textData);

          if (
            !responseData.serverContent ||
            (!responseData.serverContent.modelTurn && !responseData.serverContent.interrupted)
          ) {
            // On ne loggue pas les trucs triviaux en boucle si ce n'est pas nécessaire, mais on log tout ce qui est modelTurn pour aider au debug
          } else {
            console.error("⬇️ [WS RECEIVED]:", responseData);
          }

          if (responseData.setupComplete) {
            geminiSessionReady = true;
            console.error("✅ Gemini Live prêt (setupComplete reçu).");
            startScreenshotLoop();
            settleSuccess();
            return;
          }

          if (responseData.goAway) {
            console.error("⚠️ Gemini Live goAway :", responseData.goAway);
          }

          if (responseData.serverContent) {
            const modelTurn = responseData.serverContent.modelTurn;
            if (modelTurn) {
              sendSidepanelStatus("thinking");
              for (const part of modelTurn.parts) {
                // Gérer la réception de l'audio !
                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                  // Envoyer au Offscreen pour lecture
                  chrome.runtime.sendMessage({
                    target: "offscreen",
                    type: "PLAY_AUDIO",
                    data: part.inlineData.data, // Base64 PCM
                  });
                }

                // On pourrait aussi gérer le texte si on veut afficher des sous-titres
                if (part.text) {
                  console.error("💬 Gemini dit :", part.text);
                  await addCanvasTranscription({ role: "assistant", text: part.text });
                }

                if (part.functionCall) {
                  logLaunch("Embedded function call detected in model turn", {
                    id: part.functionCall.id,
                    name: part.functionCall.name,
                    args: normalizeToolArgs(part.functionCall.args),
                  });
                  await handleGeminiFunctionCall(part.functionCall, "embedded");
                }
              }
              if (isRecording) {
                sendSidepanelStatus("listening");
              }
            } else if (responseData.serverContent.interrupted) {
              console.error("🛑 Interruption de l'audio par Gemini");
            }
          } else if (responseData.toolCall) {
            // L'API Live envoie les toolCalls au niveau racine (pas dans serverContent)
            sendSidepanelStatus("thinking");
            const functionCalls = responseData.toolCall.functionCalls || [];
            logLaunch(
              "Root tool call batch received",
              functionCalls.map((fc) => ({
                id: fc.id,
                name: fc.name,
                args: normalizeToolArgs(fc.args),
              })),
            );
            for (const fc of functionCalls) {
              await handleGeminiFunctionCall(fc, "root");
            }
            if (isRecording) {
              sendSidepanelStatus("listening");
            }
          }

          if (responseData.error) {
            console.error("❌ ERREUR API Gemini Live:", responseData.error);
            settleWithError(new Error("API Error: " + responseData.error.message));
          }
        } catch (e) {
          // L'erreur de parsing ou autre
          console.error("Erreur de traitement message WebSocket:", e);
        }
      };

      ws.onerror = (error) => {
        if (geminiWs !== ws) {
          return;
        }
        console.error("🔴 [WS ERROR] Erreur WebSocket Live:", error.message || error);
        if (!geminiSessionReady) {
          settleWithError(new Error("Échec de connexion au live orchestrator"));
        }
      };

      ws.onclose = (event) => {
        if (geminiWs !== ws) {
          return;
        }
        const msg = `⚫️ [WS CLOSED] Connexion Live fermée. Code: ${event.code}, Raison: ${event.reason || "Non spécifiée"}`;
        console.error(msg);
        geminiSessionReady = false;
        stopScreenshotLoop();
        settleWithError(new Error(msg));
        stopAudioCapture();
        geminiWs = null;
      };
    });
  });
}
// Gestion des messages venant du Content Script, SidePanel, ou Offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_AUDIO") {
    if (isRecording) {
      stopAudioCapture();
      sendResponse({ isRecording: false });
    } else {
      startAudioCapture()
        .then(() => {
          sendResponse({ isRecording: true });
        })
        .catch((e) => {
          console.error("Erreur lors de startAudioCapture:", e);
          if (e?.name === "NotAllowedError") {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) chrome.sidePanel.open({ tabId: tabs[0].id }).catch(() => {});
            });
            chrome.runtime.sendMessage({ target: "sidepanel", type: "SHOW_SETUP" }).catch(() => {});
          }
          sendResponse({ isRecording: false, error: toUserErrorMessage(e) });
        });
    }
    return true; // Asynchrone
  } else if (message.type === "GET_AUDIO_STATE") {
    sendResponse({ isRecording: isRecording, isPaused: isInputPaused });
    return false;
  } else if (message.type === "GET_LIVE_CANVAS_STATE") {
    ensureLiveCanvasStateReady()
      .then(() => {
        sendResponse({
          state: cloneLiveCanvasState(),
          status: getCurrentSessionStatus(),
        });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  } else if (message.type === "CLEAR_LIVE_CONTEXT") {
    Promise.resolve()
      .then(() => {
        const wasRecording = isRecording;

        if (wasRecording) {
          stopAudioCapture();
        } else {
          sendSidepanelStatus("ready");
        }

        return clearLiveCanvasState().then((clearedState) => ({
          clearedState,
          wasRecording,
        }));
      })
      .then(({ clearedState, wasRecording }) => {
        sendResponse({
          ok: true,
          state: clearedState,
          status: "ready",
          wasRecording,
        });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          error: toUserErrorMessage(error),
          state: cloneLiveCanvasState(),
          status: isRecording ? "listening" : "ready",
        });
      });
    return true;
  } else if (message.type === "SET_CURRENT_WORKFLOW") {
    setCurrentWorkflowFromMessage({ workflowId: message.workflowId })
      .then((workflow) => {
        sendResponse({
          ok: true,
          workflowId: workflow.id,
          state: cloneLiveCanvasState(),
        });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  } else if (message.type === "REORDER_WORKFLOW_NODES") {
    reorderWorkflowNodesFromMessage({
      workflowId: message.workflowId,
      nodeIds: message.nodeIds,
    })
      .then((workflow) => {
        sendResponse({
          ok: true,
          workflowId: workflow.id,
          state: cloneLiveCanvasState(),
        });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  } else if (message.type === "MVP_RUN_AGENT") {
    runAgentTurn({
      userIntent: cleanText(message.userIntent, "Analyze the current page and choose the next safe browser action."),
    })
      .then((result) => {
        sendResponse({
          ok: true,
          ...result,
        });
      })
      .catch((error) => {
        console.error("Erreur MVP_RUN_AGENT:", error);
        sendResponse({
          ok: false,
          error: toUserErrorMessage(error),
        });
      });
    return true;
  } else if (message.type === "MVP_EXPORT_WEATHER_MCP") {
    exportWeatherMcp({
      name: cleanText(message.name, "weather-mcp"),
    })
      .then((result) => {
        sendResponse({
          ok: true,
          ...result,
        });
      })
      .catch((error) => {
        console.error("Erreur MVP_EXPORT_WEATHER_MCP:", error);
        sendResponse({
          ok: false,
          error: toUserErrorMessage(error),
        });
      });
    return true;
  } else if (message.type === "TOGGLE_MUTE") {
    sendOffscreenMessage({ target: "offscreen", type: "TOGGLE_MUTE" })
      .then((response) => {
        sendResponse({ isMuted: response?.isMuted });
      })
      .catch((e) => {
        console.error("Erreur toggle mute offscreen:", e);
        sendResponse({ error: e.message });
      });
    return true; // Asynchrone
  } else if (message.type === "TOGGLE_INPUT_PAUSE") {
    if (!isRecording) {
      sendResponse({ isRecording: false, isPaused: isInputPaused });
      return false;
    }

    isInputPaused = !isInputPaused;
    if (isInputPaused) {
      currentVoiceActivityLevel = 0;
      broadcastVoiceActivity(0);
    }
    sendSidepanelPauseState();
    sendSidepanelStatus(getCurrentSessionStatus());
    sendResponse({ isRecording: true, isPaused: isInputPaused });
    return false;
  } else if (message.type === "AUDIO_CHUNK") {
    // Les données PCM brutes arrivent ici depuis l'offscreen
    if (isGeminiSpeaking || isInputPaused) {
      return false;
    }
    if (geminiWs && geminiSessionReady && geminiWs.readyState === WebSocket.OPEN) {
      // Formatage d'un message ClientContent pour Gemini (realtimeInput)
      const audioMessage = {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: message.data,
          },
        },
      };
      geminiWs.send(JSON.stringify(audioMessage));
    }
  } else if (message.type === "RECORDING_STARTED") {
    console.log("Capture micro démarrée :", message.details);
  } else if (message.type === "PLAYBACK_STARTED") {
    isGeminiSpeaking = true;
    currentVoiceActivityLevel = 0;
    broadcastVoiceActivity(0);
    sendSidepanelPauseState();
    console.log("Lecture audio Gemini démarrée, pause temporaire des inputs live.");
  } else if (message.type === "PLAYBACK_ENDED") {
    isGeminiSpeaking = false;
    console.log("Lecture audio Gemini terminée, reprise des inputs live.");
    if (isRecording) {
      sendSidepanelPauseState();
      sendSidepanelStatus(getCurrentSessionStatus());
    }
  } else if (message.type === "MIC_ACTIVITY") {
    currentVoiceActivityLevel = Math.max(0, Math.min(1, Number(message.level) || 0));
    if (isRecording) {
      broadcastVoiceActivity(currentVoiceActivityLevel);
    }
  } else if (message.type === "RECORDING_ERROR") {
    const error = deserializeError(message.error);
    console.error("Erreur de capture micro :", formatError(error));
    stopAudioCapture();
  }
  return false;
});

async function startAudioCapture() {
  await setupOffscreenDocument("offscreen/offscreen.html");
  isInputPaused = false;

  // Activate halo immediately so the user sees feedback right away
  broadcastPillState(true);
  currentVoiceActivityLevel = 0;
  broadcastVoiceActivity(0);

  try {
    await connectToGeminiLive();
    await sendOffscreenMessage({
      type: "START_RECORDING",
      target: "offscreen",
    });
    isRecording = true;
    sendSidepanelPauseState();
    sendSidepanelStatus(getCurrentSessionStatus());
  } catch (error) {
    // Revert halo if connection fails
    broadcastPillState(false);
    await sendOffscreenMessage({
      type: "STOP_RECORDING",
      target: "offscreen",
    }).catch(() => {});
    throw error;
  }
}

function stopAudioCapture() {
  isRecording = false;
  isInputPaused = false;
  geminiSessionReady = false;
  isGeminiSpeaking = false;
  currentVoiceActivityLevel = 0;
  stopScreenshotLoop();
  sendSidepanelStatus("ready");
  sendSidepanelPauseState();

  // Dire à l'offscreen d'arrêter
  sendOffscreenMessage({
    type: "STOP_RECORDING",
    target: "offscreen",
  }).catch(() => {});

  // Fermer la socket
  if (geminiWs) {
    geminiWs.close();
    geminiWs = null;
  }

  broadcastPillState(false);
  broadcastVoiceActivity(0);
}

function broadcastPillState(isActive) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    chrome.tabs
      .sendMessage(tabs[0].id, {
        type: "UPDATE_PILL_STATE",
        isActive: isActive,
      })
      .catch(() => {});
  });
}

function broadcastVoiceActivity(level) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    chrome.tabs
      .sendMessage(tabs[0].id, {
        type: "UPDATE_VOICE_ACTIVITY",
        level,
      })
      .catch(() => {});
  });
}

// ============================================================================
// BOUCLE AUTO-CAPTURE D'ÉCRAN (1 image/sec)
// ============================================================================

function startScreenshotLoop() {
  if (screenshotInterval) return;
  console.error("📸 Démarrage de la boucle de capture d'écran (1 img/sec)...");
  screenshotInterval = setInterval(async () => {
    if (!geminiWs || !geminiSessionReady || geminiWs.readyState !== WebSocket.OPEN || isGeminiSpeaking || isInputPaused) return;
    try {
      const dataUrl = await captureScreenWithGridTool();
      const base64 = dataUrl.split(",")[1];
      const imageMessage = {
        realtimeInput: {
          video: {
            mimeType: "image/jpeg",
            data: base64,
          },
        },
      };
      geminiWs.send(JSON.stringify(imageMessage));
    } catch (e) {
      console.error("Erreur capture écran auto:", e.message);
    }
  }, 1000);
}

function stopScreenshotLoop() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
    console.error("📸 Boucle de capture d'écran arrêtée.");
  }
}

// ============================================================================
// OUTILS / FONCTIONS (Tools pour l'Agent)
// ============================================================================

/**
 * Capture l'écran actif, demande au content.js d'y dessiner une grille 8x8,
 * et récupère le Data URL de l'image modifiée.
 * Peut être appelé en tant que "Tool" depuis les workers AI.
 */
async function captureScreenWithGridTool() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        reject(new Error("Aucun tab actif trouvé"));
        return;
      }
      const activeTab = tabs[0];

      // Prendre le screenshot de la fenêtre active
      chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "jpeg", quality: 80 }, function (dataUrl) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        console.log("Screenshot pris, envoi au content script pour application de la grille...");

        // Demander au content script de dessiner la grille sur le canvas
        chrome.tabs.sendMessage(
          activeTab.id,
          {
            type: "PROCESS_IMAGE_WITH_GRID",
            dataUrl: dataUrl,
          },
          function (response) {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response && response.success) {
              console.log("Grille appliquée avec succès au screenshot.");
              resolve(response.dataUrl); // Retourne l'image (jpeg base64) avec la grille
            } else {
              reject(new Error(response ? response.error : "Erreur inconnue lors du dessin de la grille"));
            }
          },
        );
      });
    });
  });
}
