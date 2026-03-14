// Service Worker (background.js)
console.log("Jumeau Service Worker initialisé - Mode Live API");

let isRecording = false;
let geminiWs = null;
let screenshotInterval = null;
let geminiSessionReady = false;
const GEMINI_LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_LIVE_ENDPOINT = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const GEMINI_CONNECT_TIMEOUT_MS = 10000;
const LIVE_CANVAS_STORAGE_KEY = 'liveCanvasState';
const MAX_ACTIONS = 60;
const MAX_TRANSCRIPTIONS = 80;
const MAX_QUESTIONS = 12;
const MAX_WORKFLOW_NODES = 24;
let liveCanvasState = createEmptyLiveCanvasState();
let liveCanvasStateLoaded = false;
const liveCanvasStateReady = loadLiveCanvasState();

// Gérer la création du sidepanel au clic sur l'icône de l'extension
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

function createEmptyLiveCanvasState() {
    return {
        currentWorkflowId: null,
        workflows: [],
        questions: [],
        actions: [],
        transcriptions: []
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
    return {
        currentWorkflowId: rawState.currentWorkflowId || null,
        workflows: Array.isArray(rawState.workflows) ? rawState.workflows : [],
        questions: Array.isArray(rawState.questions) ? rawState.questions : [],
        actions: Array.isArray(rawState.actions) ? rawState.actions : [],
        transcriptions: Array.isArray(rawState.transcriptions) ? rawState.transcriptions : []
    };
}

function cloneLiveCanvasState() {
    return JSON.parse(JSON.stringify(liveCanvasState));
}

function createEntityId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value, fallback = '') {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed || fallback;
}

function cleanStringArray(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => cleanText(item))
        .filter(Boolean)
        .slice(0, 4);
}

function trimLiveCanvasState(state) {
    state.actions = state.actions.slice(-MAX_ACTIONS);
    state.transcriptions = state.transcriptions.slice(-MAX_TRANSCRIPTIONS);
    state.questions = state.questions.slice(-MAX_QUESTIONS);
    state.workflows = state.workflows.map((workflow) => ({
        ...workflow,
        nodes: Array.isArray(workflow.nodes) ? workflow.nodes.slice(-MAX_WORKFLOW_NODES) : []
    }));
}

async function syncLiveCanvasState() {
    await storageSet({ [LIVE_CANVAS_STORAGE_KEY]: liveCanvasState });
    chrome.runtime.sendMessage({
        target: 'sidepanel',
        type: 'SYNC_CANVAS_STATE',
        state: cloneLiveCanvasState()
    }).catch(() => {});
}

async function mutateLiveCanvasState(mutator) {
    await ensureLiveCanvasStateReady();
    const result = mutator(liveCanvasState);
    trimLiveCanvasState(liveCanvasState);
    await syncLiveCanvasState();
    return result;
}

function createCanvasAction(action) {
    return {
        id: createEntityId('action'),
        title: cleanText(action.title, 'Action'),
        description: cleanText(action.description, ''),
        icon: cleanText(action.icon, 'sparkles'),
        timestamp: action.timestamp || Date.now()
    };
}

