// Service Worker (background.js)
console.log("Jumeau Service Worker initialisé - Mode Live API");

let isRecording = false;
let geminiWs = null;
let geminiSessionReady = false;
const GEMINI_LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_LIVE_ENDPOINT = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

// Gérer la création du sidepanel au clic sur l'icône de l'extension
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

// Gérer la création de l'offscreen document pour l'audio
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) return;

  if (chrome.offscreen) {
    try {
        await chrome.offscreen.createDocument({
            url: path,
            reasons: ['USER_MEDIA'],
            justification: 'Enregistrement audio pour interaction vocale IA'
        });
        console.log("Offscreen document créé avec succès.");
    } catch (e) {
        console.error("Erreur lors de la création de l'offscreen :", e);
    }
  }
}

function sendOffscreenMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (!response || response.ok !== false) {
                resolve(response);
                return;
            }

            reject(deserializeError(response.error));
        });
    });
}

function deserializeError(errorLike) {
    const error = new Error(errorLike?.message || 'Erreur inconnue');
    error.name = errorLike?.name || 'Error';

    if (errorLike?.constraint) {
        error.constraint = errorLike.constraint;
    }

    if (errorLike?.stack) {
        error.stack = errorLike.stack;
    }

    return error;
}

function formatError(error) {
    if (!error) {
        return 'Erreur inconnue';
    }

    if (typeof error === 'string') {
        return error;
    }

    const parts = [error.name, error.message].filter(Boolean);

    if (error.constraint) {
        parts.push(`constraint=${error.constraint}`);
    }

    return parts.join(': ');
}

function toUserErrorMessage(error) {
    if (!error) {
        return 'Erreur inconnue';
    }

    if (error.name === 'NotAllowedError') {
        return "Accès micro refusé ou demande fermée. Ouvre les options de l'extension puis clique sur \"Autoriser le Micro\".";
    }

    if (error.name === 'NotFoundError') {
        return "Aucun microphone disponible. Vérifie qu'un micro est connecté et activé.";
    }

    if (error.name === 'NotReadableError') {
        return "Le microphone est occupé par une autre application ou inaccessible.";
    }

    return formatError(error);
}

// Connexion WebSockets vers Gemini Multimodal Live API
async function connectToGeminiLive() {
    return new Promise((resolve, reject) => {
        let settled = false;

        // Récupérer la clé API des settings
        chrome.storage.local.get(['apiKey'], (result) => {
            const apiKey = result.apiKey;
            if (!apiKey) {
                console.error("Clé API Gemini introuvable. Veuillez la configurer dans les options.");
                chrome.runtime.openOptionsPage();
                reject(new Error("Clé API Gemini introuvable"));
                return;
            }

            const wsUrl = `${GEMINI_LIVE_ENDPOINT}?key=${apiKey}`;
            
            geminiWs = new WebSocket(wsUrl);
            geminiSessionReady = false;

            geminiWs.onopen = () => {
                console.log("Socket Gemini Live ouverte");
                
                // Envoi du message Setup initial
                const setupMessage = {
                    setup: {
                        model: GEMINI_LIVE_MODEL,
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Aoede" // Voix féminine douce
                                    }
                                }
                            }
                        }
                    }
                };
                geminiWs.send(JSON.stringify(setupMessage));
            };

            geminiWs.onmessage = (event) => {
                // Gemini peut renvoyer du binaire ou du JSON en string
                try {
                    let responseData;
                    if (event.data instanceof Blob) {
                        // Handle Blob if necessary, but usually it's a string JSON for BidiGenerateContent
                        console.log("Reçu un blob de Gemini (inattendu)");
                        return;
                    }
                    
                    responseData = JSON.parse(event.data);

                    if (responseData.setupComplete) {
                        geminiSessionReady = true;
                        console.log("Gemini Live prêt (setupComplete).");
                        if (!settled) {
                            settled = true;
                            resolve();
                        }
                        return;
                    }

                    if (responseData.goAway) {
                        console.warn("Gemini Live goAway :", responseData.goAway);
                    }

                    if (responseData.serverContent) {
                        const modelTurn = responseData.serverContent.modelTurn;
                        if (modelTurn) {
                            for (const part of modelTurn.parts) {
                                // Gérer la réception de l'audio !
                                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                                    // Envoyer au Offscreen pour lecture
                                    chrome.runtime.sendMessage({
                                        target: 'offscreen',
                                        type: 'PLAY_AUDIO',
                                        data: part.inlineData.data // Base64 PCM
                                    });
                                }
                                
                                // On pourrait aussi gérer le texte si on veut afficher des sous-titres
                                if (part.text) {
                                  console.log("Gemini dit :", part.text);
                                }
                            }
                        }
                    }

                    if (!responseData.serverContent && !responseData.usageMetadata) {
                        console.log("Message Gemini Live :", responseData);
                    }
                    
                } catch (e) {
                    console.error("Erreur lors du parsing du message de Gemini:", e);
                }
            };

            geminiWs.onerror = (error) => {
                console.log("Erreur WebSocket Gemini (peut être une erreur 400 mauvaise clé ou modèle):", error);
                // Le navigateur n'expose pas toujours le statut HTTP en cas d'erreur de handshake WS
            };

            geminiWs.onclose = (event) => {
                const msg = `Connexion Gemini Live fermée. Code: ${event.code}, Raison: ${event.reason || "Non spécifiée"}`;
                console.log(msg);
                geminiSessionReady = false;
                if (!settled) {
                    settled = true;
                    reject(new Error(msg));
                }
                stopAudioCapture();
                geminiWs = null;
            };
        });
    });
}
// Gestion des messages venant du Content Script, SidePanel, ou Offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_AUDIO') {
      if (isRecording) {
          stopAudioCapture();
          sendResponse({ isRecording: false });
      } else {
          startAudioCapture().then(() => {
              sendResponse({ isRecording: true });
          }).catch((e) => {
              console.error("Erreur lors de startAudioCapture:", e);
              if (e?.name === 'NotAllowedError') {
                  chrome.runtime.openOptionsPage().catch(() => {});
              }
              sendResponse({ isRecording: false, error: toUserErrorMessage(e) });
          });
      }
      return true; // Asynchrone
  } 
  
  else if (message.type === 'GET_AUDIO_STATE') {
      sendResponse({ isRecording: isRecording });
      return false;
  }
  
  else if (message.type === 'AUDIO_CHUNK') {
      // Les données PCM brutes arrivent ici depuis l'offscreen
      if (geminiWs && geminiSessionReady && geminiWs.readyState === WebSocket.OPEN) {
          // Formatage d'un message ClientContent pour Gemini (realtimeInput)
          const audioMessage = {
              realtimeInput: {
                  audio: {
                      mimeType: "audio/pcm;rate=16000",
                      data: message.data
                  }
              }
          };
          geminiWs.send(JSON.stringify(audioMessage));
      }
  }
  else if (message.type === 'RECORDING_STARTED') {
      console.log("Capture micro démarrée :", message.details);
  }
  else if (message.type === 'RECORDING_ERROR') {
      const error = deserializeError(message.error);
      console.error("Erreur de capture micro :", formatError(error));
      stopAudioCapture();
  }
  return false;
});

