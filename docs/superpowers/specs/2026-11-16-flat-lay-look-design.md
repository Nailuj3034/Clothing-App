# Flat-Lay-„Look“ statt 3D – Design

Stand: 16.11.2026 · Status: zur Freigabe · baut auf `2026-11-16-outfit-app-design.md` (V1) auf

## 1. Worum es geht

Die stilisierte 3D-Figur überzeugt optisch nicht. Stattdessen wird ein Outfit als **Flat Lay im Magazin-Stil** gezeigt,
wie in den bekannten Outfit-Reels: die echten, **freigestellten Fotos** der Teile liegen leicht gedreht mit Schatten auf
einem Untergrund, dazu ein großer Titel (Anlass + Wochentag) und kleine Beschriftungen. Das Bild lässt sich
**speichern und teilen**. Referenz-Mockup (Variante C): https://claude.ai/artifact/GN7uQtWddH8Vnjh3FzaRnB

Warum: Mit echten Fotos sieht das sofort gut aus, statt mit 3D-Modellen, die (noch) nicht realistisch wirken.
Julian möchte sich eine spätere **Veröffentlichung** offenhalten und die App ggf. an **Freunde** geben – Fotos
entstehen also unter sehr unterschiedlichen Bedingungen.

### Ziele
- Fotos werden am Handy automatisch **freigestellt**, zugeschnitten, ausgerichtet und optional optisch angeglichen
- Ein **„Look“** pro Outfit im Magazin-Stil, im Outfit-Tab (klein) und im eigenen Tab (groß)
- **Speichern und Teilen** des Looks als Bild über das Android-Teilen-Menü
- Bestehende Fotos lassen sich nachträglich freistellen

### Nicht-Ziele (jetzt)
KI-generierte Produktbilder · Freistellen über einen Backend-Dienst · mehrere wählbare Untergründe ·
Mehrbenutzer/Freunde-Registrierung · Veröffentlichung · realistische 3D-Modelle

### Anti-Ziele
- Ein leeres oder kaputtes Bild bzw. ein Absturz, weil das Freistellen scheitert
- Eine einfrierende Oberfläche, während das Modell rechnet
- Abhängigkeiten, deren Lizenz eine Veröffentlichung blockiert (AGPL, nur nicht-kommerziell)
- Fotos, die zum Freistellen das Gerät verlassen

## 2. Ansätze (entschieden: A mit frei nutzbarem Modell)

| | Ansatz | Abwägung |
|---|---|---|
| **A ✔** | KI-Freistellen im Browser mit Apache-/MIT-lizenziertem Modell + Rückfallebenen | kostenlos, privat, offline nach erstem Laden; einmaliger Modell-Download, einige Sekunden pro Foto |
| B | Freistell-Dienst über Backend (remove.bg, Photoroom …) | beste Qualität, aber Kosten pro Bild, API-Schlüssel, Fotos verlassen das Gerät |
| C | Klassisch ohne KI (Farbe/Kontrast) | klein, aber unzuverlässig bei Mustern, Schatten, ähnlichen Farben |

Ausgeschlossen wegen Lizenz: `@imgly/background-removal` (AGPL), BRIA RMBG (nur nicht-kommerziell).
B bleibt als spätere zweite Option hinter derselben Schnittstelle möglich.

## 3. Foto-Voraussetzung für Nutzer

Das Teil liegt **flach auf dem Boden** und wird **von oben** fotografiert. Licht, Boden und Winkel dürfen variieren.
Die App zeigt beim Fotografieren einen kurzen Hinweis dazu.

## 4. Freistell-Kette (am Handy, in einem Web Worker)

```
Foto (Kamera/Galerie)
 → verkleinern (wie V1: max. 1200 px, JPEG) ......... Original, wird wie bisher gespeichert
 → Segmentierungs-Modell → Maske (0–1 pro Pixel)
 → Maske säubern: Schwelle, größte zusammenhängende Fläche behalten, Kante leicht weich
 → Qualitätsprüfung (siehe unten)
 → zuschneiden auf das Teil + kleiner Rand
 → ausrichten je Kategorie (siehe unten)
 → optional „Automatisch verbessern“: Helligkeit/Kontrast/Weißabgleich sanft angleichen
 → Freisteller als WebP mit Transparenz (max. 1000 px lange Seite)
 → Vorschau: Übernehmen · Drehen (±90°, ±5°) · Ohne Freistellen · Neu fotografieren
```

