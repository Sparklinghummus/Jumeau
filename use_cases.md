# Cas d'Usage et User Stories : Jumeau

## 1. User Stories

### 👤 Le Sales Productivity Ninja
> "En tant que commercial, je veux que Jumeau analyse le profil LinkedIn que je regarde et l'ajoute directement à mon CRM via mon workflow n8n en lui parlant, pour ne plus perdre de temps en saisie manuelle."

### 👤 Le Content Creator
> "En tant que créateur de contenu, je veux pointer une série d'articles de veille et dire 'Fais-moi un résumé snarky pour Twitter', puis que Jumeau utilise mon Skill MCP pour programmer le thread directement."

### 👤 Le Support Technique
> "En tant qu'agent support, je veux que Jumeau détecte un bug report sur GitHub, l'analyse visuellement, et me demande confirmation via son curseur avant de créer un ticket Jira lié."

## 2. Cas d'Usage concrets (Workflow n8n/MCP)

### A. Extraction & Enrichment (Le "Magic Scraper")
*   **Contexte** : Vous êtes sur une page de résultats Amazon.
*   **Action** : Vous dites "Récupère les prix et compare-les avec mon Google Sheet".
*   **Magic** : Jumeau identifie les sélecteurs CSS visuellement, appelle un serveur MCP qui contient un workflow n8n d'enrichissement de prix, et affiche le curseur sur le produit le moins cher pour vous demander : "Je l'ajoute à la liste ?"

### B. Cross-App Sync (Le "Universal Bridge")
*   **Contexte** : Lecture d'un thread complexe sur Slack.
*   **Action** : "Transforme cette discussion en une tâche Notion avec les bons tags."
*   **Magic** : L'extension extrait le contexte, utilise le skill MCP "Notion-n8n" et vous montre via l'overlay quelles parties de la discussion ont été retenues pour la tâche.

### C. Debugging Visuel
*   **Contexte** : Un développeur voit une erreur dans la console ou une UI cassée.
*   **Action** : "Explique-moi pourquoi ce bouton est décalé."
*   **Magic** : Jumeau analyse le DOM et la capture, pointe l'élément problématique avec le curseur, et propose de lancer un workflow de correction via un agent spécialisé.
