document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const orchestratorUrlInput = document.getElementById('orchestratorUrl');
    const mcpDeployerUrlInput = document.getElementById('mcpDeployerUrl');
    const saveBtn = document.getElementById('saveBtn');
    const micBtn = document.getElementById('micBtn');
    const saveHint = document.getElementById('saveHint');
    const statusToast = document.getElementById('statusToast');
    const badge1 = document.getElementById('badge-1');
    const badge2 = document.getElementById('badge-2');

    let hasConnectionConfig = false;
    let hasMicAccess = false;

    function showToast(message, isError = false) {
        statusToast.textContent = message;
        statusToast.style.background = isError ? '#ef4444' : '#111111';
        statusToast.classList.add('visible');
        setTimeout(() => statusToast.classList.remove('visible'), 2500);
    }

    function setConnectionDone(done) {
        hasConnectionConfig = done;
        badge1.classList.toggle('done', done);
        badge1.textContent = done ? '✓' : '1';
        updateSaveButton();
    }

    function setMicDone(done) {
        hasMicAccess = done;
        badge2.classList.toggle('done', done);
        badge2.textContent = done ? '✓' : '2';

        if (done) {
            micBtn.classList.add('granted');
            micBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <path d="M20 6 9 17l-5-5"/>
                </svg>
                Microphone authorized
            `;
        } else {
            micBtn.classList.remove('granted');
            micBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                Authorize microphone
            `;
        }

        updateSaveButton();
    }

    function updateConnectionState() {
        const hasApiKey = apiKeyInput.value.trim().length > 10;
        const hasOrchestratorUrl = orchestratorUrlInput.value.trim().length > 0;
        setConnectionDone(hasApiKey || hasOrchestratorUrl);
    }

    function updateSaveButton() {
        const ready = hasConnectionConfig && hasMicAccess;
        saveBtn.disabled = !ready;
        saveHint.textContent = ready
            ? 'All set — save to continue'
            : 'Provide an API key or Orchestrator URL, then authorize the microphone';
    }

    async function syncMicPermissionState() {
        if (!navigator.permissions?.query) {
            return;
        }

        try {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            setMicDone(permission.state === 'granted');
            permission.onchange = () => {
                setMicDone(permission.state === 'granted');
            };
        } catch (_) {
            // Some Chromium builds do not expose microphone permission queries here.
        }
    }

    function getMicrophoneErrorMessage(error) {
        switch (error?.name) {
            case 'NotAllowedError':
                return 'Microphone access denied. Please allow it in Chrome settings.';
            case 'NotFoundError':
                return 'No microphone detected.';
            case 'NotReadableError':
                return 'Microphone is already in use by another app.';
            default:
                return error?.message || 'Unknown microphone error.';
        }
    }

    chrome.storage.local.get(['apiKey', 'orchestratorUrl', 'mcpDeployerUrl'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }

        if (result.orchestratorUrl) {
            orchestratorUrlInput.value = result.orchestratorUrl;
        }

        if (result.mcpDeployerUrl) {
            mcpDeployerUrlInput.value = result.mcpDeployerUrl;
        }

        updateConnectionState();
    });

    apiKeyInput.addEventListener('input', updateConnectionState);
    orchestratorUrlInput.addEventListener('input', updateConnectionState);

    [apiKeyInput, orchestratorUrlInput, mcpDeployerUrlInput].forEach((input) => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !saveBtn.disabled) {
                saveBtn.click();
            }
        });
    });

    micBtn.addEventListener('click', async () => {
        if (hasMicAccess) {
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            setMicDone(true);
        } catch (error) {
            console.error('Mic access error:', error);
            showToast(getMicrophoneErrorMessage(error), true);
        }
    });

    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const orchestratorUrl = orchestratorUrlInput.value.trim();
        const mcpDeployerUrl = mcpDeployerUrlInput.value.trim();

        chrome.storage.local.set(
            {
                apiKey,
                orchestratorUrl,
                mcpDeployerUrl
            },
            () => {
                showToast('Setup saved successfully');
            }
        );
    });

    syncMicPermissionState();
});
