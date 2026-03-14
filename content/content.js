// Content script injecté sur la page
console.log("Jumeau Content Script chargé - Mode MVP avec Liquid Glass Pill");

let isPillActive = false;
let currentHighlight = null;

function injectPill() {
    // Éviter l'injection multiple
    if (document.getElementById('jumeau-extension-root')) return;

    // Créer la pilule UI avec Shadow DOM pour isoler le CSS
    const pillHost = document.createElement('div');
    pillHost.id = 'jumeau-extension-root';
    document.body.appendChild(pillHost);

    const shadow = pillHost.attachShadow({ mode: 'open' });
    
    // Ajouter les styles
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', chrome.runtime.getURL('content/content.css'));
    shadow.appendChild(linkElem);

    const pillContainer = document.createElement('div');
    pillContainer.className = 'jumeau-container';

    const pill = document.createElement('div');
    pill.className = 'jumeau-pill';
    pill.innerHTML = `
        <div class="voice-bars">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
        </div>
    `;
    
    // Tooltip / Hint du raccourci
    const tooltip = document.createElement('div');
    tooltip.className = 'jumeau-tooltip';
    tooltip.textContent = 'Option + Espace pour parler';

    pillContainer.appendChild(pill);
    pillContainer.appendChild(tooltip);
    shadow.appendChild(pillContainer);

    // Event listener pour la pilule (Click)
    pill.addEventListener('click', toggleAudio);

    // Event listener pour le raccourci global (Option + Space)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'Space') {
            e.preventDefault(); // Évite le scroll
            toggleAudio();
        }
    });

    let isConnecting = false;
    let isRuntimeInvalidated = false;

    function handleRuntimeInvalidation(error) {
        isConnecting = false;
        isRuntimeInvalidated = true;
        isPillActive = false;
        updatePillUI(pill, false);
        pill.title = "Extension rechargée. Recharge cette page pour réactiver Jumeau.";
        tooltip.textContent = 'Rechargez la page pour réactiver Jumeau';
        console.error("Contexte d'extension invalide :", error);
    }

    function sendRuntimeMessage(message, callback) {
        if (isRuntimeInvalidated) {
            handleRuntimeInvalidation(new Error('Extension context invalidated'));
            return;
        }

        try {
            chrome.runtime.sendMessage(message, callback);
        } catch (error) {
            if (String(error?.message || error).includes('Extension context invalidated')) {
                handleRuntimeInvalidation(error);
                return;
            }

            throw error;
        }
    }

    function toggleAudio() {
        if (isConnecting || isRuntimeInvalidated) return;
        isConnecting = true;
        console.log("Demande de toggle audio...");
        sendRuntimeMessage({ type: 'TOGGLE_AUDIO' }, (response) => {
            isConnecting = false;
            if (response && typeof response.isRecording !== 'undefined') {
                isPillActive = response.isRecording;
                updatePillUI(pill, isPillActive);

                if (!response.isRecording && response.error) {
                    console.error("Impossible de démarrer l'audio :", response.error);
                    pill.title = response.error;
                } else {
                    pill.title = '';
                }
            }
        });
    }

    // Écouter les messages du Background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'HIGHLIGHT_ELEMENT' && message.selector) {
            drawHighlight(message.selector);
        } else if (message.type === 'UPDATE_PILL_STATE') {
            isPillActive = message.isActive;
            updatePillUI(pill, isPillActive);
        } else if (message.type === 'PROCESS_IMAGE_WITH_GRID') {
            processImageWithGrid(message.dataUrl).then(processedDataUrl => {
                sendResponse({ success: true, dataUrl: processedDataUrl });
            }).catch(err => {
                sendResponse({ success: false, error: err.message });
            });
            return true; // Asynchrone
        }
    });

    // Check initial state
    sendRuntimeMessage({ type: 'GET_AUDIO_STATE' }, (response) => {
        if (response && typeof response.isRecording !== 'undefined') {
            isPillActive = response.isRecording;
            updatePillUI(pill, isPillActive);
        }
    });
}

