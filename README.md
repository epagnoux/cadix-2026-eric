# Cadix 2026 – Eric

Album statique en français avec 21 photos fournies par Eric. Les images visibles sont présentées à leur ratio d’origine.

## Aperçu local

Depuis ce dossier : `python3 -m http.server 8765 --directory dist`.

## Ajouter ou remplacer les photos

Déposer les images dans `dist/photos`, puis lancer `scripts/import_photos.py` avec Python et Pillow. Le script lit la date de prise de vue EXIF, regroupe les images par journée (journées récentes en premier, photos chronologiques dans chaque journée) et inscrit les images sans date dans un groupe distinct. Les fichiers originaux ne sont pas modifiés. Les dates sans fuseau sont interprétées dans le fuseau de Madrid.

`dist/album.json` peut aussi être édité manuellement : chaque groupe contient `date`, `contributor` et `photos`. Chaque photo contient `id`, `src`, `width`, `height`, `taken` et `caption`.

## Présentation actuelle

Fond sombre et galeries justifiées : chaque rangée s’adapte aux proportions réelles des images, sans les recadrer. Les panoramas et les portraits conservent ainsi toute leur composition. La visionneuse présente également la photo entière.

La visionneuse propose les flèches, Échap, les gestes horizontaux, le diaporama, le téléchargement et les liens directs vers une photo.

## Préparer la publication

Lancer `python3 scripts/build.py` pour copier uniquement le site et les photos de l’album actif dans `out`. `noindex` et `robots.txt` demandent aux moteurs de recherche de ne pas indexer l’album ; ce ne sont pas des protections d’accès.
