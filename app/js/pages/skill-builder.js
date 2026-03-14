class SkillBuilderPage {
    render() {
        return `
            <div class="skill-builder-page">
                <header class="builder-header">
                    <div class="builder-header-left">
                        <div class="back-btn" onclick="app.router.navigate('skills')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></div>
                        <div class="breadcrumb">
                            <span class="breadcrumb-item" style="color: var(--text-secondary); cursor: pointer;" onclick="app.router.navigate('skills')">Skills</span>
                            <span class="breadcrumb-sep" style="color: var(--text-secondary);">/</span>
                            <span class="breadcrumb-item current">Skill Builder</span>
                        </div>
                    </div>
                    <div class="builder-header-right">
                        <div class="mode-toggle">
                            <div class="mode-btn active">Build</div>
                            <div class="mode-btn">Preview</div>
                        </div>
                        <button class="send-ai-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><polyline points="22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            Send to AI
                        </button>
                    </div>
                </header>

                <div class="builder-form">
                    <div class="skill-form-inner">
                        <div class="skill-input-group">
                            <input type="text" class="skill-name-input" placeholder="Name your AI skill...">
                            <input type="text" class="skill-desc-input" placeholder="What is the purpose of this skill?">
                        </div>

                        <div class="provider-group">
                            <h4 class="group-label">Target Provider</h4>
                            <div class="provider-options">
                                <button class="provider-btn active">
                                    <span class="provider-icon">C</span>
                                    Claude
                                </button>
                                <button class="provider-btn">
                                    <span class="provider-icon">G</span>
                                    ChatGPT
                                </button>
                                <button class="provider-btn">
                                    <span class="provider-icon">♊</span>
                                    Gemini
                                </button>
                            </div>
                        </div>

                        <div class="stack-group">
                            <div class="stack-group-header">
                                <h4 class="group-label">Skill Stack</h4>
                                <div class="kbd-hint">
                                    Press <span class="kbd">⌘</span> <span class="kbd">K</span> to add blocks
                                </div>
                            </div>

                            <div class="empty-stack-card">
                                <div class="add-block-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </div>
                                <h4>Add blocks to your skill</h4>
                                <p>Combine workflows, skills, and notes to create a rich context for your AI. Drag and drop sections to rearrange them.</p>
                                
                                <div class="stack-counts">
                                    <div class="count-item"><span class="count-dot" style="background-color: var(--accent-green-bright);"></span> 0 workflows</div>
                                    <div class="count-item"><span class="count-dot" style="background-color: var(--accent-blue);"></span> 0 skills</div>
                                    <div class="count-item"><span class="count-dot" style="background-color: var(--accent-orange);"></span> 0 notes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

window.SkillBuilderPage = SkillBuilderPage;
