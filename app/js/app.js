/**
 * Main application entry point
 */
const pages = {
    'home': window.HomePage,
    'context': window.ContextPage,
    'workflows': window.WorkflowsPage,
    'skills': window.SkillsPage,
    'skill-builder': window.SkillBuilderPage,
    'notes': window.NotesPage
};

document.addEventListener('DOMContentLoaded', () => {
    const mainElement = document.getElementById('main-content');
    
    // Initialize global app object
    window.app = {
        router: new Router(pages, mainElement)
    };
    
    console.log('Jumo App Initialized');

    // Extension Bridge: Connect to recording logic
    const recordBtn = document.querySelector('.context-card-btn');
    
    if (recordBtn && typeof chrome !== 'undefined' && chrome.runtime) {
        // Toggle recording on click
        recordBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'TOGGLE_AUDIO' }, (response) => {
                if (response) updateRecordUI(response.isRecording);
            });
        });

        // Listen for recording state updates from background/other pages
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'UPDATE_PILL_STATE') {
                updateRecordUI(message.isActive);
            }
        });

        // Check initial state
        chrome.runtime.sendMessage({ type: 'GET_AUDIO_STATE' }, (response) => {
            if (response) updateRecordUI(response.isRecording);
        });

        // Settings link
        const settingsBtn = document.getElementById('nav-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.openOptionsPage();
            });
        }

        // Invite link (placeholder)
        const inviteBtn = document.getElementById('nav-invite');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Invite team: This feature will be available in the next Pro update!");
            });
        }
    }

    function updateRecordUI(isRecording) {
        if (isRecording) {
            recordBtn.textContent = 'Stop recording';
            recordBtn.classList.add('recording');
        } else {
            recordBtn.textContent = 'Start recording';
            recordBtn.classList.remove('recording');
        }
    }
});