function updatePillUI(pillElement, isActive) {
    if (isActive) {
        pillElement.classList.add('active');
    } else {
        pillElement.classList.remove('active');
    }
}

// Fonction MVP: Dessiner un rectangle de surbrillance "Ink Layer"
function drawHighlight(selector) {
    if (currentHighlight) {
        currentHighlight.remove();
        currentHighlight = null;
    }

    try {
        const targetElement = document.querySelector(selector);
        if (!targetElement) return;

        const rect = targetElement.getBoundingClientRect();
        const highlight = document.createElement('div');
        
        highlight.id = 'jumeau-ink-highlight';
        highlight.style.position = 'fixed';
        highlight.style.top = `${rect.top}px`;
        highlight.style.left = `${rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.border = '4px solid #10b981';
        highlight.style.borderRadius = '8px';
        highlight.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.6)';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = '2147483646';
        highlight.style.transition = 'all 0.3s ease-out';

        document.body.appendChild(highlight);
        currentHighlight = highlight;

        setTimeout(() => {
            if (currentHighlight === highlight) {
                highlight.style.opacity = '0';
                setTimeout(() => highlight.remove(), 300);
            }
        }, 5000);

    } catch (e) {
        console.error("Erreur création highlight", e);
    }
}

// Lancer l'injection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPill);
} else {
    injectPill();
}

// ============================================================================
// LOGIQUE DE TRAITEMENT D'IMAGE AVEC GRILLE (OUTIL / FONCTION)
// ============================================================================
async function processImageWithGrid(base64Image) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Dimensionner le canvas à la taille de l'image
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Dessiner l'image originale
                ctx.drawImage(img, 0, 0);
                
                // Configuration de la grille 8x8
                const rows = 8;
                const cols = 8;
                const cellWidth = canvas.width / cols;
                const cellHeight = canvas.height / rows;
                
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Rouge vif
                ctx.lineWidth = 2;
                
                // Taille de police proportionnelle à la hauteur de la cellule
                const fontSize = Math.max(14, Math.floor(cellHeight / 5));
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const colsLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                
                // Dessiner les lignes et étiquettes
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        const x = j * cellWidth;
                        const y = i * cellHeight;
                        
                        // Dessiner la bordure de la cellule
                        ctx.strokeRect(x, y, cellWidth, cellHeight);
                        
                        // Étiquette (ex: A1, B2)
                        const label = colsLabels[j] + (i + 1);
                        
                        // Fond semi-transparent pour la lisibilité
                        const textWidth = ctx.measureText(label).width;
                        const padding = 6;
                        const bgWidth = textWidth + padding * 2;
                        const bgHeight = fontSize + padding * 2;
                        
                        const centerX = x + cellWidth / 2;
                        const centerY = y + cellHeight / 2;
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Fond blanc lisible
                        ctx.beginPath();
                        ctx.roundRect(centerX - bgWidth/2, centerY - bgHeight/2, bgWidth, bgHeight, 4);
                        ctx.fill();
                        
                        // Dessiner le texte
                        ctx.fillStyle = '#ef4444'; // Texte rouge
                        ctx.fillText(label, centerX, centerY);
                    }
                }
                
                const finalDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // Log de l'image modifiée dans la console 
                console.log('%c++++++++++++ GRILLE SPATIALE 8x8 ++++++++++++', 'color: #ef4444; font-weight: bold; font-size: 16px;');
                console.log('%c ', `font-size: 400px; background: url(${finalDataUrl}) no-repeat; background-size: contain; padding: 200px 400px;`);
                console.log("Image de l'UI traitée avec grille spatiale. Prête pour l'IA.");
                
                resolve(finalDataUrl);
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image dans le canvas"));
        img.src = base64Image;
    });
}
