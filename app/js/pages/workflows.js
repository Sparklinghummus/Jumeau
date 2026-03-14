class WorkflowsPage {
    render() {
        return `
            <div class="workflows-page">
                <div class="builder-panel">
                    <h2 class="builder-panel-title">Builder Blocks</h2>
                    
                    <h3 class="builder-section-title">Core</h3>
                    <div class="builder-block">
                        <div class="builder-block-icon builder-block-icon--blue">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </div>
                        <span class="builder-block-name">Voice Input</span>
                    </div>
                    <div class="builder-block">
                        <div class="builder-block-icon builder-block-icon--amber">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        </div>
                        <span class="builder-block-name">Classify</span>
                    </div>
                    <div class="builder-block">
                        <div class="builder-block-icon builder-block-icon--green">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
                        </div>
                        <span class="builder-block-name">End</span>
                    </div>

                    <h3 class="builder-section-title">Tools</h3>
                    <div class="builder-block">
                        <div class="builder-block-icon builder-block-icon--teal">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <span class="builder-block-name">AI Enrich</span>
                    </div>
                    <div class="builder-block">
                        <div class="builder-block-icon builder-block-icon--amber">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </div>
                        <span class="builder-block-name">File Search</span>
                    </div>

                    <h3 class="builder-section-title">Logic</h3>
                    <div class="builder-block">
                        <div class="builder-block-icon builder-block-icon--red">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="14" y1="4" x2="10" y2="20"/></svg>
                        </div>
                        <span class="builder-block-name">If / else</span>
                    </div>
                </div>

                <div class="workflow-canvas">
                    <header class="workflows-topbar">
                        <div class="workflows-topbar-left">
                            <div class="back-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></div>
                            <div class="breadcrumb">
                                <span class="breadcrumb-item">Workflows</span>
                                <span class="breadcrumb-sep">/</span>
                                <span class="breadcrumb-item current">Voice Capture Pipeline</span>
                            </div>
                            <span class="workflow-title-badge">Draft</span>
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
                            <span>6 blocks · 2 branches</span>
                        </div>
                        <div class="canvas-toolbar-actions">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                    </nav>

                    <div class="workflow-nodes-area">
                        <!-- Top Node -->
                        <div class="workflow-node">
                            <div class="workflow-node-header">
                                <div class="workflow-node-icon builder-block-icon--blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div>
                                <div>
                                    <div class="workflow-node-title">Voice Input</div>
                                </div>
                            </div>
                        </div>

                        <div class="connector-vertical"></div>

                        <!-- Classify Node -->
                        <div class="workflow-node">
                            <div class="workflow-node-header">
                                <div class="workflow-node-icon builder-block-icon--red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="14" y1="4" x2="10" y2="20"/></svg></div>
                                <div>
                                    <div class="workflow-node-title">Is type "Skill"?</div>
                                    <div class="workflow-node-subtitle">Condition</div>
                                </div>
                            </div>
                            <div class="workflow-node-body">
                                <p>Continue if context type is "Skill".</p>
                                <div class="status-badge status-badge--done"><span class="status-dot"></span> Done</div>
                            </div>
                        </div>

                        <div class="connector-vertical"></div>

                        <!-- Branches row -->
                        <div class="workflow-node-row">
                            <div class="workflow-node">
                                <div class="workflow-node-header">
                                    <div class="workflow-node-icon builder-block-icon--blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><database-icon></database-icon></svg></div>
                                    <div>
                                        <div class="workflow-node-title">Add to "Technical" tracker</div>
                                        <div class="workflow-node-subtitle">Records</div>
                                    </div>
                                </div>
                                <div class="workflow-node-body">
                                    <p>Add entry to "Technical" skill tracker.</p>
                                </div>
                                <div class="add-node-btn">+</div>
                            </div>

                            <div class="connector-horizontal"></div>

                            <div class="workflow-node">
                                <div class="workflow-node-header">
                                    <div class="workflow-node-icon builder-block-icon--purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><list-icon></list-icon></svg></div>
                                    <div>
                                        <div class="workflow-node-title">Add to "Soft Skills" list</div>
                                        <div class="workflow-node-subtitle">Lists</div>
                                    </div>
                                </div>
                                <div class="workflow-node-body">
                                    <p>Add entry to "Soft Skills" list.</p>
                                </div>
                                <div class="add-node-btn">+</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

window.WorkflowsPage = WorkflowsPage;
