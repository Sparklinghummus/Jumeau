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
            pipelineName.textContent = 'Voice Capture Pipeline';
            pipelineStatusBadge.textContent = 'Idle';
            pipelineStatusBadge.className = 'pipeline-status-badge idle';
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
        pipelineName.textContent = escapeHtml(workflow.title || 'Voice Capture Pipeline');

        if (doneCount === total && total > 0) {
            pipelineStatusBadge.textContent = 'Completed';
            pipelineStatusBadge.className = 'pipeline-status-badge completed';
        } else if (hasRunning || doneCount > 0) {
            pipelineStatusBadge.textContent = 'Running';
            pipelineStatusBadge.className = 'pipeline-status-badge running';
        } else {
            pipelineStatusBadge.textContent = 'Idle';
            pipelineStatusBadge.className = 'pipeline-status-badge idle';
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

    // Initial render
    renderCanvasState();
    hydrateInitialState();
});
