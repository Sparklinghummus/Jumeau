class SkillsPage {
    render() {
        return `
            <div class="skills-page">
                <header class="skills-header-bar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                    <span>Skills</span>
                </header>

                <div class="skills-content">
                    <div class="skills-top">
                        <div class="skills-title-section">
                            <h1>Skills</h1>
                            <p>Track your expertise and growth areas</p>
                        </div>
                        <div class="skills-mic-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </div>
                    </div>

                    <div class="ai-skill-banner" onclick="app.router.navigate('skill-builder')">
                        <div class="ai-skill-banner-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        </div>
                        <div class="ai-skill-banner-text">
                            <div class="ai-skill-banner-title">
                                <h3>Build an AI Skill</h3>
                                <span class="new-badge">New</span>
                            </div>
                            <p>Combine your workflows, skills, and notes into a stackable skill package — then send it to Claude, GPT, or Gemini</p>
                        </div>
                        <div class="ai-skill-banner-indicators">
                            <span class="ai-skill-indicator" style="background-color: var(--accent-green-bright);"></span>
                            <span class="ai-skill-indicator" style="background-color: var(--accent-blue);"></span>
                            <span class="ai-skill-indicator" style="background-color: var(--accent-orange);"></span>
                        </div>
                        <div class="ai-skill-banner-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>

                    <div class="skills-grid">
                        ${this.renderSkillCard('React', 'Frontend', 90, '2 days ago')}
                        ${this.renderSkillCard('TypeScript', 'Languages', 85, '1 week ago')}
                        ${this.renderSkillCard('Node.js', 'Backend', 75, '3 days ago')}
                        ${this.renderSkillCard('System Design', 'Architecture', 70, '5 days ago')}
                        ${this.renderSkillCard('GraphQL', 'APIs', 60, '2 weeks ago')}
                        ${this.renderSkillCard('Docker', 'DevOps', 55, '1 month ago')}
                    </div>
                </div>
            </div>
        `;
    }

    renderSkillCard(name, category, value, time) {
        return `
            <div class="skill-card">
                <div class="skill-card-header">
                    <h3 class="skill-card-name">${name}</h3>
                    <div class="skill-card-star"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
                </div>
                <div class="skill-card-category">${category}</div>
                
                <div class="proficiency-row">
                    <div class="proficiency-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        Proficiency
                    </div>
                    <div class="proficiency-value">${value}%</div>
                </div>
                <div class="proficiency-bar-bg">
                    <div class="proficiency-bar-fill" style="width: ${value}%"></div>
                </div>

                <div class="skill-card-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${time}
                </div>
            </div>
        `;
    }
}

window.SkillsPage = SkillsPage;
