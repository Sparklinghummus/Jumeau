# Spécification Technique : Extension Chrome "Jumeau" (Manifest V3 - 2026)

## 1. Vue d'ensemble du projet
Cette extension Chrome offre une interaction vocale et visuelle continue avec un assistant IA (Gemini 2.5 Live). Elle injecte un élément d'interface discret (une "pilule") sur les pages web visitées, permettant à l'utilisateur de communiquer vocalement avec l'IA tout en lui partageant le contexte visuel (capture d'écran ou flux vidéo) en temps réel.

## 2. Architecture de l'Extension (Manifest V3)
L'architecture repose sur les standards de sécurité et de performance de Chrome Extensions Manifest V3 (implémentation 2026), interdisant l'exécution de code distant et imposant l'utilisation des Service Workers pour les tâches de fond.

### Composants principaux :
1.  **Service Worker (`background.js`)** : Le cœur logique de l'extension. Gère la connexion WebSocket/WebRTC avec l'API Gemini 2.5 Live, coordonne les flux audio/vidéo et gère l'état global.
2.  **Content Scripts (`content.js`, `content.css`)** : Injectés dans chaque onglet. Gèrent l'interface utilisateur (la "pilule" audio) et la capture du DOM/écran local à l'onglet en cours.
3.  **Page d'Options / Popup (`index.html` & `settings.js`)** : Interface de configuration de l'extension.
4.  **Offscreen Document (`offscreen.html`)** : *(Nécessaire en MV3 2026 pour le traitement audio continu ou l'enregistrement d'écran prolongé, le Service Worker n'ayant pas accès aux APIs DOM complètes comme `MediaRecorder` ou l'accès au microphone persistant sans interface).*

## 3. Détail des Composants

### 3.1. Content Script (`content.js`)
*   **Injection de la "Pilule" UI** :
    *   Crée un élément DOM isolé (via Shadow DOM pour éviter les conflits CSS avec la page hôte).
    *   Positionné en mode `fixed` en bas au centre ou sur le côté de l'écran.
    *   États visuels de la pilule : Inactif, Écoute (micro actif), Réflexion (traitement), Parle (lecture audio IA).
*   **Interaction Audio** :
    *   Bouton cliquable pour activer/désactiver le micro (Push-to-talk ou bascule continue).
    *   Capture l'audio du microphone de l'utilisateur. L'audio brut est envoyé au Service Worker / Offscreen via `chrome.runtime.sendMessage`.
*   **Capture d'Écran / Vidéo Continue (Le "Tool" Visuel)** :
    *   Utilise la capture adaptative de la fenêtre avec `chrome.tabs.captureVisibleTab` (orchestré par le background) ou extraction directe du DOM.
    *   *Approche 2026 pour Gemini Live* : Extraction de frames (par ex. 1 à 2 images par seconde) et transmission de ces frames sous forme cryptée ou encodée au Service Worker pour analyse de contexte par l'IA.

### 3.2. Service Worker & API Gemini (`background.js`)
*   **Agent Gemini 2.5 Live** :
    *   Établit une connexion bidirectionnelle persistante avec l'endpoint Gemini Multimodal Live API.
    *   **Input** : Multiplexe le flux audio de l'utilisateur et le flux vidéo/images (frames de l'écran) en provenance du `content.js`.
    *   **Output** : Reçoit le flux audio généré par Gemini en temps réel.
*   **Orchestration** : Gère les interruptions, les erreurs réseau, et fait le pont permanent entre la pilule UI (`content.js`) et l'API d'intelligence artificielle.

### 3.3. Document Offscreen (`offscreen.html` & `offscreen.js`) - *Requis Manifest V3*
En Manifest V3, les Service Workers ne peuvent pas instancier l'API `AudioContext` ni maintenir activement des MediaStream persistants pour le micro en arrière-plan sans interface utilisateur associée.
*   Ce document fantôme est chargé de décompresser et de lire à la volée le flux audio reçu depuis Gemini.
*   Il s'occupe de maintenir l'enregistrement micro API de l'utilisateur actif tant que l'extension est utilisée.

### 3.4. Interface de Configuration (`index.html`)
Page d'options ou Popup pour la personnalisation :
*   **Clé API (API Key)** : Champ sécurisé (sauvegardé via `chrome.storage.local`) pour la clé Google Gemini API.
*   **Réglages Audio/Vidéo** :
    *   Sélection du périphérique d'entrée micro.
    *   Réglage de la fréquence de capture d'écran de la page (économie de bande passante).
*   **Prompt Système** : Configuration du persona ou des instructions spécifiques pour le Worker IA.
*   **Protection et Confidentialité** : Liste des domaines où la capture et l'injection sont interdites (Blacklist).

## 4. Flux de Données et Communication (Data Flow)

1. **Initialisation** : L'utilisateur navigue sur une page. `content.js` est injecté silencieusement.
2. **Déclenchement** : L'utilisateur clique sur la pilule en bas d'écran.
3. **Transmission Audio & Vidéo** :
    * Le micro est ouvert (via Offscreen).
    * `content.js` envoie des clichés visuels réguliers de la page active au background.
4. **Appel IA** : Le `background.js` assemble ces données (audio hertzien + images) et stream vers Gemini 2.5 Live via un socket sécurisé.
5. **Réponse IA** : Gemini analyse le visuel et propose une réponse audio.
6. **Restitution** : L'audio redescend, est joué à l'utilisateur, et l'UI du `content.js` s'anime pour montrer que l'IA parle.

## 5. Fichiers et Structure du projet
```text
/
├── manifest.json       # Configuration V3, versionning et permissions (tabCapture, storage, etc)
├── background.js       # Logique centrale, worker Gemini Live
├── content/
│   ├── content.js      # Gère la pilule UI, events DOM et envoi des frames
│   └── content.css     # Style des composants injectés
├── offscreen/
│   ├── offscreen.html  # Document technique invisible pour l'audio I/O
│   └── offscreen.js    # Worker local gérant MediaRecorder et AudioContext
├── options/
│   ├── index.html      # UI des paramètres d'extension
│   ├── settings.css    
│   └── settings.js     # Logique de la page d'options
└── assets/             
    ├── icons/          # Icônes de l'app (16, 48, 128)
    └── ui/             # Actifs visuels pour la pilule UI
```

## 6. Permissions requises (`manifest.json`)
*   `"permissions"` : 
    *   `"storage"` : Persistance des paramètres.
    *   `"activeTab"` / `"tabCapture"` : Autorisation de capturer le contenu visuel de l'onglet actif.
    *   `"scripting"` : Autorisation d'injecter la pilule (`content.js`).
    *   `"offscreen"` : Création du processus caché pour l'audio.
*   `"host_permissions"` : `["<all_urls>"]` (Indispensable pour fonctionner partout).
