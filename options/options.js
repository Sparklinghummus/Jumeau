document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const micBtn = document.getElementById('micBtn');
    const saveHint = document.getElementById('saveHint');
    const statusToast = document.getElementById('statusToast');
    const badge1 = document.getElementById('badge-1');
    const badge2 = document.getElementById('badge-2');

    let hasApiKey = false;
    let hasMicAccess = false;

    // Load existing key
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
            setApiKeyDone(true);
        }
    });

    function setApiKeyDone(done) {
        hasApiKey = done;
        badge1.classList.toggle('done', done);
        updateSaveButton();
    }

    function setMicDone(done) {
        hasMicAccess = done;
        badge2.classList.toggle('done', done);
        if (done) {
            micBtn.classList.add('granted');
            micBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <path d="M20 6 9 17l-5-5"/>
                </svg>
                Microphone authorized
            `;
        }
        updateSaveButton();
    }

    function updateSaveButton() {
        const ready = hasApiKey && hasMicAccess;
        saveBtn.disabled = !ready;
        saveHint.textContent = ready
            ? 'All set — save to continue'
            : 'Complete the steps above to continue';
    }

    apiKeyInput.addEventListener('input', () => {
        setApiKeyDone(apiKeyInput.value.trim().length > 10);
    });

    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveBtn.click();
    });

    micBtn.addEventListener('click', async () => {
        if (hasMicAccess) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setMicDone(true);
        } catch (err) {
            console.error('Mic access error:', err);
            showToast(getMicrophoneErrorMessage(err), true);
        }
    });

    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        chrome.storage.local.set({ apiKey: key }, () => {
            showToast('Setup saved successfully');
        });
    });

    function showToast(message, isError = false) {
        statusToast.textContent = message;
        statusToast.style.background = isError ? '#ef4444' : '#111111';
        statusToast.classList.add('visible');
        setTimeout(() => statusToast.classList.remove('visible'), 2500);
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
});
