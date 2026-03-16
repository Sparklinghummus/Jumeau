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

    // Event listener pour muter le micro (Touche 'm' ou 'M')
    document.addEventListener('keydown', (e) => {
        // Ignorer si l'utilisateur tape dans un champ de texte
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        if (e.key === 'm' || e.key === 'M') {
            sendRuntimeMessage({ type: 'TOGGLE_MUTE' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Erreur toggle mute:", chrome.runtime.lastError);
                    return;
                }
                
                if (response && response.isMuted !== undefined) {
                    if (response.isMuted) {
                        pill.style.opacity = '';
                        pill.classList.add('muted');
                        tooltip.textContent = 'Micro Coupé (M pour réactiver)';
                    } else {
                        pill.classList.remove('muted');
                        tooltip.textContent = 'Option + Espace pour arrêter';
                    }
                }
            });
        }
    });

    let isConnecting = false;
    let isRuntimeInvalidated = false;

    function handleRuntimeInvalidation() {
        if (isRuntimeInvalidated) return;
        isConnecting = false;
        isRuntimeInvalidated = true;
        isPillActive = false;
        updatePillUI(pill, false);
        pill.title = "Extension rechargée. Recharge cette page pour réactiver Jumeau.";
        tooltip.textContent = 'Rechargez la page pour réactiver Jumeau';
        console.log("Jumeau : Contexte d'extension invalide (extension rechargée). Veuillez rafraîchir la page.");
        
        pill.style.opacity = '0.5';
        pill.style.pointerEvents = 'none';
    }

    function sendRuntimeMessage(message, callback) {
        if (isRuntimeInvalidated) {
            handleRuntimeInvalidation();
            return;
        }

        try {
            chrome.runtime.sendMessage(message, callback);
        } catch (error) {
            if (String(error?.message || error).includes('Extension context invalidated')) {
                handleRuntimeInvalidation();
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
            if (chrome.runtime.lastError) {
                if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
                    handleRuntimeInvalidation();
                } else {
                    console.error("Erreur toggle audio:", chrome.runtime.lastError.message);
                }
                isConnecting = false;
                return;
            }

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
        } else if (message.type === 'EXECUTE_CURSOR_COMMANDS') {
            executeCursorCommands(message.commands).then(() => {
                sendResponse({ success: true });
            }).catch(err => {
                sendResponse({ success: false, error: err.message });
            });
            return true;
        }
    });

    // Check initial state
    sendRuntimeMessage({ type: 'GET_AUDIO_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
                handleRuntimeInvalidation();
            } else {
                console.error("Erreur get audio state:", chrome.runtime.lastError.message);
            }
            return;
        }

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
    setScreenHaloActive(isActive);
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

// ============================================================================
// SCREEN HALO - Multicolor glow around the viewport when agent is watching
// ============================================================================
// ============================================================================
// SCREEN HALO - Multicolor glow around the viewport when agent is watching
// ============================================================================
let screenHaloWrapper = null;

function injectScreenHalo() {
    if (document.getElementById('jumeau-halo-wrapper')) {
        screenHaloWrapper = document.getElementById('jumeau-halo-wrapper');
        return;
    }

    // Inject CSS into document head (needs to be outside Shadow DOM)
    const style = document.createElement('style');
    style.id = 'jumeau-halo-styles';
    style.textContent = `
        @keyframes jumeauHaloRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes jumeauHaloPulse {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
        }

        #jumeau-halo-wrapper {
            position: fixed;
            inset: 0;
            z-index: 2147483640;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.8s ease;
            overflow: hidden;
        }

        #jumeau-halo-wrapper.active {
            opacity: 1;
            animation: jumeauHaloPulse 3s ease-in-out infinite;
        }

        .jumeau-halo-layer {
            position: absolute;
            top: -100%;
            left: -100%;
            width: 300%;
            height: 300%;
            background: conic-gradient(
                #ff0080, #ff4500, #ffd700, #00ff88, #00bfff, #a855f7, #ff0080
            );
            animation: jumeauHaloRotate 8s linear infinite;
            transform-origin: center center;
        }

        .jumeau-halo-frame {
            position: absolute;
            inset: 0;
            pointer-events: none;
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            padding: 5px;
            background: inherit;
        }

        .jumeau-halo-glow {
            position: absolute;
            inset: -15px;
            padding: 20px;
            filter: blur(15px);
            opacity: 0.7;
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            background: inherit;
        }
    `;
    document.head.appendChild(style);

    // Create halo wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'jumeau-halo-wrapper';

    // The halo works by having two layers (border and glow) that "inherit" the background 
    // from a common rotating background layer.
    wrapper.innerHTML = `
        <div class="jumeau-halo-inner" style="position: absolute; inset: 0; pointer-events: none;">
            <div class="jumeau-halo-frame" style="position: absolute; inset: 0; background: conic-gradient(#ff0080, #ff4500, #ffd700, #00ff88, #00bfff, #a855f7, #ff0080); animation: jumeauHaloRotate 8s linear infinite; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; padding: 5px;"></div>
            <div class="jumeau-halo-glow" style="position: absolute; inset: -15px; background: conic-gradient(#ff0080, #ff4500, #ffd700, #00ff88, #00bfff, #a855f7, #ff0080); animation: jumeauHaloRotate 8s linear infinite; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; padding: 20px; filter: blur(15px); opacity: 0.7;"></div>
        </div>
    `;

    document.body.appendChild(wrapper);
    screenHaloWrapper = wrapper;
}