function createCanvasTranscription(entry) {
    return {
        id: createEntityId('tx'),
        role: entry.role === 'user' ? 'user' : 'assistant',
        text: cleanText(entry.text, ''),
        timestamp: entry.timestamp || Date.now()
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

    return state.workflows.find((workflow) => {
        if (workflowId && workflow.id === workflowId) {
            return true;
        }

        return workflowTitle && workflow.title.toLowerCase() === workflowTitle;
    }) || null;
}

async function createWorkflowFromTool(args = {}) {
    return mutateLiveCanvasState((state) => {
        const title = cleanText(args.title || args.name, 'Nouveau workflow');
        const goal = cleanText(args.goal || args.objective, 'Workflow détecté pendant l’observation');
        const trigger = cleanText(args.trigger, 'Déclenché depuis le contexte écran');
        const summary = cleanText(args.summary || args.description, 'Blueprint en cours de construction');
        const domain = cleanText(args.domain, '');

        let workflow = findWorkflow(state, { workflowId: args.workflowId, workflowTitle: title });
        let created = false;

        if (!workflow) {
            workflow = {
                id: createEntityId('workflow'),
                title,
                goal,
                trigger,
                summary,
                domain,
                status: 'draft',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                nodes: []
            };
            state.workflows.push(workflow);
            created = true;
        } else {
            workflow.goal = goal || workflow.goal;
            workflow.trigger = trigger || workflow.trigger;
            workflow.summary = summary || workflow.summary;
            workflow.domain = domain || workflow.domain;
            workflow.updatedAt = Date.now();
        }

        state.currentWorkflowId = workflow.id;
        state.actions.push(createCanvasAction({
            title: created ? `Nouveau workflow : ${workflow.title}` : `Workflow mis à jour : ${workflow.title}`,
            description: created ? workflow.goal : workflow.summary,
            icon: 'git-branch'
        }));

        return { workflow, created };
    });
}

async function addWorkflowNodeFromTool(args = {}) {
    return mutateLiveCanvasState((state) => {
        let workflow = findWorkflow(state, args);

        if (!workflow) {
            const fallbackTitle = cleanText(args.workflowTitle, 'Workflow en cours');
            workflow = {
                id: createEntityId('workflow'),
                title: fallbackTitle,
                goal: cleanText(args.workflowGoal, 'Structurer le process observé'),
                trigger: 'Déclenché depuis le sidekick',
                summary: 'Workflow auto-créé pour accueillir les nouveaux noeuds',
                domain: cleanText(args.domain, ''),
                status: 'draft',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                nodes: []
            };
            state.workflows.push(workflow);
        }

        const node = {
            id: createEntityId('node'),
            type: cleanText(args.nodeType || args.type, 'step'),
            title: cleanText(args.title || args.label, 'Nouveau noeud'),
            description: cleanText(args.description || args.details, 'Etape ajoutée par Jumeau'),
            status: cleanText(args.status, 'draft'),
            rationale: cleanText(args.rationale, ''),
            createdAt: Date.now()
        };

        workflow.nodes.push(node);
        workflow.updatedAt = Date.now();
        state.currentWorkflowId = workflow.id;
        state.actions.push(createCanvasAction({
            title: `Noeud ajouté : ${node.title}`,
            description: `${workflow.title} · ${node.description}`,
            icon: 'plus'
        }));

        return { workflow, node };
    });
}

async function addWorkflowQuestionFromTool(args = {}) {
    return mutateLiveCanvasState((state) => {
        const workflow = findWorkflow(state, args);
        const question = {
            id: createEntityId('question'),
            workflowId: workflow?.id || state.currentWorkflowId || null,
            text: cleanText(args.question, 'Quelle est la prochaine étape de ce process ?'),
            context: cleanText(args.context, ''),
            suggestedAnswers: cleanStringArray(args.suggestedAnswers || args.options),
            createdAt: Date.now()
        };

        state.questions.push(question);
        state.actions.push(createCanvasAction({
            title: 'Question de clarification',
            description: question.text,
            icon: 'message-square'
        }));

        return question;
    });
}

function normalizeToolArgs(args) {
    if (!args) return {};
    if (typeof args === 'string') {
        try {
            return JSON.parse(args);
        } catch (_) {
            return {};
        }
    }
    return args;
}

function sendSidepanelStatus(status) {
    chrome.runtime.sendMessage({
        target: 'sidepanel',
        type: 'STATUS_UPDATE',
        status
    }).catch(() => {});
}

function sendGeminiToolResponse(mode, functionCall, response) {
    const payload = mode === 'root'
        ? {
            toolResponse: {
                functionResponses: [{
                    id: functionCall.id,
                    name: functionCall.name,
                    response
                }]
            }
        }
        : {
            clientContent: {
                turns: [{
                    role: "user",
                    parts: [{
                        functionResponse: {
                            id: functionCall.id,
                            name: functionCall.name,
                            response
                        }
                    }]
                }],
                turnComplete: true
            }
        };

    console.error("🚀 [WS TOOL RESPONSE] Envoi du résultat du tool :\n", JSON.stringify(payload, null, 2));

    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(JSON.stringify(payload));
    }
}

function normalizeCursorCommands(functionCall) {
    let commands = normalizeToolArgs(functionCall.args).commands || [];
    if (commands.length > 0 && typeof commands[0] === 'string') {
        const command = commands.find((entry) => entry.startsWith('cursor'));
        const reason = commands.find((entry) => entry.startsWith('reason:'));
        commands = command
            ? [{ command, reason: reason ? reason.replace('reason:', '').trim() : '' }]
            : [];
    }
    return commands;
}