**Modell:** IS-Net general-use (Apache-2.0) oder BiRefNet-lite (MIT). Welches, entscheidet ein kurzer Vergleich mit
~10 echten Fotos (Qualität, Größe, Dauer am S23). Laufzeit: ONNX Runtime Web oder Transformers.js (MIT/Apache).
Lizenz und Größe der konkreten Modelldatei werden vor dem Einbau an der Originalquelle geprüft und in
`THIRD_PARTY_NOTICES.md` festgehalten.

**Modell laden:** erst beim ersten Freistellen, mit Fortschrittsanzeige; danach im Browser-Cache (Cache API),
also auch offline. Die Datei wird von einer festen, versionierten Adresse geladen (genaue Quelle: Builder-Entscheidung,
siehe Abschnitt 10).

**Ausrichten je Kategorie** (Hauptachse der Maske bestimmen):
- Oberteil, Jacke, Unterteil: lange Achse senkrecht
- Schuhe: lange Achse waagerecht
- Schmuck: nicht drehen
- Nur korrigieren, wenn die Abweichung unter 30° liegt; größere Winkel deuten auf ein bewusst gelegtes Teil
  oder eine falsche Maske hin und bleiben unverändert

**Qualitätsprüfung** – das Ergebnis gilt als „unsicher“, wenn
- die freigestellte Fläche < 3 % oder > 90 % des Bildes ausmacht, oder
- die größte Fläche < 70 % aller erkannten Flächen ist (viele Einzelteile = Boden mit erkannt)
Bei „unsicher“ zeigt die Vorschau einen Hinweis und schlägt „Ohne Freistellen“ oder „Neu fotografieren“ vor.

**Rückfallebenen („funktioniert immer“):**
1. Freistellen klappt → Freisteller
2. Modell lädt nicht / Gerät zu schwach / Fehler → Originalfoto, zugeschnitten mit abgerundeten Ecken
3. Kein Foto → farbige Silhouette der Kategorie (wie im Mockup)
Kein Pfad endet ohne Bild, keiner blockiert das Speichern des Teils.

**Bestehende Fotos:** Profil → „Fotos freistellen“ verarbeitet alle Teile mit Foto, aber ohne Freisteller,
nacheinander mit Fortschritt; abbrechbar. Ohne Vorschau-Schritt (Ergebnis später pro Teil korrigierbar).

## 5. Datenmodell

Migration `0002_cutouts.sql`:
- `items.cutout_path text null` – Freisteller im Storage (`{user_id}/{item_id}-{timestamp}-cutout.webp`)
- `items.cutout_mode text not null default 'none'` – `cutout` | `photo` (bewusst ohne Freistellen) | `none` (noch nicht verarbeitet)
- Bucket `item-photos`: zusätzlich `image/webp` erlauben
Das Original (`photo_path`) bleibt immer erhalten, damit später mit besserem Modell neu freigestellt werden kann.
Beim Austauschen/Entfernen des Fotos wird der Freisteller mit gelöscht.

## 6. Der Look (Magazin-Stil)

**Format:** 4:5 (1080 × 1350 px beim Export) – passt in den Feed und, mit Rand, in Stories.

**Inhalt:**
- Untergrund: Beton (heller Modus) bzw. fast schwarz (dunkler Modus); Export in dem Modus, der gerade aktiv ist
- Titel oben links: Anlass + Wochentag in der Display-Schrift (z. B. „UNI MONTAG“)
- Teile mit weichem Schlagschatten, leicht gedreht
- Beschriftung je Kleidungsstück: Name + Kategorie; Schmuck ohne Beschriftung