async function startAudioCapture() {
    await setupOffscreenDocument('offscreen/offscreen.html');

    try {
        await connectToGeminiLive();
        await sendOffscreenMessage({
            type: 'START_RECORDING',
            target: 'offscreen'
        });
        isRecording = true;
        broadcastPillState(true);
    } catch (error) {
        await sendOffscreenMessage({
            type: 'STOP_RECORDING',
            target: 'offscreen'
        }).catch(() => {});
        throw error;
    }
}

function stopAudioCapture() {
    isRecording = false;
    geminiSessionReady = false;
    
    // Dire à l'offscreen d'arrêter
    sendOffscreenMessage({
        type: 'STOP_RECORDING',
        target: 'offscreen'
    }).catch(() => {});
    
    // Fermer la socket
    if (geminiWs) {
        geminiWs.close();
        geminiWs = null;
    }
    
    broadcastPillState(false);
}

function broadcastPillState(isActive) {
    // Mettre à jour l'icône content script
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'UPDATE_PILL_STATE',
                isActive: isActive
            }).catch(() => {});
        }
    });
}

// ============================================================================
// OUTILS / FONCTIONS (Tools pour l'Agent)
// ============================================================================

/**
 * Capture l'écran actif, demande au content.js d'y dessiner une grille 8x8,
 * et récupère le Data URL de l'image modifiée.
 * Peut être appelé en tant que "Tool" depuis les workers AI.
 */
async function captureScreenWithGridTool() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs || tabs.length === 0) {
                reject(new Error("Aucun tab actif trouvé"));
                return;
            }
            const activeTab = tabs[0];
            
            // Prendre le screenshot de la fenêtre active
            chrome.tabs.captureVisibleTab(activeTab.windowId, {format: "jpeg", quality: 80}, function(dataUrl) {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                console.log("Screenshot pris, envoi au content script pour application de la grille...");
                
                // Demander au content script de dessiner la grille sur le canvas
                chrome.tabs.sendMessage(activeTab.id, {
                    type: 'PROCESS_IMAGE_WITH_GRID',
                    dataUrl: dataUrl
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (response && response.success) {
                        console.log("Grille appliquée avec succès au screenshot.");
                        resolve(response.dataUrl); // Retourne l'image (jpeg base64) avec la grille
                    } else {
                        reject(new Error(response ? response.error : "Erreur inconnue lors du dessin de la grille"));
                    }
                });
            });
        });
    });
}
