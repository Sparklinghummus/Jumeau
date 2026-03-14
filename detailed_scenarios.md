# Scénarios de Démonstration : Jumeau en Action

Voici 8 scénarios concrets montrant comment Jumeau interagit avec des applications web via la voix, la vision et des workflows MCP/n8n.

---

## 1. Amazon : Optimisation d'Achat (E-commerce)
*   **Contenu de la page** : Une fiche produit pour un écran "Dell UltraSharp 27".
*   **Dialogue** :
    *   **Utilisateur** : "C'est un bon prix ça ? Regarde si mes fournisseurs habituels l'ont moins cher."
    *   **Jumeau** : "Le prix affiché est de 450€. Je lance le Skill 'Check Inventory' via ton serveur MCP."
*   **Action IA** : 
    *   **Vision** : Identifie le titre du produit et le prix actuel.
    *   **Exécution** : Appelle un workflow n8n qui scrappe 3 autres sites.
    *   **Curseur** : Se déplace sur le prix et le souligne en rouge car il a trouvé une offre à 399€ ailleurs.
    *   **Réponse** : "Trouvé à 399€ sur TopAchat. Je mets le lien dans tes favoris ?"

---

## 2. Slack : Synthèse & Action (Communication)
*   **Contenu de la page** : Un channel `#projet-jumeau` avec 20 nouveaux messages.
*   **Dialogue** :
    *   **Utilisateur** : "Qu'est-ce que j'ai raté d'important ici depuis ce matin ?"
    *   **Jumeau** : "Il y a une discussion tendue sur le bug du micro. Je te fais un résumé."
*   **Action IA** :
    *   **Vision** : Analyse le flux de messages pour identifier les noms des participants et les mots-clés.
    *   **Exécution** : Utilise un agent MCP de résumé textuel (Gemini 2.5).
    *   **Curseur** : Souligne le message de 'Marc' (le lead dev) qui contient la solution technique.
    *   **Réponse** : "Marc a trouvé la solution. Veux-tu que j'envoie ce résumé par email à l'équipe via ton bot Zapier ?"

---

## 3. LinkedIn : Prospection Intelligente (Sales)
*   **Contenu de la page** : Profil LinkedIn d'un "Head of AI" chez Microsoft.
*   **Dialogue** :
    *   **Utilisateur** : "Ajoute ce profil à ma campagne de recrutement 'Top Talents'."
    *   **Jumeau** : "C'est parti. Je récupère son parcours."
*   **Action IA** :
    *   **Vision** : Extrait le nom, le poste actuel et les expériences précédentes.
    *   **Curseur** : Pointage successif sur le bouton 'Se connecter' et le nom de l'entreprise.
    *   **Exécution** : Envoie les données vers un workflow n8n relié à HubSpot et Lemlist.
    *   **Réponse** : "Contact ajouté. J'ai aussi préparé une note personnalisée mentionnant son passage chez DeepMind. Je l'envoie ?"

---

## 4. Google Sheets : Manipulation de Données (Productivity)
*   **Contenu de la page** : Une feuille de calcul avec 500 lignes de dépenses.
*   **Dialogue** :
    *   **Utilisateur** : "Nettoie cette colonne 'Date', le format est n'importe quoi."
    *   **Jumeau** : "Je vois plusieurs formats (US/EU). Je vais harmoniser tout ça."
*   **Action IA** :
    *   **Vision** : Identifie la colonne 'Date' (D) et les incohérences visuelles.
    *   **Curseur** : Sélectionne visuellement la plage `D2:D500`.
    *   **Exécution** : Lance un script JS via le runtime de l'extension pour re-formater les données.
    *   **Réponse** : "Format ISO appliqué. J'ai aussi mis en gras les dates qui tombent un dimanche."

---

## 5. GitHub : Debugging Collaboratif (Dev)
*   **Contenu de la page** : Une Pull Request avec des commentaires de code.
*   **Dialogue** :
    *   **Utilisateur** : "Applique les suggestions de Sarah sur ce fichier."
    *   **Jumeau** : "Elle demande de renommer `init()` en `setupEnv()`. Je vérifie les autres appels."
*   **Action IA** :
    *   **Vision** : Lit les commentaires `diff` de la PR.
    *   **Curseur** : Survole les lignes de code mentionnées par Sarah.
    *   **Exécution** : Utilise le Skill 'Code Editor' pour simuler les modifications.
    *   **Réponse** : "Modifications prêtes. Veux-tu que je fasse le commit avec le message 'Fix based on PR feedback' ?"

---

## 6. Notion : Organisation de Base de Données (Knowledge Management)
*   **Contenu de la page** : Une base de données Notion de 'Board Games' sans images.
*   **Dialogue** :
    *   **Utilisateur** : "Il manque les pochettes pour ces jeux. Tu peux m'aider ?"
    *   **Jumeau** : "Bien sûr. Je vais chercher les visuels sur BoardGameGeek."
*   **Action IA** :
    *   **Vision** : Identifie la colonne 'Nom du jeu'.
    *   **Exécution** : Workflow n8n qui : 1. Cherche le nom sur Google Images. 2. Télécharge l'URL. 3. Met à jour la propriété 'Cover' dans Notion.
    *   **Curseur** : Se déplace sur la cellule vide pour montrer qu'il travaille.
    *   **Réponse** : "J'ai trouvé 12 couvertures. Je les ai injectées dans ta base."

---

## 7. Salesforce : Data Entry Voix-à-CRM (Enterprise)
*   **Contenu de la page** : Formulaire de création d'une nouvelle 'Opportunité'.
*   **Dialogue** :
    *   **Utilisateur** : "Remplis ça : Client c'est Tesla, budget 50k, clôture prévue en juin."
    *   **Jumeau** : "C'est noté. 'Tesla', '50 000$', '30/06/2026'."
*   **Action IA** :
    *   **Vision** : Identifie les champs 'Account Name', 'Amount' et 'Close Date'.
    *   **Curseur** : Saute de champ en champ au fur et à mesure qu'il saisit les données.
    *   **Exécution** : Injection DOM directe dans la page web.
    *   **Réponse** : "Champs remplis. Clique sur 'Save' quand tu es prêt."

---

## 8. Gmail : Tri Intelligent (Daily Routine)
*   **Contenu de la page** : Boîte de réception avec 50 emails non lus.
*   **Dialogue** :
    *   **Utilisateur** : "Vire tous les spams de newsletters et garde uniquement ce qui concerne le voyage à Londres."
    *   **Jumeau** : "Je vois 3 emails sur Londres et 15 pubs. J'archive le reste."
*   **Action IA** :
    *   **Vision** : Analyse les objets des emails et les expéditeurs.
    *   **Curseur** : Coche visuellement les cases à côté des newsletters.
    *   **Exécution** : Call vers le Skill MCP 'Gmail Manager'.
    *   **Réponse** : "Nettoyage terminé. Il te reste 5 emails importants à traiter, j'ai surligné les infos de vol en bleu."
