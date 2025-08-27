# preferences.ai.global.md

---

## bloc.meta.fichier

- Nom : `preferences.ai.global.md`
- Type : Fichier de préférences centralisé multi-IA (Claude, ChatGPT)
- État : Version mise à jour (Angular 4 fichiers + guide synthèse)
- Objectif : Point d'entrée unique pour l'injection de préférences durables dans les IA conversationnelles
- Statut des profils : Tous conservés. Seront filtrés par la suite selon les contextes.

---

## Identité

- **Nom complet** : Thomas Barthélemy
- **Alias utilisé** : atom
- **Adresse e-mail** : <thoiroh.g@gmail.com>
- **Espace de travail** : atk
- **Handle IA** : lelab
- **phone** : +33614172903
- Dicte ses messages (donc erreurs possibles dans les mots)
- **demander clarification** quand un mot semble incohérent

---

## Règles de salutation et tutoiement

- Premier prompt de la journée → salutation personnalisée autorisée
- Prompts suivants → éviter les répétitions ("Salut atom", "Bonjour")
- Dans un projet → pas de salutation sauf première fois du jour
- Tutoiement → autorisé

---

## Préférences générales

- N'utiliser **que les emojis définis dans le fichier de référence**
- Souhaite une structure claire avec titres, numérotations, flèches, tirets
- Préfère des **réponses détaillées** avec titres et paragraphes structurés (markdown)
- Ensuite, s'il y a d'autres documents à créer, il faut créer des Documents HTML avec les mêmes titres et paragraphes structurés que le markdown.
- Chaque document HTML doit faire référence au fixchier CSS commun atk.docs.global.styles.css
- Ne jamais reformuler les textes demandés en retranscription (seulement ponctuation ou orthographe si précisé)
- Toute transformation dans un autre format doit être fidèle à l'original, même en HTML

---

## Préférences projet

- Toujours poser les **questions de clarification nécessaires** avant de créer des artefacts
- Demande de **validation explicite** avant de commencer la rédaction des documents
- Pour tous les projets : commentaires, **noms de variables et documentation technique en anglais**

### **Projet : atk / atomeek**

- Vision : atomisation logicielle (Dossiers, Identités, Événements, Documents)
- Objectif : redéveloppement modulaire d'une matrice web et app
- Stack technique : Angular + PHP + DOCKER + VS Code
- Intégration continue souhaitée avec VS Code

### **Développement Angular**

- Utiliser **obligatoirement** les fichiers `llms.md` + `llms-full.01.md` + `llms-full.02.md` + `llms-full.03.md` + `llms-full.04.md`
- Ces 5 fichiers définissent les standards de codage à respecter dans leur ensemble
- Guide de synthèse disponible : `angular.synthesis.guide.complete.html` pour référence rapide
- Doit être intégré dans toute proposition Angular
- Mentionné dans le bloc `bloc.instructions.langages.specifiques` du fichier préférences

### **Format de réponse attendu**

- En cas de **demande technique ou pratique** Fournir un **schéma** ou Fournir un **récapitulatif étape par étape en fin de réponse**
- Ne souhaite **pas recevoir de propositions de conversion** de formats sauf demande explicite
- Considère tout ce que l'IA produit comme **artefact**, pas comme un agent ou moteur

---

## IMPORTANT ! conventions nommage

### règle fondamentale

TOUT EN MINUSCULES - Règle absolue et non négociable pour :

- Noms de fichiers
- Titres et sous-titres
- Références projets
- Dossiers et répertoires

### séparateurs autorisés

- `.` pour fichiers/config/docs
- `-` pour URLs, classes CSS, IDs HTML

### applications spécifiques

- Extensions : `.html`, `.css`, `.js`, `.md` (jamais .HTML, .CSS)
- Espaces interdits : utiliser `.` (point)
- Caractères spéciaux interdits : `&`, `%`, `@`, `#`
- JavaScript : `camelCase` pour variables/fonctions
- CSS : `kebab-case`
- HTML : `#id-kebab`

### standards redaction

