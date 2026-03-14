document.addEventListener('DOMContentLoaded', () => {
    const statusIndicator = document.getElementById('ai-status');
    const panelScroll = document.getElementById('panel-scroll');
    const actionList = document.getElementById('action-list');
    const chatList = document.getElementById('chat-list');
    const workflowBoard = document.getElementById('workflow-board');
    const questionsBoard = document.getElementById('questions-board');
    const exportBtn = document.getElementById('exportBtn');
    const openAppBtn = document.getElementById('openAppBtn');
    const clearContextBtn = document.getElementById('clearContextBtn');

    const tabActions = document.getElementById('tab-actions');
    const tabTranscription = document.getElementById('tab-transcription');
    const viewActions = document.getElementById('view-actions');
    const viewTranscription = document.getElementById('view-transcription');
    const segmentIndicator = document.getElementById('segment-indicator');

    let canvasState = normalizeState();

    if (window.lucide) {
        window.lucide.createIcons();
    }

    function switchTab(tab) {
        if (tab === 'actions') {
            segmentIndicator.style.transform = 'translateX(0)';
            tabActions.classList.add('active');
            tabTranscription.classList.remove('active');
            viewActions.classList.add('active');
            viewTranscription.classList.remove('active');
        } else {
            segmentIndicator.style.transform = 'translateX(100%)';
            tabTranscription.classList.add('active');
            tabActions.classList.remove('active');
            viewTranscription.classList.add('active');
            viewActions.classList.remove('active');
        }
        scrollToBottom();
    }

    tabActions.addEventListener('click', () => switchTab('actions'));
    tabTranscription.addEventListener('click', () => switchTab('transcription'));

    function scrollToBottom() {
        setTimeout(() => {
            panelScroll.scrollTo({
                top: panelScroll.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

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
        return canvasState.workflows.find((workflow) => workflow.id === canvasState.currentWorkflowId)
            || canvasState.workflows[canvasState.workflows.length - 1]
            || null;
    }

    function renderWorkflow() {
        const workflow = getActiveWorkflow();

        if (!workflow) {
            workflowBoard.innerHTML = '<div class="empty-state">Le workflow en cours apparaîtra ici.</div>';
            return;
        }

        const nodeMarkup = (workflow.nodes || []).map((node, index) => `
            <div class="workflow-node-card">
                <div class="workflow-node-card-header">
                    <span class="workflow-node-step">${String(index + 1).padStart(2, '0')}</span>
                    <span class="workflow-node-type workflow-node-type--${escapeAttr(node.type || 'step')}">${escapeHtml(node.type || 'step')}</span>
                </div>
                <div class="workflow-node-card-title">${escapeHtml(node.title || 'Nouveau noeud')}</div>
                <div class="workflow-node-card-desc">${escapeHtml(node.description || '')}</div>
            </div>
        `).join('');

        workflowBoard.innerHTML = `
            <div class="workflow-card">
                <div class="workflow-card-topline">
                    <span class="workflow-chip">Draft</span>
                    <span class="workflow-chip workflow-chip--muted">${(workflow.nodes || []).length} noeuds</span>
                </div>
                <h2>${escapeHtml(workflow.title || 'Workflow')}</h2>
                <p class="workflow-card-copy">${escapeHtml(workflow.goal || workflow.summary || '')}</p>
                <div class="workflow-meta">
                    <div class="workflow-meta-item">
                        <span class="workflow-meta-label">Déclencheur</span>
                        <span class="workflow-meta-value">${escapeHtml(workflow.trigger || 'Détection contextuelle')}</span>
                    </div>
                    ${workflow.domain ? `
                        <div class="workflow-meta-item">
                            <span class="workflow-meta-label">Contexte</span>
                            <span class="workflow-meta-value">${escapeHtml(workflow.domain)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="workflow-nodes-stack">
                    ${nodeMarkup || '<div class="empty-inline">Jumeau n’a pas encore ajouté de noeud.</div>'}
                </div>
            </div>
        `;
    }

    function renderQuestions() {
        const workflow = getActiveWorkflow();
        const questions = canvasState.questions.filter((question) => {
            return !workflow || !question.workflowId || question.workflowId === workflow.id;
        });

        if (!questions.length) {
            questionsBoard.innerHTML = '<div class="empty-state">Les questions de clarification apparaîtront ici.</div>';
            return;
        }

        questionsBoard.innerHTML = questions.slice(-6).map((question) => `
            <div class="question-card">
                <div class="question-card-title">${escapeHtml(question.text || '')}</div>
                ${question.context ? `<div class="question-card-context">${escapeHtml(question.context)}</div>` : ''}
                ${(question.suggestedAnswers || []).length ? `
                    <div class="question-chip-row">
                        ${question.suggestedAnswers.map((answer) => `<span class="question-chip">${escapeHtml(answer)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    function renderActions() {
        if (!canvasState.actions.length) {
            actionList.innerHTML = '<div class="empty-state">Aucune action pour le moment.</div>';
            exportBtn.disabled = !getActiveWorkflow();
            return;
        }

        actionList.innerHTML = canvasState.actions.slice(-20).map((action) => `
            <div class="action-item">
                <div class="action-icon">
                    <i data-lucide="${escapeAttr(action.icon || 'sparkles')}"></i>
                </div>
                <div class="action-details">
                    <div class="action-title">${escapeHtml(action.title || 'Action')}</div>
                    <div class="action-stream">${escapeHtml(action.description || '')}</div>
                </div>
            </div>
        `).join('');

        exportBtn.disabled = false;
    }

    function renderTranscriptions() {
        if (!canvasState.transcriptions.length) {
            chatList.innerHTML = '<div class="empty-state">La transcription apparaîtra ici.</div>';
            return;
        }

        chatList.innerHTML = canvasState.transcriptions.slice(-40).map((entry) => {
            const role = entry.role === 'user' ? 'user' : 'assistant';
            const icon = role === 'user' ? 'user' : 'sparkles';
            const sender = role === 'user' ? 'Vous' : 'Jumeau';
            const timestamp = new Date(entry.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="chat-bubble-container ${role}">
                    <div class="chat-bubble">${escapeHtml(entry.text || '')}</div>
                    <div class="chat-meta">
                        <i data-lucide="${icon}" style="width:12px;height:12px;"></i>
                        ${sender} • ${timestamp}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderCanvasState() {
        renderWorkflow();
        renderQuestions();
        renderActions();
        renderTranscriptions();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function updateStatus(status) {
        statusIndicator.className = `status-indicator ${status}`;
        let statusText = 'Prêt';
        switch (status) {
            case 'listening': statusText = 'En écoute...'; break;
            case 'thinking': statusText = 'IA réfléchit...'; break;
            case 'ready': statusText = 'Prêt'; break;
        }
        statusIndicator.innerHTML = `<span class="dot"></span> ${statusText}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function escapeAttr(value) {
        return escapeHtml(String(value).replaceAll(/\s+/g, '-').toLowerCase());
    }

    function hydrateInitialState() {
        chrome.runtime.sendMessage({ type: 'GET_LIVE_CANVAS_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Impossible de charger l'état initial :", chrome.runtime.lastError.message);
                return;
            }

            if (response?.state) {
                canvasState = normalizeState(response.state);
                renderCanvasState();
            }

            if (response?.status) {
                updateStatus(response.status);
            }
        });
    }

    openAppBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('app/index.html#workflows') });
    });

    clearContextBtn.addEventListener('click', () => {
        const shouldClear = window.confirm(
            'Effacer le workflow, le journal et la transcription, puis fermer la session de contexte en cours ?'
        );

        if (!shouldClear) {
            return;
        }

        clearContextBtn.disabled = true;
        const previousTitle = clearContextBtn.title;
        clearContextBtn.title = 'Réinitialisation...';
        clearContextBtn.setAttribute('aria-label', 'Réinitialisation...');

        canvasState = normalizeState();
        renderCanvasState();
        switchTab('actions');

        chrome.runtime.sendMessage({ type: 'CLEAR_LIVE_CONTEXT' }, (response) => {
            clearContextBtn.disabled = false;
            clearContextBtn.title = previousTitle;
            clearContextBtn.setAttribute('aria-label', previousTitle);

            if (chrome.runtime.lastError) {
                alert(`Impossible de vider le contexte : ${chrome.runtime.lastError.message}`);
                hydrateInitialState();
                return;
            }

            if (response?.state) {
                canvasState = normalizeState(response.state);
                renderCanvasState();
            }

            if (response?.status) {
                updateStatus(response.status);
            }

            if (!response?.ok) {
                alert(response?.error || 'Impossible de vider le contexte.');
            }
        });
    });

    chrome.runtime.onMessage.addListener((message) => {
        if (message.target !== 'sidepanel') return;

        if (message.type === 'STATUS_UPDATE') {
            updateStatus(message.status);
            return;
        }

        if (message.type === 'SYNC_CANVAS_STATE') {
            canvasState = normalizeState(message.state);
            renderCanvasState();
            scrollToBottom();
        }
    });

    exportBtn.addEventListener('click', () => {
        alert("Export du Blueprint lancé...");
    });

    renderCanvasState();
    hydrateInitialState();
});
