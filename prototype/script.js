document.addEventListener('DOMContentLoaded', () => {
    
    // --- Data for Workflow Streaming ---
    const workflowSteps = [
        {
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
            title: "Gathering context",
            desc: "Scanning screen content for CRM entries and active tabs."
        },
        {
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
            title: "Analyzing 'John Doe' profile",
            desc: "Identified Email and Phone number fields visually."
        },
        {
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
            title: "Building Workflow: Export to Notion",
            desc: "Waiting for user clarification on field inclusions.",
            highlight: true
        },
        {
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
            title: "Read voice transcript",
            desc: "User confirmed adding phone number."
        },
        {
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
            title: "Generating 'Notion Payload Blueprint'",
            desc: "Drafting schema mapping."
        }
    ];

    const logContainer = document.getElementById('workflow-log');
    const aiCursor = document.getElementById('ai-cursor');
    const targetElement = document.getElementById('target-element');
    const highlightBox = document.getElementById('highlight-box');
    const codePreview = document.getElementById('code-preview');
    const pillDefault = document.getElementById('pill-default');
    const subPillDefault = document.getElementById('sub-pill-default');
    const pillRecording = document.getElementById('pill-recording');
    const btnCloseRecord = document.getElementById('btn-close-record');
    const btnStopRecord = document.getElementById('btn-stop-record');

    // --- Sequence Orchestration ---
    async function runDemoSequence() {
        // 1. Initial wait
        await delay(1000);

        // 2. Stream first two workflow steps
        await addLogStep(workflowSteps[0]);
        await delay(1200);
        await addLogStep(workflowSteps[1]);
        
        // 3. Highlight the element the AI is "looking" at
        highlightBox.classList.add('active');
        await delay(800);

        // 4. Move Cursor to point at it
        moveCursorToTarget(targetElement);
        await delay(1500);

        // 5. Ask the question via workflow sidebar
        await addLogStep(workflowSteps[2]);
        await delay(2000);

        // 6. Simulate user speaking back to the Voice Pill (Switch to recording state)
        pillDefault.classList.add('hidden');
        subPillDefault.classList.add('hidden');
        pillRecording.classList.remove('hidden');
        
        // Wait for "recording" to happen visually
        await addLogStep(workflowSteps[3]);
        await delay(3000);

        // Switch back to default state
        pillRecording.classList.add('hidden');
        pillDefault.classList.remove('hidden');
        subPillDefault.classList.remove('hidden');

        // 7. Finalize generation
        await addLogStep(workflowSteps[4]);
        await delay(1000);
        codePreview.classList.remove('hidden');
        
        // Hide cursor/highlight as AI is done "pointing"
        aiCursor.classList.add('hidden');
        highlightBox.classList.remove('active');
    }

    // --- Helper Functions ---

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function addLogStep(stepData) {
        const stepEl = document.createElement('div');
        stepEl.className = \`step-item \${stepData.highlight ? 'generation' : ''}\`;
        
        stepEl.innerHTML = \`
            <div class="step-icon">\${stepData.icon}</div>
            <div class="step-content">
                <div class="step-title">\${stepData.title}</div>
                <div class="step-desc">\${stepData.desc}</div>
            </div>
        \`;
        
        logContainer.appendChild(stepEl);
        
        // Trigger reflow for animation
        void stepEl.offsetWidth;
        stepEl.classList.add('show');
        
        // Scroll to bottom
        logContainer.scrollTo({ top: logContainer.scrollHeight, behavior: 'smooth' });
    }

    function moveCursorToTarget(element) {
        // Remove hidden class
        aiCursor.classList.remove('hidden');
        
        // Calculate position relative to container
        const rect = element.getBoundingClientRect();
        
        // Offset cursor translation (e.g. bottom right of target)
        const targetX = rect.left + rect.width + 10;
        const targetY = rect.bottom - 10;
        
        aiCursor.style.transform = \`translate(\${targetX}px, \${targetY}px)\`;
    }

    // Event listeners for pill buttons (interactive part)
    pillDefault.addEventListener('click', () => {
        pillDefault.classList.add('hidden');
        subPillDefault.classList.add('hidden');
        pillRecording.classList.remove('hidden');
    });

    btnCloseRecord.addEventListener('click', () => {
        pillRecording.classList.add('hidden');
        pillDefault.classList.remove('hidden');
        subPillDefault.classList.remove('hidden');
    });

    btnStopRecord.addEventListener('click', () => {
        pillRecording.classList.add('hidden');
        pillDefault.classList.remove('hidden');
        subPillDefault.classList.remove('hidden');
    });

    // Start Demo
    runDemoSequence();
});