async function executeCursorCommands(functionCall, mode) {
    const commands = normalizeCursorCommands(functionCall);

    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs.length) {
                resolve({
                    result: "No active tab",
                    details: "Impossible de déplacer le curseur sans onglet actif."
                });
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'EXECUTE_CURSOR_COMMANDS',
                commands
            }, async function() {
                await addCanvasAction({
                    title: "Action déclenchée",
                    description: "Jumeau a déplacé le curseur pour montrer un élément à l’écran.",
                    icon: 'mouse-pointer'
                });

                const response = {
                    result: "Commands executed successfully",
                    details: "Cursor has successfully moved to the target cells."
                };
                sendGeminiToolResponse(mode, functionCall, response);
                resolve(response);
            });
        });
    });
}

async function handleGeminiFunctionCall(functionCall, mode) {
    console.error("🛠️ [WS TOOL CALL RECEIVED] Tool call reçu :\n", JSON.stringify(functionCall, null, 2));

    const args = normalizeToolArgs(functionCall.args);

    if (functionCall.name === "execute_cursor_commands") {
        await executeCursorCommands(functionCall, mode);
        return;
    }

    if (functionCall.name === "create_workflow") {
        const result = await createWorkflowFromTool(args);
        sendGeminiToolResponse(mode, functionCall, {
            ok: true,
            mocked: true,
            workflowId: result.workflow.id,
            title: result.workflow.title,
            result: result.created ? "Workflow created in sidepanel" : "Workflow updated in sidepanel"
        });
        return;
    }

    if (functionCall.name === "add_workflow_node") {
        const result = await addWorkflowNodeFromTool(args);
        sendGeminiToolResponse(mode, functionCall, {
            ok: true,
            mocked: true,
            workflowId: result.workflow.id,
            nodeId: result.node.id,
            result: "Workflow node added to sidepanel"
        });
        return;
    }

    if (functionCall.name === "ask_workflow_question") {
        const question = await addWorkflowQuestionFromTool(args);
        sendGeminiToolResponse(mode, functionCall, {
            ok: true,
            mocked: true,
            questionId: question.id,
            result: "Clarifying question added to sidepanel"
        });
        return;
    }

    sendGeminiToolResponse(mode, functionCall, {
        ok: false,
        error: `Unsupported tool: ${functionCall.name}`
    });
}

