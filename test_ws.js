const WebSocket = require('ws');
const apiKey = "DUMMY";
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
const ws = new WebSocket(url);
ws.on('open', () => {
    console.log('OPEN');
    ws.send(JSON.stringify({
        setup: {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
                responseModalities: ["AUDIO"],
            }
        }
    }));
});
ws.on('error', e => console.error('ERROR', e.message));
ws.on('close', (code, reason) => console.log('CLOSE', code, reason.toString()));
ws.on('message', data => console.log('MESSAGE', data.toString()));
