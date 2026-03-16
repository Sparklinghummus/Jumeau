document.addEventListener('DOMContentLoaded', () => {
    const pipelineTimeline = document.getElementById('pipeline-timeline');
    const pipelineName = document.getElementById('pipeline-name');
    const pipelineStatusBadge = document.getElementById('pipeline-status-badge');
    const pipelineMeta = document.getElementById('pipeline-meta');
    const pipelineProgressLabel = document.getElementById('pipeline-progress-label');
    const pipelineProgressFill = document.getElementById('pipeline-progress-fill');
    const pipelineScroll = document.getElementById('pipeline-scroll');
    const openEditorBtn = document.getElementById('openEditorBtn');
    const clearContextBtn = document.getElementById('clearContextBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = document.getElementById('closeBtn');
    const runAgentBtn = document.getElementById('runAgentBtn');
    const exportMcpBtn = document.getElementById('exportMcpBtn');
    const agentIntentInput = document.getElementById('agentIntentInput');
    const cloudConsoleBadge = document.getElementById('cloud-console-badge');
    const cloudConsoleResult = document.getElementById('cloudConsoleResult');
    const mcpUrlLink = document.getElementById('mcpUrlLink');

    let canvasState = normalizeState();

    const iconSprite = {
        trigger: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
        condition: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
        action: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
        ai: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
        records: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
        lists: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
        integrations: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shuffle"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`,
        output: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
        branch: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-branch"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
        default: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
    };

    // ── Normalise incoming state ──
    function normalizeState(state = {}) {
        return {
            currentWorkflowId: state.currentWorkflowId || null,
            workflows: Array.isArray(state.workflows) ? state.workflows : [],
            questions: Array.isArray(state.questions) ? state.questions : [],
            actions: Array.isArray(state.actions) ? state.actions : [],
            transcriptions: Array.isArray(state.transcriptions) ? state.transcriptions : []
        };
    }

    function getActiveWorkflow() {
        return canvasState.workflows.find(w => w.id === canvasState.currentWorkflowId)
            || canvasState.workflows[canvasState.workflows.length - 1]
            || null;
    }

    // ── Escape helpers ──
    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    // ── Count branches (nodes of type condition / decision) ──
    function countBranches(nodes) {
        return (nodes || []).filter(n =>
            ['condition', 'decision', 'branch'].includes((n.type || '').toLowerCase())
        ).length;
    }

    function getNodeTone(node) {
        const type = String(node.type || '').toLowerCase();
        const category = String(node.category || '').toLowerCase();

        if (type === 'trigger') return 'trigger';
        if (type === 'condition') return 'condition';
        if (type === 'branch' || type === 'decision') return 'branch';
        if (category === 'ai') return 'ai';
        if (category === 'records') return 'records';
        if (category === 'lists') return 'lists';
        if (category === 'integrations') return 'integrations';
        if (type === 'output') return 'output';
        return 'action';
    }

    function getNodeIcon(node) {
        const tone = getNodeTone(node);
        return iconSprite[tone] || iconSprite.default;
    }

    function getNodeTypeLabel(node) {
        const type = String(node.type || 'action').toLowerCase();
        if (type === 'trigger') return 'Trigger';
        if (type === 'condition') return 'Condition';
        if (type === 'branch' || type === 'decision') return 'Branch';
        return 'Action';
    }

    // ── Determine block status ──
    // Nodes can carry their own status: "done" | "running" | "pending"
    // Fallback: first node is done, rest are pending
    function getBlockStatus(node, index, nodes) {
        if (node.status) {
            const normalized = String(node.status).toLowerCase();
            if (normalized === 'completed') return 'done';
            if (normalized === 'running') return 'running';
            return 'pending';
        }
        // Auto-derive: everything before the first non-done is done
        const firstPendingIdx = nodes.findIndex((n) => {
            const normalized = String(n.status || '').toLowerCase();
            return normalized && normalized !== 'done' && normalized !== 'completed';
        });
        if (firstPendingIdx === -1) return index === 0 ? 'done' : 'pending';
        if (index < firstPendingIdx) return 'done';
        if (index === firstPendingIdx) return 'running';
        return 'pending';
    }

    // ── Status display text ──
    function statusLabel(status) {
        switch (status) {
            case 'done': return 'Done';
            case 'running': return 'Running';
            default: return 'Pending';
        }
    }

    // ── Checkmark SVG ──
    function checkSvg() {
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    }

    // ── Render the full pipeline ──
    function renderPipeline() {
        const workflow = getActiveWorkflow();

        if (!workflow) {
            pipelineName.textContent = 'Workflow Capture';
            pipelineStatusBadge.style.display = 'none';
            pipelineMeta.textContent = '0 blocks · 0 branches';
            pipelineProgressLabel.textContent = '0/0';
            pipelineProgressFill.style.width = '0%';
            pipelineTimeline.innerHTML = '<div class="empty-state">The current workflow will appear here.</div>';
            return;
        }

        const nodes = workflow.nodes || [];
        const branches = countBranches(nodes);
        const total = nodes.length;

        // Count done
        const doneCount = nodes.filter((n, i) => getBlockStatus(n, i, nodes) === 'done').length;
        const hasRunning = nodes.some((n, i) => getBlockStatus(n, i, nodes) === 'running');

        // Update header
        pipelineName.textContent = escapeHtml(workflow.title || 'Workflow Capture');

        if (doneCount === total && total > 0) {
            pipelineStatusBadge.textContent = 'Completed';
            pipelineStatusBadge.className = 'pipeline-status-badge completed';
            pipelineStatusBadge.style.display = '';
        } else if (hasRunning || doneCount > 0) {
            pipelineStatusBadge.textContent = 'Running';
            pipelineStatusBadge.className = 'pipeline-status-badge running';
            pipelineStatusBadge.style.display = '';
        } else {
            pipelineStatusBadge.style.display = 'none';
        }

        pipelineMeta.textContent = `${total} block${total !== 1 ? 's' : ''} · ${branches} branch${branches !== 1 ? 'es' : ''}`;
        pipelineProgressLabel.textContent = `${doneCount}/${total}`;
        pipelineProgressFill.style.width = total > 0 ? `${(doneCount / total) * 100}%` : '0%';

        // Build timeline HTML
        const blocksMarkup = nodes.map((node, index) => {
            const status = getBlockStatus(node, index, nodes);
            const isLast = index === nodes.length - 1;
            const tone = getNodeTone(node);
            const icon = getNodeIcon(node);
            const typeLabel = getNodeTypeLabel(node);
            const categoryLabel = escapeHtml(node.category || 'Workflow');

            // Determine line status (connects this dot to the next)
            let lineStatus = 'pending';
            if (!isLast) {
                const nextStatus = getBlockStatus(nodes[index + 1], index + 1, nodes);
                if (status === 'done' && nextStatus === 'done') lineStatus = 'done';
                else if (status === 'done' && (nextStatus === 'running' || nextStatus === 'pending')) lineStatus = 'running';
                else lineStatus = 'pending';
            }

            // Dot inner content
            let dotContent = '';
            if (status === 'done') {
                dotContent = checkSvg();
            }
            // running and pending are styled via CSS (spinner / empty)

            return `
                <div class="block-row" style="animation-delay: ${index * 0.06}s">
                    <div class="block-timeline">
                        <div class="block-timeline-dot ${status}">${dotContent}</div>
                        <div class="block-timeline-line ${isLast ? 'hidden' : lineStatus}"></div>
                    </div>
                    <div class="block-card ${status}">
                        <div class="block-card-top">
                            <div class="block-card-icon ${tone}">${icon}</div>
                            <div class="block-card-header">
                                <div class="block-card-title-row">
                                    <div class="block-card-title">${escapeHtml(node.title || 'Untitled block')}</div>
                                    <span class="block-card-status ${status}">
                                        <span class="block-card-status-dot ${status}"></span>
                                        ${statusLabel(status)}
                                    </span>
                                </div>
                                <div class="block-card-meta">
                                    <div class="block-card-type ${tone}">${typeLabel}</div>
                                    <div class="block-card-category">${categoryLabel}</div>
                                </div>
                            </div>
                        </div>
                        ${node.description ? `<div class="block-card-description">${escapeHtml(node.description)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        pipelineTimeline.innerHTML = blocksMarkup || '<div class="empty-state">The current workflow will appear here.</div>';
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function scrollToBottom() {
        setTimeout(() => {
            pipelineScroll.scrollTo({
                top: pipelineScroll.scrollHeight,
                behavior: 'smooth'
            });
        }, 80);
    }

    // ── Render everything ──
    function renderCanvasState() {
        renderPipeline();
    }

    function setCloudStatus(label, tone) {
        if (!cloudConsoleBadge) {
            return;
        }

        cloudConsoleBadge.textContent = label;
        cloudConsoleBadge.className = `cloud-console-badge ${tone}`;
    }

    function setCloudResult(text, mcpUrl = '') {
        if (!cloudConsoleResult || !mcpUrlLink) {
            return;
        }

        cloudConsoleResult.textContent = text;

        if (mcpUrl) {
            mcpUrlLink.href = mcpUrl;
            mcpUrlLink.textContent = mcpUrl;
            mcpUrlLink.classList.remove('hidden');
            return;
        }

        mcpUrlLink.href = '#';
        mcpUrlLink.textContent = '';
        mcpUrlLink.classList.add('hidden');
    }

    // ── Hydrate initial state from extension background ──
    function hydrateInitialState() {
        chrome.runtime.sendMessage({ type: 'GET_LIVE_CANVAS_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Unable to load initial state:", chrome.runtime.lastError.message);
                return;
            }

            if (response?.state) {
                canvasState = normalizeState(response.state);
                renderCanvasState();
            }
            if (response?.status) {
                applyStatus(response.status);
            }
        });
    }

    // ── Open the full app ──
    openEditorBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('app-react/index.html#/workflows') });
    });

    clearContextBtn?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'CLEAR_LIVE_CONTEXT' }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Unable to clear sidepanel context:', chrome.runtime.lastError.message);
                return;
            }

            if (!response?.ok) {
                console.warn('Unable to clear sidepanel context:', response?.error || 'Unknown error');
                return;
            }

            if (response.state) {
                canvasState = normalizeState(response.state);
                renderCanvasState();
            }

            if (response.status) {
                applyStatus(response.status);
            }
        });
    });

    settingsBtn?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    closeBtn?.addEventListener('click', async () => {
        if (!chrome.sidePanel?.close) {
            return;
        }

        const currentWindow = await chrome.windows.getCurrent();
        chrome.sidePanel.close({ windowId: currentWindow.id });
    });

    runAgentBtn?.addEventListener('click', () => {
        const userIntent = agentIntentInput?.value?.trim() || '';
        setCloudStatus('Running', 'running');
        setCloudResult('Calling the Cloud Run orchestrator and waiting for one action...');

        chrome.runtime.sendMessage({
            type: 'MVP_RUN_AGENT',
            userIntent
        }, (response) => {
            if (chrome.runtime.lastError) {
                setCloudStatus('Error', 'error');
                setCloudResult(chrome.runtime.lastError.message);
                return;
            }

            if (!response?.ok) {
                setCloudStatus('Error', 'error');
                setCloudResult(response?.error || 'Unknown orchestrator error.');
                return;
            }

            const action = response.action || {};
            const execution = response.execution?.result;
            const resultText = execution?.selector
                ? `Action: ${action.action} on ${execution.selector}. ${action.reason || ''}`.trim()
                : `Action: ${action.action}. ${action.reason || ''}`.trim();

            setCloudStatus('Success', 'success');
            setCloudResult(resultText);
        });
    });

    exportMcpBtn?.addEventListener('click', () => {
        setCloudStatus('Running', 'running');
        setCloudResult('Generating the weather MCP bundle and asking the deployer to ship it...');

        chrome.runtime.sendMessage({
            type: 'MVP_EXPORT_WEATHER_MCP',
            name: 'weather-mcp'
        }, (response) => {
            if (chrome.runtime.lastError) {
                setCloudStatus('Error', 'error');
                setCloudResult(chrome.runtime.lastError.message);
                return;
            }

            if (!response?.ok) {
                setCloudStatus('Error', 'error');
                setCloudResult(response?.error || 'Unknown MCP deploy error.');
                return;
            }

            setCloudStatus('Success', 'success');
            setCloudResult(`MCP deployed as ${response.serviceName}. Paste this URL into Claude or Cowork:`, response.mcpUrl);
        });
    });

    // ── Update badge from recording status ──
    function applyStatus(status) {
        switch (status) {
            case 'listening':
                pipelineStatusBadge.textContent = 'Listening';
                pipelineStatusBadge.className = 'pipeline-status-badge running';
                break;
            case 'thinking':
                pipelineStatusBadge.textContent = 'Thinking';
                pipelineStatusBadge.className = 'pipeline-status-badge running';
                break;
            case 'paused':
                pipelineStatusBadge.textContent = 'Paused';
                pipelineStatusBadge.className = 'pipeline-status-badge running';
                break;
            case 'ready':
            default:
                // Let renderPipeline() decide idle vs completed based on nodes
                renderCanvasState();
        }
        if (typeof applyRecordingUI === 'function') {
            applyRecordingUI(status);
        }
    }

    // ── Listen for state updates from background ──
    chrome.runtime.onMessage.addListener((message) => {
        if (message.target !== 'sidepanel') return;

        if (message.type === 'STATUS_UPDATE') {
            applyStatus(message.status);
            return;
        }

        if (message.type === 'SYNC_CANVAS_STATE') {
            canvasState = normalizeState(message.state);
            renderCanvasState();
            scrollToBottom();
        }
    });

    // ── Setup / Onboarding ──
    const setupOverlay = document.getElementById('setup-overlay');
    const setupApiKey  = document.getElementById('setup-api-key');
    const setupMicBtn  = document.getElementById('setup-mic-btn');
    const setupSaveBtn = document.getElementById('setup-save-btn');
    const setupHint    = document.getElementById('setup-hint');
    const setupBadge1  = document.getElementById('setup-badge-1');
    const setupBadge2  = document.getElementById('setup-badge-2');

    let setupHasKey = false;
    let setupHasMic = false;

    function showSetup() {
        setupOverlay.style.display = 'block';
    }

    function hideSetup() {
        setupOverlay.style.display = 'none';
    }

    function setSetupKeyDone(done) {
        setupHasKey = done;
        if (done) {
            setupBadge1.style.background = '#111';
            setupBadge1.style.color = '#fff';
            setupBadge1.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        } else {
            setupBadge1.style.background = '#f0ece6';
            setupBadge1.style.color = '#555';
            setupBadge1.textContent = '1';
        }
        updateSetupSave();
    }

    function setSetupMicDone(done) {
        setupHasMic = done;
        if (done) {
            setupBadge2.style.background = '#111';
            setupBadge2.style.color = '#fff';
            setupBadge2.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
            setupMicBtn.style.background = '#111';
            setupMicBtn.style.color = '#fff';
            setupMicBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 6 9 17l-5-5"/></svg> Microphone authorized';
        }
        updateSetupSave();
    }

    function updateSetupSave() {
        const ready = setupHasKey && setupHasMic;
        setupSaveBtn.disabled = !ready;
        setupSaveBtn.style.background = ready ? '#111' : '#d4cfc9';
        setupSaveBtn.style.color = ready ? '#fff' : '#a09a94';
        setupSaveBtn.style.cursor = ready ? 'pointer' : 'not-allowed';
        setupHint.textContent = ready ? 'All set — save to continue' : 'Complete the steps above to continue';
    }

    setupApiKey.addEventListener('input', () => {
        setSetupKeyDone(setupApiKey.value.trim().length > 10);
    });

    setupMicBtn.addEventListener('click', async () => {
        if (setupHasMic) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            setSetupMicDone(true);
        } catch (err) {
            console.error('Mic error:', err);
        }
    });

    setupSaveBtn.addEventListener('click', () => {
        const key = setupApiKey.value.trim();
        chrome.storage.local.set({ apiKey: key }, () => {
            hideSetup();
        });
    });

    // Check on load whether setup is needed
    chrome.storage.local.get(['apiKey'], (result) => {
        if (!result.apiKey) {
            showSetup();
        } else {
            setupApiKey.value = result.apiKey;
            setSetupKeyDone(true);
        }
    });

    // Listen for a request from background to show setup
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SHOW_SETUP') {
            showSetup();
        }
    });

    // Initial render
    renderCanvasState();
    setCloudStatus('Idle', 'idle');
    hydrateInitialState();

    // ── Recorder UI Logic ──
    const recorderTimer = document.getElementById('recording-timer');
    const waveformVisualizer = document.querySelector('.waveform-visualizer');
    const recorderPauseBtn = document.getElementById('recorder-pause-btn');
    const recorderStopBtn = document.getElementById('recorder-stop-btn');
    const recordingDot = document.querySelector('.recording-dot');
    const recordingLabel = document.querySelector('.recording-label');
    
    let isRecordingUi = false;
    let isPaused = false;
    let timerInterval = null;
    let secondsElapsed = 0;

    function formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isPaused && isRecordingUi) {
                secondsElapsed++;
                if(recorderTimer) recorderTimer.textContent = formatTime(secondsElapsed);
            }
        }, 1000);
    }

    const waveBars = '<div class="wave-bar"></div>'.repeat(12);

    function setPauseButtonState(paused) {
        isPaused = paused;
        if (!recorderPauseBtn) return;

        recorderPauseBtn.classList.toggle('is-paused', paused);
        recorderPauseBtn.innerHTML = paused
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7 5 19 12 7 19 7 5"></polygon></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="1.5" fill="#888"/><rect x="14" y="4" width="4" height="16" rx="1.5" fill="#888"/></svg>`;
    }

    function applyRecordingUI(status) {
        const isRecordingMode = (status === 'listening' || status === 'thinking' || status === 'paused');

        if (isRecordingMode) {
            if (!isRecordingUi) {
                isRecordingUi = true;
                startTimer();
            }
            if (recordingLabel) {
                recordingLabel.textContent = status === 'thinking'
                    ? 'Thinking…'
                    : status === 'paused'
                        ? 'Paused'
                        : 'Recording';
                recordingLabel.classList.add('active');
            }
            recorderStopBtn?.classList.add('is-recording');
            if (status === 'thinking' || status === 'paused' || isPaused) {
                waveformVisualizer?.classList.remove('active');
                recordingDot?.classList.remove('pulse');
            } else {
                waveformVisualizer?.classList.add('active');
                recordingDot?.classList.add('pulse');
            }
            setPauseButtonState(status === 'paused' || isPaused);
        } else {
            isRecordingUi = false;
            clearInterval(timerInterval);
            timerInterval = null;
            secondsElapsed = 0;
            if (recorderTimer) recorderTimer.textContent = '00:00';
            recordingDot?.classList.remove('pulse');
            if (recordingLabel) {
                recordingLabel.textContent = 'Ready';
                recordingLabel.classList.remove('active');
            }
            recorderStopBtn?.classList.remove('is-recording');
            waveformVisualizer?.classList.remove('active');
            if (waveformVisualizer) waveformVisualizer.innerHTML = waveBars;
            setPauseButtonState(false);
        }
    }

    function syncRecorderState() {
        chrome.runtime.sendMessage({ type: 'GET_AUDIO_STATE' }, (response) => {
            if (chrome.runtime.lastError || !response) {
                return;
            }

            setPauseButtonState(Boolean(response.isPaused));
            if (response.isRecording) {
                applyRecordingUI(response.isPaused ? 'paused' : 'listening');
            } else {
                applyRecordingUI('ready');
            }
        });
    }

    // Expose this so applyStatus can call it if needed, or simply assign it
    window.applyRecordingUI = applyRecordingUI;

    if(recorderPauseBtn) {
        recorderPauseBtn.addEventListener('click', () => {
            if (!isRecordingUi) return;
            chrome.runtime.sendMessage({ type: 'TOGGLE_INPUT_PAUSE' }, (response) => {
                if (chrome.runtime.lastError || !response) {
                    return;
                }

                setPauseButtonState(Boolean(response.isPaused));
                applyRecordingUI(response.isPaused ? 'paused' : 'listening');
            });
        });
    }

    if(recorderStopBtn) {
        recorderStopBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'TOGGLE_AUDIO' });
        });
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message.target !== 'sidepanel') return;

        if (message.type === 'INPUT_PAUSE_UPDATE') {
            setPauseButtonState(Boolean(message.isPaused));
        }
    });

    syncRecorderState();
});
