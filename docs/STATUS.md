# Projektstand (für den nächsten Arbeitstag)

Stand: 16.11.2026

## Fertig
- Version 1 (Kleiderschrank, Fotos, Outfit-Generator, Verlauf, Archiv, PWA) – Plan `docs/superpowers/plans/2026-11-16-outfit-app-v1.md`
- Flat-Lay-Look, Meilenstein L1 (Tasks 1–3): Masken-Logik, „Automatisch verbessern“, Freistell-Pipeline im Web Worker,
  Modell-Labor unter `/labor` – Plan `docs/superpowers/plans/2026-11-16-flat-lay-look.md`

## Als Nächstes
1. **Julian** testet `https://clothing-app-seven-mauve.vercel.app/labor` am S23 mit ~10 Fotos (flach auf dem Boden, von oben:
   Hoodie, Hose, Timberlands, Kette, Uhr, gemustertes Teil, helles Teil auf hellem Boden) mit **BiRefNet lite** und **IS-Net**
   und schickt Screenshots, Ladezeit („Laden: … ms“) und seinen Eindruck.
2. Danach: Modell festlegen (`ACTIVE_MODEL` in `src/lib/cutout/models.ts`), nicht gewähltes Modell entfernen,
   `THIRD_PARTY_NOTICES.md` anpassen → Task 3 abschließen.
3. Weiter mit Meilenstein L2 (Task 4: Migration `0002_cutouts.sql`, die Julian im Supabase SQL Editor ausführt).

## Arbeitsweise (Julians Vorgaben)
Superpowers schlank, ohne Subagents und Worktrees, direkt auf `main`; TDD nur für Logik; nach jedem Meilenstein kurzer Bericht
mit Test-Anleitung fürs S23; Erklärungen auf Deutsch, kurz und verständlich.