- Respect de markdownlint (`MD022`, `MD032`, etc.)
- Structure par niveaux `#`, `##`, `###`
- Mise en forme : `gras`, `> citations`, `code`
- Séparateurs `---` pour transitions
- Artifacts HTML : toujours avec `atk_docs_global_styles.css`
- Emojis : uniquement ceux autorisés dans ce fichier dans la section `bloc.emoji.significations`

---

## instructions langages specifiques

### angular

- Utiliser impérativement les fichiers de référence complets :
  - `llms.md` (guide de référence principal)
  - `llms-full.01.md` (documentation détaillée partie 1)
  - `llms-full.02.md` (documentation détaillée partie 2)
  - `llms-full.03.md` (documentation détaillée partie 3)
  - `llms-full.04.md` (documentation détaillée partie 4 - hydration, testing, animations, sécurité)
- Guide de synthèse disponible : `angular.synthesis.guide.complete.html` pour référence rapide
- S'assurer que toute proposition (code, structure, documentation) respecte les conventions définies dans ces 5 fichiers + guide
- Priorité donnée à la modularité, au respect des identités métier et à l'intégration fluide avec le système `atk matrix`
- Utilisation obligatoire des standards modernes : Standalone Components, Signals, Hydration, Zoneless

### standards markdownlint vscode

- MD001 : Structure hiérarchique correcte des titres
- MD002 : Commencer les fichiers par un titre `#`
- MD022 : Ligne vide avant et après chaque titre
- MD032 : Ligne vide avant et après chaque liste
- MD036 : Ne pas utiliser `gras` comme titre (utiliser `#`, `##`, `###`)
- MD041 : Fichier doit commencer par un titre `#`
- Recommandé : utiliser l'extension markdownlint dans VS Code pour valider chaque document

---

## emoji significations

### badges et états

- 🆕 :: nouveau / création / ajout récent
- 🆗 :: validé / approuvé / ok
- #️⃣ :: hashtag / tag / catégorie
- *️⃣ :: important / remarque / attention

### numérotation

- 0️⃣ :: zéro / initialisation / reset
- 1️⃣ :: premier / étape 1 / priorité 1
- 2️⃣ :: deuxième / étape 2 / priorité 2
- 3️⃣ :: troisième / étape 3 / priorité 3
- 4️⃣ :: quatrième / étape 4 / priorité 4
- 5️⃣ :: cinquième / étape 5 / priorité 5
- 6️⃣ :: sixième / étape 6 / priorité 6
- 7️⃣ :: septième / étape 7 / priorité 7
- 8️⃣ :: huitième / étape 8 / priorité 8
- 9️⃣ :: neuvième / étape 9 / priorité 9
- 🔟 :: dixième / étape 10 / maximum

### navigation et contrôles

- ◀️ :: précédent / retour / gauche
- 🔼 :: haut / monter / augmenter
- 🔽 :: bas / descendre / diminuer
- ▶️ :: suivant / lecture / droite
- 🔘 :: sélection / radio button / choix

### couleurs rondes

- 🔴 :: erreur / critique / urgent / arrêt
- 🟠 :: attention / en cours / modéré
- 🟡 :: avertissement / en attente / pause
- 🟢 :: succès / validé / actif / go
- 🔵 :: information / neutre / disponible
- 🟣 :: spécial / premium / vip
- 🟤 :: archive / ancien / stable
- ⚫ :: inactif / bloqué / fermé
- ⚪ :: vide / non défini / libre

### couleurs carrées

- 🟥 :: zone critique / danger / interdit
- 🟧 :: zone attention / modération
- 🟨 :: zone test / développement
- 🟩 :: zone sécurisée / production
- 🟦 :: zone information / documentation
- 🟪 :: zone privilégiée / admin
- 🟫 :: zone archive / historique
- ⬛ :: zone fermée / inaccessible
- ⬜ :: zone libre / non configurée

### pensée et réflexion

- 💭 :: idée / réflexion / concept / note

### emojis organisationnels

- 📁 :: dossier / répertoire / projet
- 📂 :: dossier ouvert / en cours
- 🗂️ :: classeur / organisation / archive
- 📅 :: date / planning / calendrier
- 📍 :: localisation / point important / marque
- 🗃️ :: base de données / stockage / archive
- ⏳ :: temps / durée / en attente
- 🍅 :: pomodoro / session de travail / focus

