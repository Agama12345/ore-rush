# Ore Rush — wersja na PC (Electron)

Ta wersja otwiera grę jako osobne okno na komputerze, bez przeglądarki.

## Jak uruchomić
1. W folderze projektu gry: `npm install` i `npm run build` (powstaje `dist/index.html`).
2. Skopiuj ten folder obok projektu, tak żeby ścieżka `../dist/index.html` działała.
3. W tym folderze: `npm install`, potem:
   - `npm start` — uruchamia grę w oknie (do testów),
   - `npm run dist:win` — tworzy instalator i wersję portable dla Windows w `release/`.

Gotowe pliki `.exe` wychodzą w `release/`. Build na Windows robi się najpewniej na Windowsie.

## Najprościej: zbuduj instalator na swoim PC (Windows)
1. Zainstaluj Node.js LTS z nodejs.org.
2. Otwórz folder gry w terminalu i wykonaj: `npm install` oraz `npm run build`.
3. Przenieś folder `ore-rush-desktop` obok folderu gry (tak, by `../dist/index.html` istniało).
4. W folderze `ore-rush-desktop` wykonaj: `npm install` i `npm run dist:win`.
5. W `release/` znajdziesz `Ore Rush Setup 1.0.0.exe` (instalator) oraz `Ore Rush 1.0.0.exe` (bez instalacji). Z ikoną gry. Dwuklik i grasz.

Ikona leży w `build/icon.png`. Podmień ją plikiem 512x512, jeśli chcesz inną.
