class ContextPage {
    render() {
        return `
            <div class="context-page">
                <header class="context-header">
                    <div class="context-header-left">
                        <div class="context-header-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/></svg>
                        </div>
                        <div class="context-header-info">
                            <h1>Your Context Graph</h1>
                            <p>Everything Jumo knows about how you work</p>
                        </div>
                    </div>
                    <div class="context-sync">
                        <span class="sync-dot"></span>
                        Last synced 2 min ago
                    </div>
                </header>

                <div class="context-stats">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background-color: var(--stat-blue-bg);">
                                <svg color="#3b82f6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            </div>
                            <div class="stat-card-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 7 17 17"/><polyline points="17 7 17 17 7 17"/></svg>
                            </div>
                        </div>
                        <div class="stat-card-number">127</div>
                        <div class="stat-card-label">Total Captures</div>
                        <div class="stat-card-change">+12 this week</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background-color: var(--stat-purple-bg);">
                                <svg color="#8b5cf6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <div class="stat-card-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 7 17 17"/><polyline points="17 7 17 17 7 17"/></svg>
                            </div>
                        </div>
                        <div class="stat-card-number">14</div>
                        <div class="stat-card-label">Skills Tracked</div>
                        <div class="stat-card-change">+2 this month</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background-color: var(--stat-green-bg);">
                                <svg color="#10b981" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </div>
                            <div class="stat-card-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 7 17 17"/><polyline points="17 7 17 17 7 17"/></svg>
                            </div>
                        </div>
                        <div class="stat-card-number">6</div>
                        <div class="stat-card-label">Workflows</div>
                        <div class="stat-card-change">3 active</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <div class="stat-card-icon" style="background-color: var(--stat-amber-bg);">
                                <svg color="#f59e0b" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div class="stat-card-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 7 17 17"/><polyline points="17 7 17 17 7 17"/></svg>
                            </div>
                        </div>
                        <div class="stat-card-number">43</div>
                        <div class="stat-card-label">Notes</div>
                        <div class="stat-card-change">+5 this week</div>
                    </div>
                </div>

                <div class="context-charts-row">
                    <div class="context-map-card">
                        <header class="context-map-header">
                            <div>
                                <h2>Context Map</h2>
                                <p>How your skills, topics, and tools connect</p>
                            </div>
                            <div class="chart-legend">
                                <div class="legend-item"><span class="legend-dot" style="background-color: var(--accent-blue);"></span> skills</div>
                                <div class="legend-item"><span class="legend-dot" style="background-color: var(--accent-green);"></span> topics</div>
                                <div class="legend-item"><span class="legend-dot" style="background-color: var(--accent-amber);"></span> tools</div>
                                <div class="legend-item"><span class="legend-dot" style="background-color: var(--accent-purple);"></span> traits</div>
                            </div>
                        </header>
                        <div class="context-graph" id="context-graph-viz">
                            <!-- Nodes would be dynamically positioned or rendered via Canvas/SVG -->
                            <!-- React node -->
                            <div class="graph-node" style="left: 224px; top: 100px;">
                                <div class="graph-node-dot" style="width: 22px; height: 22px; background-color: var(--accent-blue);"></div>
                                <span class="graph-node-label">React</span>
                            </div>
                            <!-- TypeScript node -->
                            <div class="graph-node" style="left: 320px; top: 79px;">
                                <div class="graph-node-dot" style="width: 22px; height: 22px; background-color: var(--accent-blue);"></div>
                                <span class="graph-node-label">TypeScript</span>
                            </div>
                            <!-- Node.js node -->
                            <div class="graph-node" style="left: 384px; top: 144px;">
                                <div class="graph-node-dot" style="width: 20px; height: 20px; background-color: var(--accent-blue);"></div>
                                <span class="graph-node-label">Node.js</span>
                            </div>
                            <!-- GraphQL node -->
                            <div class="graph-node" style="left: 427px; top: 93px;">
                                <div class="graph-node-dot" style="width: 18px; height: 18px; background-color: var(--accent-amber);"></div>
                                <span class="graph-node-label">GraphQL</span>
                            </div>
                            <!-- More nodes... -->
                        </div>
                    </div>

                    <div class="skill-radar-card">
                        <header class="skill-radar-header">
                            <h2>Skill Radar</h2>
                            <p>Your proficiency landscape</p>
                        </header>
                        <div class="radar-chart-container">
                            <!-- Simple SVG Radar representation -->
                            <svg viewBox="0 0 200 200" width="100%" height="200">
                                <!-- Background circles -->
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#eee" stroke-width="1"/>
                                <circle cx="100" cy="100" r="60" fill="none" stroke="#eee" stroke-width="1"/>
                                <circle cx="100" cy="100" r="40" fill="none" stroke="#eee" stroke-width="1"/>
                                <circle cx="100" cy="100" r="20" fill="none" stroke="#eee" stroke-width="1"/>
                                <!-- Spoke lines -->
                                <line x1="100" y1="20" x2="100" y2="180" stroke="#eee" stroke-width="1"/>
                                <line x1="20" y1="100" x2="180" y2="100" stroke="#eee" stroke-width="1"/>
                                <line x1="43.4" y1="43.4" x2="156.6" y2="156.6" stroke="#eee" stroke-width="1"/>
                                <line x1="43.4" y1="156.6" x2="156.6" y2="43.4" stroke="#eee" stroke-width="1"/>
                                <!-- Data polygon -->
                                <polygon points="100,40 160,80 140,140 100,160 60,140 40,80" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="radar-legend">
                            <span class="legend-dot" style="background-color: var(--accent-green-bright);"></span>
                            <span>Current proficiency</span>
                        </div>
                    </div>
                </div>

                <div class="context-insights-row">
                    <div class="insights-card">
                        <div class="insights-card-header">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            <h2>Working Style</h2>
                        </div>
                        <div class="working-style-list">
                            <div class="working-style-item">
                                <div class="working-style-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/></svg>
                                </div>
                                <div class="working-style-info">
                                    <h4>Deep Focus Builder</h4>
                                    <p>You prefer long, uninterrupted coding sessions. Most captures happen in 2-3 hour blocks.</p>
                                </div>
                            </div>
                            <div class="working-style-item">
                                <div class="working-style-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                                </div>
                                <div class="working-style-info">
                                    <h4>Visual Thinker</h4>
                                    <p>You frequently reference diagrams and system flows. Architecture notes dominate your captures.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="insights-card">
                        <div class="insights-card-header">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            <h2>Latest Insights</h2>
                        </div>
                        <div class="insights-list">
                            <div class="insight-item">
                                <span class="insight-dot"></span>
                                <div class="insight-content">
                                    <p>React and TypeScript are your dominant skill pair — 34 captures reference them together.</p>
                                    <div class="insight-time">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        Updated 2h ago
                                    </div>
                                </div>
                            </div>
                            <div class="insight-item">
                                <span class="insight-dot"></span>
                                <div class="insight-content">
                                    <p>System Design has been your fastest growing area — 3 new notes this week.</p>
                                    <div class="insight-time">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        Updated 5h ago
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

window.ContextPage = ContextPage;
