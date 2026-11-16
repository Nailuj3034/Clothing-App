# Outfit – persönliche Kleiderschrank- und Outfit-App

Mobile-first PWA: Kleiderschrank mit Fotos, regelbasierte Outfit-Vorschläge mit Begründung, Verlauf und eine einfache 3D-Figur.
Gebaut mit React, TypeScript, Vite, Supabase und React Three Fiber.

> Work in progress – Version 1 entsteht gerade. Design: [`docs/superpowers/specs`](docs/superpowers/specs), Plan: [`docs/superpowers/plans`](docs/superpowers/plans).

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Supabase-Werte eintragen
npm run dev                  # Entwicklungsserver
npm test                     # Tests der Outfit-Logik
npm run build                # Produktions-Build
```

## Git-Spickzettel

```bash
# Repo einmalig auf den Mac holen
git clone https://github.com/Nailuj3034/Clothing-App.git

# Neuesten Stand holen (im Projektordner)
git pull

# Was hat sich lokal geändert?
git status

# Eigene Änderungen speichern und hochladen
git add .
git commit -m "kurze Beschreibung"
git push

# Letzte Commits ansehen
git log --oneline -10
```
