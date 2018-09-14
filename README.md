# Chrono des affaires judiciaires

Template réutilisable permettant de présenter la chronologie des faits et les personnages clés d'une affaire judiciaire.

## Démarrer

### Prérequis

Avoir un ordinateur avec internet installé dessus.

### Installation

À la main :
- Cliquer sur `Clone or download > Download ZIP`, l'enregistrer où vous voulez
- Ouvrir une fenêtre de terminal, taper `cd` **suivi d'un espace**, et glisser dans la fenêtre le dossier que vous venez de télécharger. Faites [Entrée].
- Taper cette commande puis faites [Entrée] : `python -m SimpleHTTPServer 8000`

Dans le terminal :
- `cd /le/chemin/que/vous/voulez`
- `git clone https://github.com/libe-max/affaires-judiciaires.git`
- `python -m SimpleHTTPServer 8000`

Dans votre navigateur, rendez vous sur [http://localhost:8000](http://localhost:8000)

## Remplir les données

- Faire une copie de [ce document](https://docs.google.com/spreadsheets/d/15Z9IKSSp8nuG6DVWsJy9FpHNt0EvqdIhz0T8u0CnZZM/edit?usp=sharing)
- Remplir le document copié (ne pas toucher aux onglets `_var` et `_output`, ainsi qu'aux 4 lignes supérieures).
- **ATTENTION :** Les images utilisées pour les photos de protagonistes doivent être préalablement hébergées en ligne, et ne pas dépasser 100ko, au risque de rendre l'application très lente pour les lecteurs.
- **ATTENTION BIS :** Il est recommandé de ne pas laisser de lignes vides entre chacun des protagonistes et chacun des faits. Il est également recommandé de numéroter dans l'ordre et sans sauts les colonnes `ID`.
- Une fois le document rempli, se rendre dans le menu `File > Publish to the web`. Sélectionner `_output` à la place de `Entire document`, et `.tsv` à la place de `Web page`. Cliquer sur `Publish`.
- Dans la partie `Published content & settings`, s'assurer que seul l'onglet `_output` est publié.
- Chaque modification effectuée dans le spreadsheet sera prise en compte dans les 10 minutes par l'application, même après la publication de celle-ci.

## Préparer le template

- Dans `scripts/custom.js`:
  - remplacer la valeur de la propriété `dataUrl` par celle obtenue lors de la publication du spreadsheet
  - adapter les labels de rôles de protagonistes, dans la propriété `rolesLabels`
- Dans `index.html`:
  - remplir le titre du document dans les divs
    - `.sticky-header`
    - `.header.header_desktop`
    - `.header.header_mobile`
  - remplir le paragraphe d'intro dans la div `.introduction-paragraph`
  - faire une recherche dans le document de toutes les lignes contenant `[À REMPLIR]`, et remplacer les textes par les textes définitifs
- Dans `styles/custom.css`:
  - ajuster le css pour les tailles et couleurs des titres dans le header (tous les sélecteurs doivent être préfixés par `#wrapper`)

## Mise en ligne

- Dans `index.html`:
  - décommenter les scripts Chartbeat, Google Analytics et Xiti en bas du document 
- Créer sur le FTP un dossier nommé `/[Année]/[Mois]/[Nom du format]` (cette structure doit correspondre aux URLS renseignées dans les meta tags en haut de `index.html`)
- Déposer à l'interieur du dossier créé sur le serveur l'intégralité du contenu du dossier de cette application.
- Votre application devrait apparaitre sous peu à l'adresse `http://www.liberation.fr/[Année]/[Mois]/[Nom du format]`


## Technical details

### Dependencies

* [Normalize.css 8.0.0](https://necolas.github.io/normalize.css/) – CSS reset
* [jQuery 3.3.1](https://code.jquery.com/jquery/) - DOM manipulation & ajax requests
* [Moment.js 2.22.2](https://momentjs.com/) - Date manipulation

### Authors

* **Maxime Fabas** - *Initial work* - [Libé works](https://github.com/libe-max), [Other works](https://github.com/maximefabas)
