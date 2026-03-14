// sidepanel.js - MVP Logic

document.addEventListener('DOMContentLoaded', () => {
    const statusIndicator = document.getElementById('ai-status');
    const nodesContainer = document.getElementById('nodes-container');
    const emptyMsg = document.getElementById('empty-msg');
    const exportBtn = document.getElementById('exportBtn');

    let nodes = [];

    // Écouter les messages du background worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.target !== 'sidepanel') return;

        console.log("Sidepanel a reçu :", message);

        if (message.type === 'STATUS_UPDATE') {
            updateStatus(message.status);
        } else if (message.type === 'ADD_NODE') {
            addNode(message.node);
        }
    });

    function updateStatus(status) {
        statusIndicator.className = `status-indicator ${status}`;
        
        let statusText = 'Prêt';
        switch (status) {
            case 'listening': statusText = 'En écoute...'; break;
            case 'thinking': statusText = 'IA réfléchit...'; break;
            case 'ready': statusText = 'Prêt'; break;
        }
        
        statusIndicator.innerHTML = `<span class="dot"></span> ${statusText}`;
    }

    function addNode(nodeData) {
        // Cacher le message vide
        if (emptyMsg) emptyMsg.style.display = 'none';

        nodes.push(nodeData);

        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.innerHTML = `
            <div class="node-title">${nodeData.title}</div>
            <p class="node-desc">${nodeData.description}</p>
        `;
        
        nodesContainer.appendChild(nodeEl);
        
        // Auto-scroll en bas
        nodesContainer.scrollTop = nodesContainer.scrollHeight;

        // Activer le bouton export
        exportBtn.disabled = false;
    }

    exportBtn.addEventListener('click', () => {
        alert("MVP: Export du Blueprint (Logique non implémentée pour l'upload réel).");
        // Ici on appellera la logique "Translator" vers Claude/Gemini
    });
});
