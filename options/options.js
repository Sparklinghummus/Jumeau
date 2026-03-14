document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const micBtn = document.getElementById('micBtn');
    const statusEl = document.getElementById('status');

    // Load existing key if there is one
    chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
    });

    saveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        
        chrome.storage.local.set({ apiKey: key }, () => {
            // Show status
            statusEl.classList.add('visible');
            setTimeout(() => {
                statusEl.classList.remove('visible');
            }, 2000);
        });
    });

    micBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            micBtn.textContent = 'Micro Autorisé ✓';
            micBtn.style.backgroundColor = '#10b981';
            micBtn.style.color = 'white';
            setStatus('Accès micro autorisé.', '#10b981');
        } catch (err) {
            console.error('Erreur accès micro:', err);
            micBtn.textContent = 'Erreur Micro ❌';
            micBtn.style.backgroundColor = '#ef4444';
            micBtn.style.color = 'white';
            setStatus(getMicrophoneErrorMessage(err), '#ef4444');
        }
    });

    // Also save on Enter press
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });

    function setStatus(message, color) {
        statusEl.textContent = message;
        statusEl.style.color = color;
        statusEl.classList.add('visible');
    }

    function getMicrophoneErrorMessage(error) {
        switch (error?.name) {
            case 'NotAllowedError':
                return "Accès micro refusé ou demande fermée. Réessaie et valide la demande Chrome.";
            case 'NotFoundError':
                return "Aucun microphone détecté.";
            case 'NotReadableError':
                return "Le microphone est déjà utilisé par une autre application.";
            default:
                return error?.message || 'Erreur micro inconnue.';
        }
    }
});