// Gérer la création de l'offscreen document pour l'audio
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) return;

  if (chrome.offscreen) {
    try {
        await chrome.offscreen.createDocument({
            url: path,
            reasons: ['USER_MEDIA'],
            justification: 'Enregistrement audio pour interaction vocale IA'
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
    const error = new Error(errorLike?.message || 'Erreur inconnue');
    error.name = errorLike?.name || 'Error';

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
        return 'Erreur inconnue';
    }

    if (typeof error === 'string') {
        return error;
    }

    const parts = [error.name, error.message].filter(Boolean);

    if (error.constraint) {
        parts.push(`constraint=${error.constraint}`);
    }

    return parts.join(': ');
}

function toUserErrorMessage(error) {
    if (!error) {
        return 'Erreur inconnue';
    }

    if (error.name === 'NotAllowedError') {
        return "Accès micro refusé ou demande fermée. Ouvre les options de l'extension puis clique sur \"Autoriser le Micro\".";
    }

    if (error.name === 'NotFoundError') {
        return "Aucun microphone disponible. Vérifie qu'un micro est connecté et activé.";
    }

    if (error.message && error.message.includes('API key not valid')) {
        return "La clé API Gemini est invalide ou expirée. Veuillez la vérifier dans les options de l'extension.";
    }

    if (error.name === 'NotReadableError') {
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

        // Récupérer la clé API des settings
        chrome.storage.local.get(['apiKey'], (result) => {
            const apiKey = result.apiKey?.trim();
            if (!apiKey) {
                console.error("Clé API Gemini introuvable. Veuillez la configurer dans les options.");
                chrome.runtime.openOptionsPage();
                settleWithError(new Error("Clé API Gemini introuvable"));
                return;
            }

            console.error(`[INFO FORCÉE] Tentative de connexion avec la clé API: ${apiKey.substring(0, 5)}...`);

            const wsUrl = `${GEMINI_LIVE_ENDPOINT}?key=${apiKey}`;
            
            geminiWs = new WebSocket(wsUrl);
            geminiSessionReady = false;
            connectTimeout = setTimeout(() => {
                console.error("⛔️ Timeout de connexion Gemini Live. Le serveur n'a jamais envoyé 'setupComplete'.");
                try {
                    geminiWs?.close();
                } catch (_) {}
                settleWithError(new Error("Timeout de connexion Gemini Live"));
            }, GEMINI_CONNECT_TIMEOUT_MS);

            // Hook the send method to log outbound messages
            const originalWsSend = geminiWs.send.bind(geminiWs);
            geminiWs.send = (data) => {
                try {
                    const parsed = JSON.parse(data);
                    if (!parsed.realtimeInput) { // On ne loggue pas les chunks audio pour éviter de spammer la console
                        console.error("⬆️ [WS SENT]:", parsed);
                    }
                } catch(e) { /* binary */ }
                originalWsSend(data);
            };

            geminiWs.onopen = () => {
                console.error("🟢 [WS OPEN] Socket Gemini Live ouverte ! Envoi du setupMessage...");
                
                // Envoi du message Setup initial
                const setupMessage = {
                    setup: {
                        model: GEMINI_LIVE_MODEL,
                        systemInstruction: {
                            parts: [{
                                text: `Tu es Jumeau, un assistant IA ambiant qui voit l'écran de l'utilisateur en temps réel, écoute son process et construit un blueprint de workflow dans le sidepanel.

Tu reçois des captures d'écran avec une grille 8x8 superposée (colonnes A-H, lignes 1-8). Cette grille te sert uniquement à localiser les éléments à l'écran.

OBJECTIF :
- Observer ce que l'utilisateur fait.
- Réagir de manière naturelle à ce que tu vois.
- Identifier les étapes répétables ou intéressantes.
- Poser des questions sur le process quand il manque une règle métier.
- Construire un workflow en direct dans le sidepanel via les tools.

COMPORTEMENT ATTENDU :
- Si tu détectes un process ou une automatisation potentielle, annonce-le naturellement puis crée un workflow via create_workflow.
- Dès qu'une étape utile apparaît, ajoute un noeud via add_workflow_node.
- Quand une zone reste ambiguë, utilise ask_workflow_question et pose aussi la question à voix haute.
- Les tools ne lancent aucune vraie automatisation : ils servent uniquement à construire un aperçu mocké visible dans le sidepanel.
- Tu peux dire des phrases comme : "c'est intéressant, je crée un nouveau workflow", "j'ajoute un noeud pour cette étape", "il me manque une règle ici".

RÈGLES CRITIQUES :
- Quand tu veux montrer quelque chose à l'utilisateur, utilise le tool execute_cursor_commands avec la cellule correspondante (ex: "cursor move_to D4").
- NE MENTIONNE JAMAIS les coordonnées de grille dans ta parole (pas de "D4", "cellule A1", "case B3", etc.). Parle naturellement : "je te montre ici", "regarde là", "cet élément", etc.
- Parle comme un copilote de process, pas comme un simple commentateur d'écran.`
                            }]
                        },
                        tools: [{
                            functionDeclarations: [
                                {
                                    name: "execute_cursor_commands",
                                    description: "Move the virtual cursor to a specific cell on the screen based on the 8x8 grid (e.g. A1, H8). NEVER mention grid coordinates in speech.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            commands: {
                                                type: "ARRAY",
                                                description: "Array of commands to execute",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        command: { type: "STRING", description: "Command format: 'cursor move_to [cell_id]' (e.g. 'cursor move_to A1')" },
                                                        reason: { type: "STRING", description: "Reason for the command" }
                                                    },
                                                    required: ["command", "reason"]
                                                }
                                            }
                                        },
                                        required: ["commands"]
                                    }
                                },
                                {
                                    name: "create_workflow",
                                    description: "Create or update a workflow blueprint in the sidepanel. This is a mocked UI action only.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            workflowId: { type: "STRING" },
                                            title: { type: "STRING", description: "Workflow title visible in the sidepanel." },
                                            goal: { type: "STRING", description: "What the workflow tries to achieve." },
                                            trigger: { type: "STRING", description: "What event or user action starts the workflow." },
                                            summary: { type: "STRING", description: "Short summary of the workflow." },
                                            domain: { type: "STRING", description: "Optional domain or app context." }
                                        },
                                        required: ["title", "goal"]
                                    }
                                },
                                {
                                    name: "add_workflow_node",
                                    description: "Add a node to the current workflow in the sidepanel. This is a mocked UI action only.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            workflowId: { type: "STRING" },
                                            workflowTitle: { type: "STRING", description: "Fallback workflow title if no workflowId is known." },
                                            title: { type: "STRING", description: "Node title." },
                                            description: { type: "STRING", description: "What this node represents." },
                                            nodeType: { type: "STRING", description: "One of observe, trigger, step, decision, output, question." },
                                            status: { type: "STRING", description: "draft, thinking, ready." },
                                            rationale: { type: "STRING", description: "Why this node was added." }
                                        },
                                        required: ["title", "description"]
                                    }
                                },
                                {
                                    name: "ask_workflow_question",
                                    description: "Add a clarifying question to the sidepanel so the user can refine the workflow. This is a mocked UI action only.",
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
                                                items: { type: "STRING" }
                                            }
                                        },
                                        required: ["question"]
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Aoede" // Voix féminine douce
                                    }
                                }
                            }
                        }
                    }
                };
                
                console.error("🚀 [WS SETUP] Envoi de la configuration initiale à Gemini (Prompt System, Tools) :\n", JSON.stringify(setupMessage, null, 2));
                geminiWs.send(JSON.stringify(setupMessage));
            };

            geminiWs.onmessage = async (event) => {
                // Gemini peut renvoyer du binaire ou du JSON en string
                try {
                    let textData = event.data;
                    if (event.data instanceof Blob) {
                        textData = await event.data.text();
                    }
                    
                    const responseData = JSON.parse(textData);
                    
                    if (!responseData.serverContent || (!responseData.serverContent.modelTurn && !responseData.serverContent.interrupted)) {
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
                            sendSidepanelStatus('thinking');
                            for (const part of modelTurn.parts) {
                                // Gérer la réception de l'audio !
                                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                                    // Envoyer au Offscreen pour lecture
                                    chrome.runtime.sendMessage({
                                        target: 'offscreen',
                                        type: 'PLAY_AUDIO',
                                        data: part.inlineData.data // Base64 PCM
                                    });
                                }
                                
                                // On pourrait aussi gérer le texte si on veut afficher des sous-titres
                                if (part.text) {
                                  console.error("💬 Gemini dit :", part.text);
                                  await addCanvasTranscription({ role: 'assistant', text: part.text });
                                }
                                
                                if (part.functionCall) {
                                    await handleGeminiFunctionCall(part.functionCall, 'embedded');
                                }
                            }
                            if (isRecording) {
                                sendSidepanelStatus('listening');
                            }
                        } else if (responseData.serverContent.interrupted) {
                            console.error("🛑 Interruption de l'audio par Gemini");
                        }
                    } else if (responseData.toolCall) {
                         // L'API Live envoie les toolCalls au niveau racine (pas dans serverContent)
                         sendSidepanelStatus('thinking');
                         const functionCalls = responseData.toolCall.functionCalls || [];
                         for (const fc of functionCalls) {
                             await handleGeminiFunctionCall(fc, 'root');
                         }
                         if (isRecording) {
                             sendSidepanelStatus('listening');
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

            geminiWs.onerror = (error) => {
                console.error("🔴 [WS ERROR] Erreur WebSocket Gemini (peut être une erreur 400 mauvaise clé ou modèle):", error.message || error);
                if (!geminiSessionReady) {
                    settleWithError(new Error("Échec de connexion à Gemini Live"));
                }
            };

            geminiWs.onclose = (event) => {
                const msg = `⚫️ [WS CLOSED] Connexion Gemini Live fermée. Code: ${event.code}, Raison: ${event.reason || "Non spécifiée"}`;
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
  if (message.type === 'TOGGLE_AUDIO') {
      if (isRecording) {
          stopAudioCapture();
          sendResponse({ isRecording: false });
      } else {
          startAudioCapture().then(() => {
              sendResponse({ isRecording: true });
          }).catch((e) => {
              console.error("Erreur lors de startAudioCapture:", e);
              if (e?.name === 'NotAllowedError') {
                  chrome.runtime.openOptionsPage().catch(() => {});
              }
              sendResponse({ isRecording: false, error: toUserErrorMessage(e) });
          });
      }
      return true; // Asynchrone
  } 
  
  else if (message.type === 'GET_AUDIO_STATE') {
      sendResponse({ isRecording: isRecording });
      return false;
  }

  else if (message.type === 'GET_LIVE_CANVAS_STATE') {
      ensureLiveCanvasStateReady()
          .then(() => {
              sendResponse({
                  state: cloneLiveCanvasState(),
                  status: isRecording ? 'listening' : 'ready'
              });
          })
          .catch((error) => {
              sendResponse({ error: error.message });
          });
      return true;
  }
  
  else if (message.type === 'TOGGLE_MUTE') {
      sendOffscreenMessage({ target: 'offscreen', type: 'TOGGLE_MUTE' })
          .then(response => {
              sendResponse({ isMuted: response?.isMuted });
          })
          .catch(e => {
              console.error("Erreur toggle mute offscreen:", e);
              sendResponse({ error: e.message });
          });
      return true; // Asynchrone
  }
  
  else if (message.type === 'AUDIO_CHUNK') {
      // Les données PCM brutes arrivent ici depuis l'offscreen
      if (geminiWs && geminiSessionReady && geminiWs.readyState === WebSocket.OPEN) {
          // Formatage d'un message ClientContent pour Gemini (realtimeInput)
          const audioMessage = {
              realtimeInput: {
                  audio: {
                      mimeType: "audio/pcm;rate=16000",
                      data: message.data
                  }
              }
          };
          geminiWs.send(JSON.stringify(audioMessage));
      }
  }
  else if (message.type === 'RECORDING_STARTED') {
      console.log("Capture micro démarrée :", message.details);
  }
  else if (message.type === 'RECORDING_ERROR') {
      const error = deserializeError(message.error);
      console.error("Erreur de capture micro :", formatError(error));
      stopAudioCapture();
  }
  return false;
});

async function startAudioCapture() {
    await setupOffscreenDocument('offscreen/offscreen.html');

    try {
        await connectToGeminiLive();
        await sendOffscreenMessage({
            type: 'START_RECORDING',
            target: 'offscreen'
        });
        isRecording = true;
        broadcastPillState(true);
        sendSidepanelStatus('listening');
    } catch (error) {
        await sendOffscreenMessage({
            type: 'STOP_RECORDING',
            target: 'offscreen'
        }).catch(() => {});
        throw error;
    }
}

function stopAudioCapture() {
    isRecording = false;
    geminiSessionReady = false;
    stopScreenshotLoop();
    sendSidepanelStatus('ready');
    
    // Dire à l'offscreen d'arrêter
    sendOffscreenMessage({
        type: 'STOP_RECORDING',
        target: 'offscreen'
    }).catch(() => {});
    
    // Fermer la socket
    if (geminiWs) {
        geminiWs.close();
        geminiWs = null;
    }
    
    broadcastPillState(false);
}

function broadcastPillState(isActive) {
    // Mettre à jour l'icône content script
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'UPDATE_PILL_STATE',
                isActive: isActive
            }).catch(() => {});
        }
    });
}