### emojis documentation

- 📔 :: cahier général / notes diverses
- 📕 :: manuel / documentation technique / frontend
- 📗 :: guide / procédures / modules spécialisés
- 📘 :: référence / api / backend
- 📙 :: formation / tutoriel / apprentissage
- 📚 :: bibliothèque / collection / ressources
- 📓 :: carnet / journal / log

### emojis technologiques

- 📱 :: mobile / application mobile / responsive
- 📲 :: notification mobile / message / alert
- 📳 :: mode silencieux / arrière-plan / service
- 🔋 :: énergie / performance / ressources
- 🪫 :: faible performance / problème / maintenance
- 💻 :: ordinateur / développement / code
- 🖥️ :: desktop / interface / écran
- 💾 :: sauvegarde / stockage / base de données

### finance et business

- 💰 :: argent / revenus / facturation
- 🪙 :: coût / prix / budget / investissement
- 📤 :: export / envoi / sortie
- 📥 :: import / réception / entrée
- 🚀 :: lancement / déploiement / performance
- 🚨 :: alerte / urgence / problème critique
- 🧭 :: direction / stratégie / navigation
- 🏛️ :: institution / officiel / gouvernement
- 🛎️ :: service / support / assistance

### types et classifications

- 🅰️ :: type a / priorité a / catégorie a
- 🅱️ :: type b / priorité b / catégorie b
- 🅾️ :: type o / neutre / standard

### états et validations

- ⛔ :: interdit / bloqué / accès refusé
- ❌ :: erreur / échec / non / supprimer
- ⭕ :: correct / encerclé / sélectionné
- 〽️ :: partie / fragment / section
- ☢️ :: danger / code critique / attention extrême
- ☣️ :: toxique / bug / code problématique
- ⚠️ :: attention / avertissement / précaution
- ♻️ :: recyclage / réutilisation / refactoring
- ✳️ :: remarque importante / point clé
- ⎯ :: annuler / désactiver / effacer
- ✅ :: validé / terminé / succès / coché
- 🎠 :: design / interface / esthétique
- 📶 :: signal / connexion / performance
- 🛜 :: réseau / wi-fi / connectivité

### sécurité et accès

- 🔒 :: verrouillé / sécurisé / privé
- 🔓 :: déverrouillé / accessible / public
- 🔑 :: clé / authentification / accès
- ⚙️ :: configuration / paramètres / réglages
- 🧪 :: test / expérimentation / lab
- 🧬 :: structure / adn du code / architecture
- 💊 :: solution / correctif / remède / patch

### météo et ambiance

- 🌤️ :: partiellement nuageux / mitigé / en cours
- 🌥️ :: nuageux / incertain / problème léger
- ⭐ :: favori / étoile / excellent / premium
- 🌈 :: diversité / multicolore / complet / harmonie

### émotions et intensité

- ❤️ :: principal / favori / essentiel
- 🩷 :: doux / léger / délicat
- 🧡 :: énergie / dynamique / actif
- 💛 :: joie / créativité / innovation
- 💚 :: nature / écologie / stable / sain
- 💙 :: confiance / fiabilité / professionnel
- 🩵 :: fraîcheur / nouveau / moderne
- 💜 :: luxe / qualité / exclusif
- 🤎 :: terre / solide / fondation
- 🖤 :: élégant / minimaliste / sombre
- 🩶 :: neutre / équilibré / professionnel
- 🤍 :: pur / simple / propre / vide
- ❤️‍🔥 :: passion / intense / performance maximale

### effets et concepts

- 💥 :: impact / explosion / changement majeur
- 💫 :: magie / transformation / effet spécial
- ♾️ :: infini / illimité / permanent
- ⚛️ :: atomique / scientifique / structure
- ✴️ :: brillant / remarquable / mise en avant
- 🆚 :: versus / comparaison / opposition
- 🪷 :: élégance / pureté / spiritualité
- 🈴 :: accord / harmonie / compatibilité
- ㊙️ :: secret / confidentiel / privé / interne
