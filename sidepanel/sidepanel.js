document.addEventListener('DOMContentLoaded', () => {
    const pipelineTimeline = document.getElementById('pipeline-timeline');
    const pipelineName = document.getElementById('pipeline-name');
    const pipelineStatusBadge = document.getElementById('pipeline-status-badge');
    const pipelineMeta = document.getElementById('pipeline-meta');
    const pipelineProgressLabel = document.getElementById('pipeline-progress-label');
    const pipelineProgressFill = document.getElementById('pipeline-progress-fill');
    const pipelineScroll = document.getElementById('pipeline-scroll');
    const openEditorBtn = document.getElementById('openEditorBtn');

    let canvasState = normalizeState();

    // ── Block type → emoji icon mapping ──
    const typeIcons = {
        core:      '📋',
        condition: '⚡',
        ai:        '🧠',
        records:   '📁',
        action:    '🚀',
        trigger:   '🔔',
        observe:   '👁️',
        decision:  '⚡',
        output:    '📤',
        question:  '❓',
        default:   '📦'
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
            ['condition', 'decision'].includes((n.type || '').toLowerCase())
        ).length;
    }

    // ── Determine block status ──
    // Nodes can carry their own status: "done" | "running" | "pending"
    // Fallback: first node is done, rest are pending
    function getBlockStatus(node, index, nodes) {
        if (node.status) return node.status.toLowerCase();
        // Auto-derive: everything before the first non-done is done
        const firstPendingIdx = nodes.findIndex(n => n.status && n.status !== 'done');
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
            pipelineTimeline.innerHTML = '<div class="empty-state">Le workflow en cours apparaîtra ici.</div>';
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
            const type = (node.type || 'default').toLowerCase();
            const icon = typeIcons[type] || typeIcons.default;

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
                            <div class="block-card-icon ${type}">${icon}</div>
                            <div class="block-card-header">
                                <div class="block-card-title">
                                    ${escapeHtml(node.title || 'Untitled block')}
                                    <span class="block-card-status ${status}">
                                        <span class="block-card-status-dot ${status}"></span>
                                        ${statusLabel(status)}
                                    </span>
                                </div>
                                <div class="block-card-type ${type}">${escapeHtml(capitalize(type))}</div>
                            </div>
                        </div>
                        ${node.description ? `<div class="block-card-description">${escapeHtml(node.description)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        pipelineTimeline.innerHTML = blocksMarkup || '<div class="empty-state">Le workflow en cours apparaîtra ici.</div>';
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

    // ── Update badge from recording status ──
    function applyStatus(status) {
        switch (status) {
            case 'listening':
                pipelineStatusBadge.textContent = 'En écoute';
                pipelineStatusBadge.className = 'pipeline-status-badge running';
                break;
            case 'thinking':
                pipelineStatusBadge.textContent = 'IA réfléchit...';
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

    function applyRecordingUI(status) {
        const isRecordingMode = (status === 'listening' || status === 'thinking');
        
        if (isRecordingMode) {
            if (!isRecordingUi) {
                isRecordingUi = true;
                startTimer();
            }
            waveformVisualizer?.classList.add('active');
            recordingDot?.classList.add('pulse');
            if (recorderStopBtn) {
                recorderStopBtn.classList.add('is-recording');
                recorderStopBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="stop-icon">
                        <rect x="7" y="7" width="10" height="10" rx="2" fill="white" />
                    </svg>
                `;
            }
            if (recordingLabel) recordingLabel.textContent = "Recording";
            
            if (status === 'thinking') {
                if (recordingLabel) recordingLabel.textContent = "Thinking...";
                waveformVisualizer.innerHTML = `<span style="font-weight:900;font-size:18px;letter-spacing:2px;color:#1a1a1a;margin-top:-8px;">.....................</span>`;
                waveformVisualizer.classList.remove('active');
            } else {
                waveformVisualizer.innerHTML = `
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                `;
            }
        } else {
            isRecordingUi = false;
            clearInterval(timerInterval);
            timerInterval = null;
            secondsElapsed = 0;
            if (recorderTimer) recorderTimer.textContent = "00:00";
            
            waveformVisualizer?.classList.remove('active');
            recordingDot?.classList.remove('pulse');
            
            if (recorderStopBtn) {
                recorderStopBtn.classList.remove('is-recording');
                recorderStopBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="7" fill="white" />
                    </svg>
                `;
            }
            if (recordingLabel) recordingLabel.textContent = "Ready";
            
            if (waveformVisualizer) {
                waveformVisualizer.innerHTML = `
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                    <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                `;
            }
        }
    }

    // Expose this so applyStatus can call it if needed, or simply assign it
    window.applyRecordingUI = applyRecordingUI;

    if(recorderPauseBtn) {
        recorderPauseBtn.addEventListener('click', () => {
            if (!isRecordingUi) return;
            isPaused = !isPaused;
            if (isPaused) {
                waveformVisualizer.classList.remove('active');
                recordingDot.classList.remove('pulse');
                recorderPauseBtn.style.backgroundColor = '#eadecd';
                recorderPauseBtn.innerHTML = `
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                `;
            } else {
                waveformVisualizer.classList.add('active');
                recordingDot.classList.add('pulse');
                recorderPauseBtn.style.backgroundColor = '#f6f3ee';
                recorderPauseBtn.innerHTML = `
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="pause-icon">
                    <rect x="8" y="5" width="3" height="14" rx="1.5" fill="#888" />
                    <rect x="13" y="5" width="3" height="14" rx="1.5" fill="#888" />
                  </svg>
                `;
            }
        });
    }

    if(recorderStopBtn) {
        recorderStopBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'TOGGLE_AUDIO' });
        });
    }
});