**Layout-Logik** – reine, getestete Funktion in `src/domain/look/`:
`composeLook(outfit, seed) → { title, placements: [{ itemId, slot, x, y, width, height, rotation, caption? }] }`
- Wenige Vorlagen, gewählt nach: mit/ohne Jacke × wenig (≤ 2) / viel Schmuck
- Mit Jacke liegt sie hinter dem Oberteil (versetzt)
- Schmuck gesammelt in einer Ecke
- Drehwinkel klein (± 3–10°), aus dem Seed – Seed = Outfit-Schlüssel, damit dasselbe Outfit immer gleich aussieht
- Koordinaten relativ (0–1), damit dieselbe Komposition klein und groß gezeichnet werden kann
- Seitenverhältnis des Teils wird respektiert (in die Fläche einpassen, nicht verzerren)

**Zeichnen:** ein Renderer auf Canvas 2D für App-Anzeige und Export, damit das geteilte Bild exakt so aussieht
wie in der App. Schriften werden vor dem Zeichnen geladen (`document.fonts`).

**Wo:**
- Outfit-Tab: Vorschlagskarte zeigt den Look klein statt der vier Vorschaubilder
- Tab „Look“ (ersetzt „3D“): großer Look des gewählten Outfits (sonst erster Vorschlag), darunter „Teilen“ und „Speichern“
- Button in der Karte heißt „Look ansehen“ statt „In 3D ansehen“

**Teilen/Speichern:** Bild als PNG erzeugen; „Teilen“ über `navigator.share` mit Datei (Android Chrome),
„Speichern“ als Download. Wo Teilen mit Datei nicht geht, wird nur „Speichern“ angeboten.

## 7. 3D

Die 3D-Ansicht samt three.js wird entfernt (Code bleibt in der Git-Historie). Die Notiz zu realistischem 3D
(V1-Design, Abschnitt 11) bleibt als „Später“ bestehen.

## 8. Architektur / Andockstellen

```
src/domain/look/        composeLook (rein, TDD), Vorlagen
src/lib/cutout/         Freistell-Kette: worker.ts (Modell), mask.ts (rein, TDD: säubern, Qualität, Achse, Zuschnitt), pipeline.ts
src/data/photosRepo.ts  + Freisteller hochladen/löschen
src/features/look/      LookCanvas (Renderer), LookPage, Teilen/Speichern
src/features/wardrobe/  PhotoPicker → Vorschau mit Korrektur
```
`BackgroundRemover`-Schnittstelle (`removeBackground(image) → mask`): heute das Browser-Modell, später optional ein Backend-Dienst.
Weitere Untergründe, Vorlagen oder Formate docken in `domain/look/` an.

## 9. Tests

- TDD: `composeLook` (deterministisch pro Seed, alle Teile im Bild, keine Verzerrung, Vorlagenwahl), Masken-Helfer
  (größte Fläche, Qualitätsprüfung, Hauptachse/Winkel, Zuschnitt) mit kleinen synthetischen Masken
- Manuell/Browser: Freistellen mit ~10 echten Fotos von Julian (Hoodie, Hose, Timberlands, Kette, Uhr, gemustertes Teil,
  helles Teil auf hellem Boden), Dauer am S23, Rückfallebenen (Modell offline nicht verfügbar), Teilen am S23

## 10. Entscheidungen von Claude (bitte prüfen)

- 3D wird entfernt statt versteckt
- Format 4:5 für App und Export
- Freisteller als WebP mit Transparenz, max. 1000 px
- „Automatisch verbessern“ standardmäßig an, pro Foto abschaltbar
- Ausrichten nur bei Abweichung < 30°
- Schwellen der Qualitätsprüfung (3 % / 90 % / 70 %) als Startwerte in einer Konfigurationsdatei
- Bestehende Fotos werden über einen Button im Profil nachträglich freigestellt
- Export im gerade aktiven Hell/Dunkel-Modus

**Dem Builder überlassen:** genaue Modellwahl nach dem Vergleich und die Ladequelle der Modelldatei (z. B. versionierte
Hugging-Face-URL oder eigener Storage-Bucket), Feinheiten der Vorlagen, Schattenstärke, Beton-Textur.
