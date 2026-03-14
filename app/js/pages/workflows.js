class WorkflowsPage {
    constructor() {
        this.canvasState = this.normalizeState();
        this.pageElement = null;
        this.abortController = null;
        this.storageListener = null;
        this.draggedNodeId = null;
        this.activeDropZone = null;
        this.activeWorkflowId = null;
        this.isSavingOrder = false;
    }

    render() {
        return `
            <div class="workflows-page">
                <div class="builder-panel">
                    <h2 class="builder-panel-title">Builder Blocks</h2>
                    
                    <h3 class="builder-section-title">Core</h3>
                    <div class="builder-block builder-block--static">
                        <div class="builder-block-icon builder-block-icon--blue">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </div>
                        <span class="builder-block-name">Voice Input</span>
                    </div>
                    <div class="builder-block builder-block--static">
                        <div class="builder-block-icon builder-block-icon--amber">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        </div>
                        <span class="builder-block-name">Classify</span>
                    </div>
                    <div class="builder-block builder-block--static">
                        <div class="builder-block-icon builder-block-icon--green">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
                        </div>
                        <span class="builder-block-name">End</span>
                    </div>

                    <h3 class="builder-section-title">Tools</h3>
                    <div class="builder-block builder-block--static">
                        <div class="builder-block-icon builder-block-icon--teal">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <span class="builder-block-name">AI Enrich</span>
                    </div>
                    <div class="builder-block builder-block--static">
                        <div class="builder-block-icon builder-block-icon--amber">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </div>
                        <span class="builder-block-name">File Search</span>
                    </div>

                    <h3 class="builder-section-title">Logic</h3>
                    <div class="builder-block builder-block--static">
                        <div class="builder-block-icon builder-block-icon--red">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="14" y1="4" x2="10" y2="20"/></svg>
                        </div>
                        <span class="builder-block-name">If / else</span>
                    </div>

                    <div class="workflow-library">
                        <h3 class="builder-section-title">Live Workflows</h3>
                        <div class="workflow-library-copy">Gemini workflows stay synced here. Click one to inspect it.</div>
                        <div class="workflow-list" data-role="workflow-list"></div>
                    </div>
                </div>

                <div class="workflow-canvas">
                    <header class="workflows-topbar">
                        <div class="workflows-topbar-left">
                            <button class="back-btn" type="button" data-action="back">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <div class="breadcrumb">
                                <span class="breadcrumb-item">Workflows</span>
                                <span class="breadcrumb-sep">/</span>
                                <span class="breadcrumb-item current" data-role="workflow-title">Live canvas</span>
                            </div>
                            <span class="workflow-title-badge" data-role="workflow-badge">Draft</span>
                        </div>
                        <div class="workflows-topbar-right">
                            <button class="topbar-btn topbar-btn--editor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Editor</button>
                            <button class="topbar-btn topbar-btn--runs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Runs</button>
                            <button class="topbar-btn topbar-btn--more">...</button>
                            <button class="topbar-btn topbar-btn--publish">Publish</button>
                        </div>
                    </header>

                    <nav class="canvas-toolbar">
                        <div class="canvas-toolbar-info">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                            <span data-role="workflow-stats">No workflow selected</span>
                        </div>
                        <div class="canvas-toolbar-actions">
                            <span class="sync-pill" data-role="sync-status">Checking extension state...</span>
                        </div>
                    </nav>

                    <div class="workflow-nodes-area" data-role="workflow-surface"></div>
                </div>
            </div>
        `;
    }

    afterRender(pageElement) {
        this.pageElement = pageElement;
        this.abortController = new AbortController();
        this.workflowListElement = pageElement.querySelector('[data-role="workflow-list"]');
        this.workflowTitleElement = pageElement.querySelector('[data-role="workflow-title"]');
        this.workflowBadgeElement = pageElement.querySelector('[data-role="workflow-badge"]');
        this.workflowStatsElement = pageElement.querySelector('[data-role="workflow-stats"]');
        this.syncStatusElement = pageElement.querySelector('[data-role="sync-status"]');
        this.workflowSurfaceElement = pageElement.querySelector('[data-role="workflow-surface"]');

        this.bindEvents();
        this.renderState();
        this.hydrateInitialState();
        this.subscribeToStorage();
    }

    destroy() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.storageListener && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
            chrome.storage.onChanged.removeListener(this.storageListener);
            this.storageListener = null;
        }
    }

    bindEvents() {
        const signal = this.abortController.signal;

        this.pageElement.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const backButton = event.target.closest('[data-action="back"]');
            if (backButton) {
                window.app?.router?.navigate('home');
                return;
            }

            const workflowButton = event.target.closest('[data-workflow-id]');
            if (workflowButton) {
                this.selectWorkflow(workflowButton.getAttribute('data-workflow-id'));
            }
        }, { signal });

        this.pageElement.addEventListener('dragstart', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const nodeCard = event.target.closest('[data-node-id]');
            if (!nodeCard) {
                return;
            }

            this.draggedNodeId = nodeCard.getAttribute('data-node-id');
            nodeCard.classList.add('is-dragging');

            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', this.draggedNodeId);
            }
        }, { signal });

        this.pageElement.addEventListener('dragend', () => {
            this.draggedNodeId = null;
            this.clearDropIndicator();
            this.pageElement.querySelectorAll('.is-dragging').forEach((element) => {
                element.classList.remove('is-dragging');
            });
        }, { signal });

        this.pageElement.addEventListener('dragover', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const dropZone = event.target.closest('[data-drop-index]');
            if (!dropZone || !this.draggedNodeId) {
                return;
            }

            event.preventDefault();
            this.setDropIndicator(dropZone);
        }, { signal });

        this.pageElement.addEventListener('drop', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const dropZone = event.target.closest('[data-drop-index]');
            if (!dropZone || !this.draggedNodeId) {
                return;
            }

            event.preventDefault();
            const dropIndex = Number(dropZone.getAttribute('data-drop-index'));
            this.reorderActiveWorkflowNodes(dropIndex);
        }, { signal });
    }

    hydrateInitialState() {
        if (!this.canUseExtensionApi()) {
            this.setSyncStatus('Extension APIs unavailable');
            this.renderState();
            return;
        }

        chrome.runtime.sendMessage({ type: 'GET_LIVE_CANVAS_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
                this.setSyncStatus('Unable to load workflow state');
                return;
            }

            this.canvasState = this.normalizeState(response?.state);
            this.syncSelectionWithState();
            this.setSyncStatus(this.canvasState.workflows.length ? 'Synced with extension storage' : 'Waiting for Gemini workflows');
            this.renderState();
        });
    }

    subscribeToStorage() {
        if (!this.canUseExtensionApi() || !chrome.storage?.onChanged) {
            return;
        }

        this.storageListener = (changes, areaName) => {
            if (areaName !== 'local' || !changes.liveCanvasState) {
                return;
            }

            this.canvasState = this.normalizeState(changes.liveCanvasState.newValue);
            this.syncSelectionWithState();
            this.setSyncStatus(this.isSavingOrder ? 'Layout saved' : 'Updated from Gemini');
            this.isSavingOrder = false;
            this.renderState();
        };

        chrome.storage.onChanged.addListener(this.storageListener);
    }

    canUseExtensionApi() {
        return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.sendMessage);
    }

    normalizeState(state = {}) {
        return {
            currentWorkflowId: state.currentWorkflowId || null,
            workflows: Array.isArray(state.workflows) ? state.workflows : [],
            questions: Array.isArray(state.questions) ? state.questions : [],
            actions: Array.isArray(state.actions) ? state.actions : [],
            transcriptions: Array.isArray(state.transcriptions) ? state.transcriptions : []
        };
    }

    syncSelectionWithState() {
        const workflowIds = new Set(this.canvasState.workflows.map((workflow) => workflow.id));
        if (this.canvasState.currentWorkflowId && workflowIds.has(this.canvasState.currentWorkflowId)) {
            this.activeWorkflowId = this.canvasState.currentWorkflowId;
            return;
        }

        if (this.activeWorkflowId && workflowIds.has(this.activeWorkflowId)) {
            return;
        }

        this.activeWorkflowId = this.canvasState.workflows[0]?.id || null;
    }

    getActiveWorkflow() {
        return this.canvasState.workflows.find((workflow) => workflow.id === this.activeWorkflowId) || null;
    }

    selectWorkflow(workflowId) {
        if (!workflowId || workflowId === this.activeWorkflowId) {
            return;
        }

        this.activeWorkflowId = workflowId;
        this.renderState();

        if (!this.canUseExtensionApi()) {
            return;
        }

        chrome.runtime.sendMessage({ type: 'SET_CURRENT_WORKFLOW', workflowId }, (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
                this.setSyncStatus('Unable to select workflow');
                return;
            }

            this.canvasState = this.normalizeState(response.state);
            this.syncSelectionWithState();
            this.setSyncStatus('Active workflow synced');
            this.renderState();
        });
    }

    reorderActiveWorkflowNodes(dropIndex) {
        const workflow = this.getActiveWorkflow();
        if (!workflow || !Array.isArray(workflow.nodes) || !workflow.nodes.length || !this.draggedNodeId) {
            return;
        }

        const orderedNodeIds = workflow.nodes.map((node) => node.id).filter((nodeId) => nodeId !== this.draggedNodeId);
        const boundedIndex = Math.max(0, Math.min(dropIndex, orderedNodeIds.length));
        orderedNodeIds.splice(boundedIndex, 0, this.draggedNodeId);

        const currentOrder = workflow.nodes.map((node) => node.id);
        if (currentOrder.join('|') === orderedNodeIds.join('|')) {
            this.clearDropIndicator();
            return;
        }

        this.persistNodeOrder(workflow.id, orderedNodeIds);
    }

    persistNodeOrder(workflowId, nodeIds) {
        if (!this.canUseExtensionApi()) {
            return;
        }

        this.isSavingOrder = true;
        this.setSyncStatus('Saving layout...');
        this.clearDropIndicator();

        chrome.runtime.sendMessage({
            type: 'REORDER_WORKFLOW_NODES',
            workflowId,
            nodeIds
        }, (response) => {
            this.draggedNodeId = null;

            if (chrome.runtime.lastError || !response?.ok) {
                this.isSavingOrder = false;
                this.setSyncStatus('Unable to save layout');
                return;
            }

            this.canvasState = this.normalizeState(response.state);
            this.syncSelectionWithState();
            this.setSyncStatus('Layout saved');
            this.isSavingOrder = false;
            this.renderState();
        });
    }

    setSyncStatus(text) {
        if (this.syncStatusElement) {
            this.syncStatusElement.textContent = text;
        }
    }

    setDropIndicator(dropZone) {
        if (this.activeDropZone === dropZone) {
            return;
        }

        this.clearDropIndicator();
        this.activeDropZone = dropZone;
        this.activeDropZone.classList.add('is-active');
    }

    clearDropIndicator() {
        if (this.activeDropZone) {
            this.activeDropZone.classList.remove('is-active');
            this.activeDropZone = null;
        }
    }

    renderState() {
        this.syncSelectionWithState();
        this.renderWorkflowList();
        this.renderWorkflowSurface();
    }

    renderWorkflowList() {
        if (!this.workflowListElement) {
            return;
        }

        if (!this.canvasState.workflows.length) {
            this.workflowListElement.innerHTML = `
                <div class="workflow-list-empty">
                    Start recording and Gemini will add workflows here automatically.
                </div>
            `;
            return;
        }

        this.workflowListElement.innerHTML = this.canvasState.workflows.map((workflow) => `
            <button class="workflow-list-item ${workflow.id === this.activeWorkflowId ? 'is-active' : ''}" type="button" data-workflow-id="${this.escapeAttr(workflow.id)}">
                <div class="workflow-list-item-title">${this.escapeHtml(workflow.title || 'Workflow')}</div>
                <div class="workflow-list-item-meta">${(workflow.nodes || []).length} nodes</div>
            </button>
        `).join('');
    }

    renderWorkflowSurface() {
        if (!this.workflowSurfaceElement) {
            return;
        }

        const workflow = this.getActiveWorkflow();
        if (!workflow) {
            this.workflowTitleElement.textContent = 'Live canvas';
            this.workflowBadgeElement.textContent = 'Draft';
            this.workflowStatsElement.textContent = 'No workflow selected';
            this.workflowSurfaceElement.innerHTML = `
                <div class="workflow-empty-state">
                    <div class="workflow-empty-state-title">Waiting for a workflow</div>
                    <div class="workflow-empty-state-copy">Gemini-created workflows will appear here automatically.</div>
                </div>
            `;
            return;
        }

        const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
        const questionsCount = this.canvasState.questions.filter((question) => !question.workflowId || question.workflowId === workflow.id).length;

        this.workflowTitleElement.textContent = workflow.title || 'Workflow';
        this.workflowBadgeElement.textContent = workflow.status || 'Draft';
        this.workflowStatsElement.textContent = `${nodes.length} blocks · ${questionsCount} questions`;

        if (!nodes.length) {
            this.workflowSurfaceElement.innerHTML = `
                <div class="workflow-empty-state">
                    <div class="workflow-empty-state-title">${this.escapeHtml(workflow.title || 'Workflow')}</div>
                    <div class="workflow-empty-state-copy">${this.escapeHtml(workflow.goal || workflow.summary || 'Gemini created the workflow shell but has not added nodes yet.')}</div>
                </div>
            `;
            return;
        }

        this.workflowSurfaceElement.innerHTML = `
            <div class="workflow-summary">
                <div class="workflow-summary-item">
                    <span class="workflow-summary-label">Goal</span>
                    <span class="workflow-summary-value">${this.escapeHtml(workflow.goal || workflow.summary || 'Workflow detected during observation')}</span>
                </div>
                <div class="workflow-summary-item">
                    <span class="workflow-summary-label">Trigger</span>
                    <span class="workflow-summary-value">${this.escapeHtml(workflow.trigger || 'Detected from screen context')}</span>
                </div>
            </div>

            ${this.renderDropZone(0)}
            ${nodes.map((node, index) => `
                ${this.renderNode(node)}
                ${index < nodes.length - 1 ? '<div class="connector-vertical"></div>' : ''}
                ${this.renderDropZone(index + 1)}
            `).join('')}
        `;
    }

    renderNode(node) {
        const visual = this.getNodeVisual(node.type);

        return `
            <div class="workflow-node workflow-node--interactive" draggable="true" data-node-id="${this.escapeAttr(node.id)}">
                <div class="workflow-node-header">
                    <div class="workflow-node-icon ${visual.iconClass}">${visual.icon}</div>
                    <div>
                        <div class="workflow-node-title">${this.escapeHtml(node.title || 'New node')}</div>
                        <div class="workflow-node-subtitle">${this.escapeHtml(visual.subtitle)}</div>
                    </div>
                </div>
                <div class="workflow-node-body">
                    <p>${this.escapeHtml(node.description || '')}</p>
                    ${this.renderStatusBadge(node.status)}
                </div>
                <div class="workflow-node-footer">
                    <span class="workflow-node-type-label">${this.escapeHtml(node.type || 'step')}</span>
                    <span class="workflow-node-drag" aria-hidden="true"><span></span><span></span><span></span></span>
                </div>
            </div>
        `;
    }

    renderStatusBadge(status) {
        const normalizedStatus = String(status || 'draft').toLowerCase();

        if (normalizedStatus === 'ready') {
            return '<div class="status-badge status-badge--done"><span class="status-dot"></span> Ready</div>';
        }

        if (normalizedStatus === 'thinking' || normalizedStatus === 'running') {
            return '<div class="status-badge status-badge--running"><span class="status-dot"></span> Thinking</div>';
        }

        return '<div class="status-badge"><span class="status-dot"></span> Draft</div>';
    }

    renderDropZone(index) {
        return `
            <div class="workflow-drop-zone" data-drop-index="${index}">
                <span>Drop here</span>
            </div>
        `;
    }

    getNodeVisual(type) {
        const normalizedType = String(type || 'step').toLowerCase();

        const icons = {
            decision: {
                iconClass: 'builder-block-icon--red',
                subtitle: 'Condition',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="14" y1="4" x2="10" y2="20"/></svg>'
            },
            observe: {
                iconClass: 'builder-block-icon--teal',
                subtitle: 'Observation',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'
            },
            output: {
                iconClass: 'builder-block-icon--purple',
                subtitle: 'Output',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg>'
            },
            question: {
                iconClass: 'builder-block-icon--amber',
                subtitle: 'Question',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
            },
            trigger: {
                iconClass: 'builder-block-icon--blue',
                subtitle: 'Trigger',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
            }
        };

        return icons[normalizedType] || {
            iconClass: 'builder-block-icon--green',
            subtitle: 'Step',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>'
        };
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    escapeAttr(value) {
        return this.escapeHtml(String(value).replaceAll(/\s+/g, '-').toLowerCase());
    }
}

window.WorkflowsPage = WorkflowsPage;
