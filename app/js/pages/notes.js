class NotesPage {
    render() {
        return `
            <div class="notes-page">
                <header class="notes-header">
                    <h1>What's on your mind?</h1>
                </header>

                <div class="notes-input-container">
                    <input type="text" class="notes-input" placeholder="Search or type a new note...">
                    <div class="mic-action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    </div>
                </div>

                <section class="recents-section">
                    <div class="recents-header">
                        <h2 class="recents-label">Recent Notes</h2>
                        <div class="recents-actions">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </div>
                    </div>

                    <div class="note-list">
                        <div class="note-item">
                            <div class="note-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div class="note-content">
                                <h4>Sprint planning preferences: focus on architectural tasks in the morning, leaving routine code reviews for late afternoon.</h4>
                                <div class="note-meta">5 hours ago</div>
                            </div>
                        </div>

                        <div class="note-item">
                            <div class="note-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div class="note-content">
                                <h4>React Context API: use for global theme and user state, but prefer local state for component-specific logic to avoid unnecessary re-renders.</h4>
                                <div class="note-meta">1 day ago</div>
                            </div>
                        </div>

                        <div class="note-item">
                            <div class="note-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div class="note-content">
                                <h4>GraphQL patterns: implement cursor-based pagination for large data sets in the feed view.</h4>
                                <div class="note-meta">2 days ago</div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
}

window.NotesPage = NotesPage;
