# Spécification Technique : Extension Chrome "Jumeau" (Manifest V3)

## 1. Vue d'ensemble du projet
"Jumeau" est une extension Chrome agissant comme un "sidekick" multimodal piloté par la voix. Son but est d'observer l'écran de l'utilisateur, d'écouter ses intentions et de construire visuellement une logique applicative portable (Skills/Gems/Agents).

Conformément au PRD, l'extension s'appuie sur les capacités natives de Chrome pour offrir une expérience "ambiante", sans nécessiter un onglet dédié. 

## 2. Architecture de l'Extension (Manifest V3)
L'architecture respecte les standards stricts de sécurité et de performance de Chrome Extensions Manifest V3 (implémentation 2026), interdisant l'exécution de code distant et utilisant des Service Workers et des Offscreen Documents.

### Composants principaux :
1.  **Service Worker (`background.js`)** : Le cœur logique de l'extension. Gère l'état global, la mémoire utilisateur ("Knowledge Repo"), orchestre les WebSockets/APIs vers le backend multimodal (Vision/Audio) et communique avec le Sidepanel.
2.  **Sidepanel (`sidepanel.html` & `sidepanel.js`)** : Interface persistante hébergeant le "Live Canvas". C'est là qu'apparaissent dynamiquement les "bulles" de workflow construites pendant l'échange vocal.
3.  **Content Scripts (`content.js`, `content.css`)** : Injectés dans chaque onglet. Gèrent :
    *   L'interface utilisateur de la "pilule" audio (point d'entrée optionnel en plus de l'icône de la barre Chrome).
    *   **Les "Overlay Highlights"** : Une couche d'encre ("ink layer") transparente dessinée par-dessus le DOM pour mettre en évidence ce que l'IA est en train d'analyser.
    *   L'injection DOM pour l'export universel (ex: remplissage du champ "System Instructions" sur Gemini).
4.  **Offscreen Document (`offscreen.html`)** : Nécessaire en MV3 pour maintenir une capture audio (micro) continue en full-duplex, car le Service Worker n'a pas accès à l'API `MediaRecorder` ni aux flux audio continus.

## 3. Détail des Fonctionnalités Clés

### 3.1. Interactivité Multimodale ("Look and Speak")
*   **Capture Visuelle** : Utilise `chrome.tabs.captureVisibleTab` ou `desktopCapture` pour prendre des clichés du viewport actif.
*   **Backbone Multimodal (Modèles)** :
    *   **Transcription (STT)** : Whisper API ou Gemini Nano (en local sur l'appareil pour la rapidité).
    *   **Vision & Logique (LLM)** : Claude 3.5 Sonnet Vision (ou Gemini 2.5) pour analyser la capture d'écran, comprendre le DOM (via le script de contenu) et structurer la logique (le Blueprint).
    *   **Synthèse Vocale (TTS)** : ElevenLabs pour une voix d'interrogation naturelle et réactive.
*   **Overlay Highlights** : Le LLM renvoie des coordonnées ou des sélecteurs CSS des éléments pertinents (ex: liste d'articles, profil contact). Le `content.js` dessine un "glow" vert autour de ces éléments via une surcouche Canvas ou CSS isolée.

### 3.2. Interactive Live Canvas (Sidepanel)
*   **Interface Vue (UI)** : Construit dynamiquement des nœuds (bulles) représentant chaque étape de la logique déduite par l'IA.
*   **Interactivité** : Permet à l'utilisateur, même non-technique, d'éditer le flux par la voix ("Supprime cette étape") ou manuellement (swipe/clic pour supprimer).
*   **États visuels** : Les bulles ont des indicateurs d'état ("En réflexion", "Info manquante", "Prêt à exporter").

### 3.3. The Knowledge Repo (Mémoire personnelle)
*   Implémenté via `chrome.storage.local` (et potentiellement IndexedDB pour les gros historiques).
*   **Domain Awareness** : Le background enregistre le vocabulaire ou les habitudes propres à un domaine (ex: `github.com` associé à "ticket").
*   **Skill Memory** : Mémorisation des Skills précédemment créés avec suggestion contextuelle activée selon l'URL de l'onglet actif.

### 3.4. The Translator (Export Universel)
À la fin de l'interaction, le Blueprint est traduit vers la plateforme cible choisie par l'utilisateur :
*   **Claude** : Le Service Worker génère un fichier `SKILL.md` (via l'API File ou Blob) et déclenche un téléchargement/upload sur la page cible.
*   **Gemini** : Le `content.js` identifie les textareas spécifiques sur la page de Gemini et y injecte le prompt structuré (via le DOM).
*   **Copilot** : Formatage en bloc d'instructions personnalisées pour Microsoft 365.

## 4. Flux d'Interaction (Le "Morning Routine")
1. **Déclencheur** : Clic sur l'icône de l'extension (action Chrome) ou sur la pilule de l'onglet actif.
2. **Audio I/O** : Le document Offscreen capture le micro et streame vers le Service Worker, qui route vers le STT.
3. **Capture Visuelle** : En parallèle, le SW demande au Content Script / API Tabs de capturer l'écran et envoie l'image + texte au LLM Vision.
4. **Génération & UI** : Le LLM répond. Le SW ordonne au Sidepanel d'afficher de nouvelles bulles de Blueprint. Le TTS ElevenLabs lit la réponse à haute voix.
5. **Actionnement** : L'utilisateur approuve le Blueprint final. Le SW envoie les données formatées au module Translator pour l'export (ex: click "Go" -> injection dans Claude/Gemini).

## 5. Fichiers et Structure du projet
```text
/
├── manifest.json       # Permissions étendues (sidePanel, desktopCapture, etc.)
├── background.js       # Worker : orchestration IA, Knowledge Repo, Translator
├── content/
│   ├── content.js      # Pilule UI, Overlay Highlights (ink layer), DOM Injection (Export)
│   └── content.css     # Style des composants injectés
├── sidepanel/
│   ├── sidepanel.html  # Le "Live Canvas"
│   ├── sidepanel.css
│   └── sidepanel.js    # Rendu dynamique des nœuds/bulles
├── offscreen/
│   ├── offscreen.html  # Document fantôme pour Web Audio / microphone en continu
│   └── offscreen.js    
├── options/
│   ├── index.html      # Configuration des clés (ElevenLabs, Claude, Gemini, Whisper)
│   ├── settings.css    
│   └── settings.js     
└── assets/             
    ├── icons/          
    └── ui/             
```

## 6. Permissions requises (`manifest.json`)
*   `"permissions"` : 
    *   `"sidePanel"` : Création et gestion du Live Canvas persistant.
    *   `"storage"` : Knowledge Repo et paramètres.
    *   `"activeTab"` / `"tabCapture"` : Capture de l'onglet actif pour le LLM Vision.
    *   `"desktopCapture"` : (Optionnel/Selon besoin) Capture étendue d'écran.
    *   `"scripting"` : Exécution de code pour les Overlay Highlights et le DOM Injection.
    *   `"offscreen"` : Enregistrement micro en arrière-plan.
*   `"host_permissions"` : `["<all_urls>"]` (Indispensable pour l'injection logicielle universelle).