function setScreenHaloActive(isActive) {
    if (!screenHaloWrapper) injectScreenHalo();
    if (!screenHaloWrapper) return;
    
    if (isActive) {
        screenHaloWrapper.classList.add('active');
    } else {
        screenHaloWrapper.classList.remove('active');
    }
}

// Lancer l'injection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPill);
} else {
    injectPill();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectScreenHalo);
} else {
    injectScreenHalo();
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
                
                // Réduire la résolution pour limiter la taille du payload (max 1024px de large)
                const MAX_WIDTH = 1024;
                let targetWidth = img.width;
                let targetHeight = img.height;
                if (targetWidth > MAX_WIDTH) {
                    const scale = MAX_WIDTH / targetWidth;
                    targetWidth = MAX_WIDTH;
                    targetHeight = Math.round(img.height * scale);
                }
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Dessiner l'image originale (redimensionnée)
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                // Configuration de la grille 8x8
                const rows = 8;
                const cols = 8;
                const cellWidth = canvas.width / cols;
                const cellHeight = canvas.height / rows;
                
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Rouge vif
                ctx.lineWidth = 1;
                
                // Taille de police proportionnelle à la hauteur de la cellule
                const fontSize = Math.max(10, Math.floor(cellHeight / 5));
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
                        const padding = 4;
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
                
                // Qualité réduite pour un payload léger (~30-80KB au lieu de 300-600KB)
                const finalDataUrl = canvas.toDataURL('image/jpeg', 0.5);
                
                console.log("Image traitée avec grille spatiale, taille:", Math.round(finalDataUrl.length / 1024), "KB");
                
                resolve(finalDataUrl);
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image dans le canvas"));
        img.src = base64Image;
    });
}

// ============================================================================
// LOGIQUE DU CURSEUR VIRTUEL
// ============================================================================
let virtualCursor = null;

function getOrCreateCursor() {
    if (!virtualCursor) {
        virtualCursor = document.createElement('div');
        virtualCursor.id = 'jumeau-virtual-cursor';
        virtualCursor.innerHTML = `<svg width="32" height="32" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.2188 13.5547C9.31555 11.4472 11.4472 9.31555 13.5547 10.2188L116.459 54.3213C118.769 55.3112 118.392 58.6957 115.921 59.1533L72.4443 67.2051C69.7814 67.6983 67.6983 69.7814 67.2051 72.4443L59.1533 115.921C58.6957 118.392 55.3112 118.769 54.3213 116.459L10.2188 13.5547Z" fill="#469AF9" stroke="white" stroke-width="4"/>
</svg>`;
        virtualCursor.style.position = 'fixed';
        virtualCursor.style.top = '0px';
        virtualCursor.style.left = '0px';
        virtualCursor.style.zIndex = '2147483647';
        virtualCursor.style.pointerEvents = 'none';
        virtualCursor.style.transition = 'top 0.4s cubic-bezier(0.25, 1, 0.5, 1), left 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        virtualCursor.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))';
        virtualCursor.style.width = '32px';
        virtualCursor.style.height = '32px';
        virtualCursor.style.lineHeight = '0';
        document.body.appendChild(virtualCursor);
    }
    return virtualCursor;
}

function getCellCoordinates(cellId) {
    if (!cellId || cellId.length < 2) return null;
    
    cellId = cellId.toUpperCase();
    const colStr = cellId.charAt(0);
    const rowStr = cellId.substring(1);
    
    // A=0, B=1, ... H=7
    const colIndex = colStr.charCodeAt(0) - 65; 
    const rowIndex = parseInt(rowStr) - 1;
    
    if (colIndex < 0 || colIndex > 7 || isNaN(rowIndex) || rowIndex < 0 || rowIndex > 7) {
        return null;
    }
    
    const cellWidth = window.innerWidth / 8;
    const cellHeight = window.innerHeight / 8;
    
    const centerX = (colIndex * cellWidth) + (cellWidth / 2);
    const centerY = (rowIndex * cellHeight) + (cellHeight / 2);
    
    return { x: centerX, y: centerY };
}

async function executeCursorCommands(commands) {
    if (!commands || !commands.length) return;
    
    const cursor = getOrCreateCursor();
    
    for (const cmdObj of commands) {
        const cmdStr = cmdObj.command;
        console.log("Exécution commande curseur:", cmdStr, "Raison:", cmdObj.reason);
        
        if (cmdStr.startsWith("cursor move_to ")) {
            const cellId = cmdStr.split(" ")[2];
            if (!cellId) continue;
            
            const coords = getCellCoordinates(cellId);
            if (coords) {
                cursor.style.left = `${coords.x}px`;
                cursor.style.top = `${coords.y}px`;
                // Attendre la fin de l'animation
                await new Promise(r => setTimeout(r, 450));
            }
        }
    }
}
