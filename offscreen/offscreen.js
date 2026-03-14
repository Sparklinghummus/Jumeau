// Logique offscreen pour la capture audio vers Gemini Live
// L'API attend du PCM 16-bit, 16kHz, mono.

const TARGET_SAMPLE_RATE = 16000;
const PLAYBACK_SAMPLE_RATE = 24000;

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let workletNode = null;
let silentGainNode = null;

let isMuted = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    if (message.type === 'START_RECORDING') {
        startRecording()
            .then((details) => sendResponse({ ok: true, details }))
            .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));
        return true;
    } else if (message.type === 'STOP_RECORDING') {
        stopPlaybackAndRecording();
        sendResponse({ ok: true });
    } else if (message.type === 'TOGGLE_MUTE') {
        isMuted = !isMuted;
        console.log("Microphone muted state:", isMuted);
        sendResponse({ ok: true, isMuted: isMuted });
    } else if (message.type === 'PLAY_AUDIO') {
        // message.data contains base64 PCM16 data from Gemini
        playAudioData(message.data);
        sendResponse({ ok: true });
    }
});

async function startRecording() {
    try {
        stopPlaybackAndRecording();

        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: { ideal: 1 }
            } 
        });
        
        mediaStream = stream;
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        await audioContext.audioWorklet.addModule(chrome.runtime.getURL('offscreen/audio-processor.js'));

        sourceNode = audioContext.createMediaStreamSource(stream);
        workletNode = new AudioWorkletNode(audioContext, 'jumeau-capture-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 1,
            outputChannelCount: [1]
        });
        silentGainNode = audioContext.createGain();
        silentGainNode.gain.value = 0;

        workletNode.port.onmessage = (event) => {
            if (isMuted) return; // Mute state: on n'envoie pas le chunk

            const float32Array = event.data;
            const downsampled = downsampleBuffer(float32Array, audioContext.sampleRate, TARGET_SAMPLE_RATE);
            
            // Convertir Float32 (-1.0 à 1.0) en Int16 (-32768 à 32767)
            const pcm16 = floatTo16BitPCM(downsampled);
            
            // Convertir Int16Array en Base64
            const base64Audio = arrayBufferToBase64(pcm16.buffer);
            
            // Envoyer au background
            chrome.runtime.sendMessage({
                type: 'AUDIO_CHUNK',
                data: base64Audio
            });
        };

        sourceNode.connect(workletNode);
        workletNode.connect(silentGainNode);
        silentGainNode.connect(audioContext.destination);

        const details = {
            inputSampleRate: audioContext.sampleRate,
            outputSampleRate: TARGET_SAMPLE_RATE
        };

        chrome.runtime.sendMessage({ type: 'RECORDING_STARTED', details });
        console.log("Capture audio PCM activée.", details);
        return details;

    } catch (e) {
        const error = serializeError(e);
        console.error("Erreur d'accès au micro :", formatSerializedError(error));
        chrome.runtime.sendMessage({ type: 'RECORDING_ERROR', error });
        throw e;
    }
}

let nextPlayTime = 0; // Ajout d'une variable pour gérer la file d'attente audio

function stopPlaybackAndRecording() {
    if (workletNode) {
        workletNode.port.onmessage = null;
        workletNode.disconnect();
        workletNode = null;
    }
    if (silentGainNode) {
        silentGainNode.disconnect();
        silentGainNode = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
    }
    audioContext = null;
    nextPlayTime = 0; // Réinitialiser le temps de lecture
    console.log("Capture audio PCM arrêtée.");
}

// Fonction pour jouer l'audio retourné par Gemini
async function playAudioData(base64PcmString) {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        nextPlayTime = audioContext.currentTime;
    }

    // Décoder Base64 vers ArrayBuffer
    const binaryString = window.atob(base64PcmString);
    const len = binaryString.length;
    const pcmBuffer = new ArrayBuffer(len);
    const pcmView = new Uint8Array(pcmBuffer);
    for (let i = 0; i < len; i++) {
        pcmView[i] = binaryString.charCodeAt(i);
    }
    
    // Convertir Int16 en Float32 pour l'AudioContext
    const int16View = new Int16Array(pcmBuffer);
    const float32Array = new Float32Array(int16View.length);
    for (let i = 0; i < int16View.length; i++) {
        float32Array[i] = int16View[i] / 32768; // Normalisation
    }

    // Créer un buffer audio pour la lecture
    const audioBufferParams = audioContext.createBuffer(1, float32Array.length, PLAYBACK_SAMPLE_RATE);
    audioBufferParams.getChannelData(0).set(float32Array);

    const source = audioContext.createBufferSource();
    source.buffer = audioBufferParams;
    source.connect(audioContext.destination);
    
    // Reprendre le contexte si suspendu (sécurité navigateur)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
        nextPlayTime = Math.max(nextPlayTime, audioContext.currentTime);
    }
    
    // --- GESTION DE LA FILE D'ATTENTE (Éviter le son haché) ---
    // Si la file d'attente est vide ou en retard, on se laisse une marge
    // un peu plus grande (ex: 100ms) pour absorber les micro-coupures réseau
    if (nextPlayTime < audioContext.currentTime + 0.1) {
        nextPlayTime = audioContext.currentTime + 0.1;
    }
    
    source.start(nextPlayTime);
    nextPlayTime += audioBufferParams.duration;
}


// --- Utilitaires ---

function floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
}

function downsampleBuffer(buffer, inputSampleRate, targetSampleRate) {
    if (inputSampleRate === targetSampleRate) {
        return buffer;
    }

    if (inputSampleRate < targetSampleRate) {
        throw new Error(`Impossible de convertir ${inputSampleRate}Hz vers ${targetSampleRate}Hz.`);
    }

    const sampleRateRatio = inputSampleRate / targetSampleRate;
    const outputLength = Math.round(buffer.length / sampleRateRatio);
    const output = new Float32Array(outputLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < outputLength) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        let accum = 0;
        let count = 0;

        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count += 1;
        }

        output[offsetResult] = count > 0 ? accum / count : 0;
        offsetResult += 1;
        offsetBuffer = nextOffsetBuffer;
    }

    return output;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    // Par batch pour éviter un stack overflow si très gros buffer
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function serializeError(error) {
    if (!error) {
        return { name: 'Error', message: 'Erreur inconnue' };
    }

    return {
        name: error.name || 'Error',
        message: error.message || String(error),
        constraint: error.constraint || null,
        stack: error.stack || null
    };
}

function formatSerializedError(error) {
    const parts = [error?.name, error?.message].filter(Boolean);

    if (error?.constraint) {
        parts.push(`constraint=${error.constraint}`);
    }

    return parts.join(': ') || 'Erreur inconnue';
}