// ============================================================================
// BOUCLE AUTO-CAPTURE D'ÉCRAN (1 image/sec)
// ============================================================================

function startScreenshotLoop() {
    if (screenshotInterval) return;
    console.error("📸 Démarrage de la boucle de capture d'écran (1 img/sec)...");
    screenshotInterval = setInterval(async () => {
        if (!geminiWs || !geminiSessionReady || geminiWs.readyState !== WebSocket.OPEN) return;
        try {
            const dataUrl = await captureScreenWithGridTool();
            const base64 = dataUrl.split(',')[1];
            const imageMessage = {
                realtimeInput: {
                    video: {
                        mimeType: "image/jpeg",
                        data: base64
                    }
                }
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
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs || tabs.length === 0) {
                reject(new Error("Aucun tab actif trouvé"));
                return;
            }
            const activeTab = tabs[0];
            
            // Prendre le screenshot de la fenêtre active
            chrome.tabs.captureVisibleTab(activeTab.windowId, {format: "jpeg", quality: 80}, function(dataUrl) {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                console.log("Screenshot pris, envoi au content script pour application de la grille...");
                
                // Demander au content script de dessiner la grille sur le canvas
                chrome.tabs.sendMessage(activeTab.id, {
                    type: 'PROCESS_IMAGE_WITH_GRID',
                    dataUrl: dataUrl
                }, function(response) {
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
                });
            });
        });
    });
}
