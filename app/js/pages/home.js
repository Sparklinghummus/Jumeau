class HomePage {
    render() {
        return `
            <div class="home-page">
                <header class="home-greeting">
                    <h1>Good afternoon 👋</h1>
                    <p>What would you like to capture today?</p>
                </header>

                <div class="home-quick-actions">
                    <div class="quick-action-card" onclick="app.router.navigate('workflows')">
                        <div class="quick-action-icon quick-action-icon--workflows">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="16 3 21 3 21 8"></polyline>
                                <line x1="4" y1="20" x2="21" y2="3"></line>
                                <polyline points="21 16 21 21 16 21"></polyline>
                                <line x1="15" y1="15" x2="21" y2="21"></line>
                                <line x1="4" y1="4" x2="9" y2="9"></line>
                            </svg>
                        </div>
                        <h3>Workflows</h3>
                        <p>Map out your processes</p>
                    </div>

                    <div class="quick-action-card" onclick="app.router.navigate('notes')">
                        <div class="quick-action-icon quick-action-icon--notes">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <h3>Notes</h3>
                        <p>Capture quick thoughts</p>
                    </div>

                    <div class="quick-action-card" onclick="app.router.navigate('skills')">
                        <div class="quick-action-icon quick-action-icon--skills">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </div>
                        <h3>Skills</h3>
                        <p>Track your expertise</p>
                    </div>
                </div>

                <section class="home-recent-activity">
                    <h2 class="section-label">Recent Activity</h2>
                    <div class="activity-list">
                        <div class="activity-item">
                            <div class="activity-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </div>
                            <div class="activity-text">Updated Voice Capture Pipeline workflow</div>
                            <div class="activity-time">2 hours ago</div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div class="activity-text">Added note about sprint planning preferences</div>
                            <div class="activity-time">5 hours ago</div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <div class="activity-text">React skill updated to 90%</div>
                            <div class="activity-time">1 day ago</div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </div>
                            <div class="activity-text">Created new code review workflow</div>
                            <div class="activity-time">2 days ago</div>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
}

window.HomePage = HomePage;
