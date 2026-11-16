# Flat-Lay-Look – Umsetzungsplan

> **Für ausführende Agenten:** Mit superpowers:executing-plans Task für Task abarbeiten, inline, ohne Subagents und ohne Worktrees, direkt auf `main`.
> Schritte nutzen Checkboxen (`- [ ]`). Nach jedem Meilenstein Julian kurz berichten (was fertig ist, wie er es am S23 testet, was als Nächstes kommt).
> An markierten Stellen (**⏸ Julian**) auf seine Eingabe warten.

**Ziel:** Fotos am Handy automatisch freistellen und Outfits als teilbaren Flat Lay im Magazin-Stil zeigen; die 3D-Ansicht entfällt.

**Architektur:** Reine, getestete Logik für Masken (`src/lib/cutout/mask.ts`, `levels.ts`) und Komposition (`src/domain/look/`). Das Modell läuft in einem Web Worker hinter der Schnittstelle `BackgroundRemover`. Ein einziger Canvas-Renderer zeichnet den Look für Anzeige und Export.

**Tech-Stack:** bestehend (React 19, Vite, TanStack Query, Supabase) + `@huggingface/transformers` (Apache-2.0) bzw. `onnxruntime-web` (MIT) für das Modell. three.js und R3F werden entfernt.

**Spec:** `docs/superpowers/specs/2026-11-16-flat-lay-look-design.md`

## Globale Vorgaben

- Nur Abhängigkeiten und Modelle mit MIT-, Apache-2.0- oder BSD-Lizenz; **kein** `@imgly/background-removal`, **kein** BRIA RMBG
- Lizenz jedes Modells wird an der Originalquelle geprüft und in `THIRD_PARTY_NOTICES.md` eingetragen, bevor es eingebaut wird
- Fotos verlassen das Gerät zum Freistellen nicht; nur Original und Ergebnis werden wie bisher in Supabase gespeichert
- Modell-Inferenz läuft ausschließlich im Web Worker (UI friert nie ein)
- Kein Pfad endet ohne Bild: Freisteller → Originalfoto mit runden Ecken → farbige Silhouette
- Freisteller: WebP mit Transparenz, längste Seite max. 1000 px, Pfad `{user_id}/{item_id}-{timestamp}-cutout.webp`
- Look-Format 4:5, Export 1080 × 1350 px; Untergrund Beton (hell) / fast schwarz (dunkel); Titel = Anlass + Wochentag
- Startwerte in `src/lib/cutout/config.ts`: Mindestfläche 3 %, Höchstfläche 90 %, größte Fläche ≥ 70 %, Ausrichten nur < 30°
- Konventionen aus V1 gelten weiter (UI deutsch, Code englisch, Kommentare deutsch, `domain/` ohne Browser-APIs, Supabase nur in `data/`)

## Review Focus

1. **Modell lädt nicht** (erstes Mal offline, Download abgebrochen, Gerät zu schwach): Das Teil lässt sich trotzdem speichern, und zwar mit dem Originalfoto → Browser-Check in Task 5 (Remover erzwungen fehlerhaft).
2. **Helles Teil auf hellem Boden** bzw. der Boden wird mit erkannt: Das Ergebnis wird als „unsicher“ markiert, statt still ein falsches Bild zu speichern → Tests in Task 1.
3. **Teil mit Foto, aber ohne Freisteller** (z. B. ältere Teile) erscheint im Look als Foto mit runden Ecken, nicht leer → Test für `pickLookSource` in Task 8.
4. **Export-Bild bleibt leer oder wirft einen Fehler**, weil Bilder von fremder Domain den Canvas „verunreinigen“ → Bilder per `fetch` → `createImageBitmap` laden; Export-Check in Task 9.
5. **Viel Schmuck** (bis 10 Stücke): Alle Stücke werden platziert, ohne sich gegenseitig zu verdecken → Test in Task 7.

---

## Meilenstein L1: Masken-Logik und Modell-Labor

### Task 1: Masken-Helfer (TDD)

**Dateien:** `src/lib/cutout/config.ts`, `src/lib/cutout/mask.ts`, `src/lib/cutout/mask.test.ts`

**Produziert:**
```ts
interface Mask { width: number; height: number; data: Uint8Array }   // 0–255 je Pixel, Zeilen hintereinander
interface Box { x: number; y: number; width: number; height: number }
const CUTOUT_CONFIG = { threshold: 128, minCoverage: 0.03, maxCoverage: 0.9, minLargestShare: 0.7,
                        maxStraighten: 30, padding: 0.04, outputMaxSide: 1000 }
binarize(mask: Mask, threshold?: number): Mask                      // 0 oder 255
largestComponent(mask: Mask): { mask: Mask; share: number }         // share = größte Fläche / gesamte Vordergrundfläche (4er-Nachbarschaft)
assessQuality(mask: Mask): { ok: boolean; coverage: number; reason?: 'too-small' | 'too-large' | 'fragmented' }
boundingBox(mask: Mask, padding?: number): Box | null               // padding relativ zur längeren Box-Seite, an Bildrand begrenzt
principalAngle(mask: Mask): number                                  // Winkel der langen Achse zur Senkrechten in Grad, (−90, 90]
straightenRotation(category: Category, angle: number): number       // Drehung, die anzuwenden ist; 0 wenn |Abweichung| ≥ maxStraighten
```
`principalAngle` über die Momente zweiter Ordnung (Kovarianz der Vordergrund-Koordinaten). `straightenRotation`: Oberteil/Unterteil/Jacke Ziel 0° (senkrecht), Schuhe Ziel 90° (waagerecht, Abweichung modulo 180 betrachten), Accessoire immer 0.

- [ ] Tests mit kleinen synthetischen Masken (Helfer `rect(w,h,x,y,rw,rh)`, `combine(...)`):
  - `binarize`: 127 → 0, 128 → 255
  - `largestComponent`: zwei Rechtecke 30 und 10 px → behält 30, `share` = 0.75
  - `assessQuality`: 2 % Fläche → `too-small`; 95 % → `too-large`; viele gleich große Flecken (größte Fläche < 70 %) → `fragmented`; ein Rechteck mit 30 % Fläche → `ok: true`
  - `boundingBox`: Rechteck bei (10,20) 30×40 ohne Padding → `{x:10,y:20,width:30,height:40}`; leere Maske → `null`; Padding am Rand wird begrenzt
  - `principalAngle`: hohes schmales Rechteck → ≈ 0; breites flaches → ≈ 90; um 20° gedrehtes hohes Rechteck → ≈ 20 (±2)
  - `straightenRotation('top', 20) === -20`; `('top', 40) === 0`; `('shoes', 80) === 10`; `('accessory', 15) === 0`
- [ ] `npx vitest run src/lib/cutout` → FAIL (Modul fehlt), implementieren → PASS, `npm test` grün
- [ ] Commit `feat(cutout): mask helpers`

### Task 2: Automatisch verbessern (TDD)

**Dateien:** `src/lib/cutout/levels.ts`, `src/lib/cutout/levels.test.ts`

**Produziert:** `autoLevels(pixels: Uint8ClampedArray, strength?: number): Uint8ClampedArray` (RGBA, neue Kopie; `strength` Standard 0.5)

Ansatz: Helligkeit (Luminanz) der Pixel mit Alpha > 0 auswerten, 1.- und 99.-Perzentil auf 0–255 strecken, Ergebnis zu `strength` mit dem Original mischen; gleiches Vorgehen pro Farbkanal für einen sanften Weißabgleich (Grauwelt-Mittelwert).

- [ ] Tests: dunkles Bild (alle Werte 40–90) → Mittelwert danach höher; Alpha bleibt unverändert; komplett transparente Pixel bleiben unverändert; `strength 0` → identisch zum Original; Bild mit Blaustich (B deutlich > R,G) → Abstand B zu R kleiner als vorher
- [ ] FAIL → implementieren → PASS, Commit `feat(cutout): auto levels`

### Task 3: Remover, Worker, Pipeline und Modell-Labor

**Dateien:** `src/lib/cutout/remover.ts`, `src/lib/cutout/worker.ts`, `src/lib/cutout/models.ts`, `src/lib/cutout/pipeline.ts`, `src/features/labor/LaborPage.tsx`, `src/App.tsx` (Route `/labor`, nicht in der Navigation), `THIRD_PARTY_NOTICES.md`

**Produziert:**
```ts
type ModelId = 'birefnet-lite' | 'isnet'
interface BackgroundRemover { id: string; load(onProgress?: (p: number) => void): Promise<void>; segment(image: ImageBitmap): Promise<Mask> }
createWorkerRemover(model: ModelId): BackgroundRemover
getRemover(): BackgroundRemover                     // Singleton mit dem gewählten Standardmodell (ACTIVE_MODEL in models.ts)
type CutoutResult =
  | { kind: 'cutout'; blob: Blob; width: number; height: number; uncertain: boolean; reason?: string; rotation: number }
  | { kind: 'failed'; error: string }
processPhoto(photo: Blob, category: Category, opts: { enhance: boolean }, remover?: BackgroundRemover,
             onProgress?: (stage: 'model' | 'segment' | 'finish', p?: number) => void): Promise<CutoutResult>
rotateBlob(image: Blob, degrees: number): Promise<Blob>   // für manuelles Drehen in der Vorschau
```
- `models.ts`: je Modell Quelle (feste Revision/URL), Eingabegröße, Normalisierung, Lizenz. BiRefNet-lite über `@huggingface/transformers` (`onnx-community/BiRefNet_lite-ONNX`, Revision fest); IS-Net general-use über `onnxruntime-web` (1024×1024, Normalisierung mean 0.5 / std 1.0 wie in rembg). Vor dem Eintrag Lizenz an der Originalquelle prüfen und in `THIRD_PARTY_NOTICES.md` notieren; bei unklarer Lizenz das Modell weglassen und als Ruling festhalten.
- Worker: lädt das Modell (Browser-Cache aktiv), meldet den Fortschritt, gibt die Maske als `Uint8Array` zurück (transferable). Fehler werden als Nachricht gemeldet, nie geworfen, ohne zu antworten.
- `processPhoto`: Ablauf laut Spec Abschnitt 4 (Maske → `binarize` → `largestComponent` → `assessQuality` → `boundingBox` → `principalAngle`/`straightenRotation` → optional `autoLevels` → WebP max. 1000 px). Jeder Fehler ergibt `{ kind: 'failed' }`, es wird nichts geworfen. `uncertain` = `!assessQuality(...).ok`.
- Labor-Seite: mehrere Fotos wählen, Modell wählen, pro Foto Original | Freisteller (auf Karomuster) | Dauer in ms | Qualitätsurteil anzeigen.

- [ ] Pakete installieren (`@huggingface/transformers`, `onnxruntime-web`), Lizenzen in `node_modules/*/package.json` prüfen
- [ ] Implementieren; `npm run build` grün, der Worker liegt als eigener Chunk vor
- [ ] Browser-Check (Playwright, lokal): `/labor` lädt ohne Konsolenfehler; mit einem Fake-Remover, der wirft, liefert `processPhoto` `kind: 'failed'`
- [ ] Commit `feat(cutout): worker remover, pipeline and model lab`, Push
- [ ] **⏸ Julian:** öffnet am S23 `…/labor`, testet beide Modelle mit ~10 echten Fotos (Hoodie, Hose, Timberlands, Kette, Uhr, gemustertes Teil, helles Teil auf hellem Boden) und schickt Screenshots plus Dauer. Ergebnis → `ACTIVE_MODEL` setzen, nicht gewähltes Modell aus `models.ts` und den Notices entfernen, Ruling ins Ledger

**→ Bericht L1**

---

## Meilenstein L2: Freisteller speichern und im Formular nutzen

### Task 4: Datenbank und Speicher

**Dateien:** `supabase/migrations/0002_cutouts.sql`, `src/domain/types.ts`, `src/data/mappers.ts` (+ Test), `src/data/photosRepo.ts`

**Produziert:**
```ts
type CutoutMode = 'cutout' | 'photo' | 'none'
// Item erweitert um: cutoutPath: string | null; cutoutMode: CutoutMode
photosRepo.uploadCutout(itemId: string, blob: Blob): Promise<string>   // Pfad ...-cutout.webp, contentType image/webp
```
- `0002_cutouts.sql`: `alter table items add cutout_path text, add cutout_mode text not null default 'none' check (cutout_mode in ('cutout','photo','none'))`; `update storage.buckets set allowed_mime_types = array['image/jpeg','image/webp'] where id = 'item-photos'`
- [ ] Mapper-Tests erweitern (`cutout_path`/`cutout_mode` ↔ `cutoutPath`/`cutoutMode`, Patch-Mapping); `makeItem` bekommt die Standardwerte `null` / `'none'`
- [ ] FAIL → implementieren → PASS, `npx tsc -b` grün
- [ ] **⏸ Julian:** führt `0002_cutouts.sql` im Supabase SQL Editor aus (Anleitung im Chat)
- [ ] Commit `feat: cutout columns and storage`

### Task 5: Vorschau und Speichern im Formular

**Dateien:** `src/features/wardrobe/PhotoPicker.tsx`, `src/features/wardrobe/CutoutPreview.tsx`, `src/features/wardrobe/useItems.ts`, `src/features/wardrobe/wardrobe.css`

**Produziert:** `PhotoChange` erweitert:
```ts
| { kind: 'replace'; blob: Blob; cutout: Blob | null; cutoutMode: CutoutMode }
| { kind: 'recut'; cutout: Blob | null; cutoutMode: CutoutMode }      // nur Freisteller neu, Original bleibt
```
- Nach Kamera/Galerie: `compressImage` → `processPhoto` mit Fortschritt („Modell wird geladen … 40 %“, „Teil wird freigestellt …“) → `CutoutPreview`
- `CutoutPreview`: Freisteller auf Karomuster; Hinweis bei `uncertain` („Das hat nicht sauber geklappt – Boden mit erkannt?“); Buttons **Übernehmen**, **↺ 90°**, **↻ 90°**, **−5°**, **+5°**, **Ohne Freistellen**, **Neu fotografieren**; Schalter „Automatisch verbessern“ (Standard an, rechnet neu). Bei `failed`: Text „Freistellen gerade nicht möglich – das Foto wird ohne Freistellen gespeichert.“ und nur **Übernehmen**/**Neu fotografieren**
- Bestehendes Teil mit Foto: Button **„Neu freistellen“** (lädt das Original, gleiche Vorschau → `recut`)
- `useSaveItem`: lädt Original und Freisteller hoch, setzt `photo_path`, `cutout_path`, `cutout_mode`; beim Austauschen/Entfernen werden alte Dateien gelöscht (Original **und** Freisteller)
- [ ] `npm run build` grün
- [ ] Browser-Check mit gemocktem Supabase: (a) Fake-Remover liefert Maske → Vorschau zeigt Freisteller, Speichern sendet zwei Uploads und `cutout_mode: 'cutout'`; (b) Fake-Remover wirft → Hinweistext, Speichern sendet ein Upload und `cutout_mode: 'photo'` (**Review Focus 1**)
- [ ] Commit `feat: cutout preview and saving`

### Task 6: Bestehende Fotos freistellen

**Dateien:** `src/features/profile/BatchCutout.tsx`, `src/features/profile/ProfilePage.tsx`

- Profil → „Fotos freistellen (N offen)“, N = Teile mit `photoPath` und `cutoutMode === 'none'`; nacheinander `processPhoto` (mit `enhance: true`) → hochladen → `cutout_mode` setzen (`cutout`, bei `failed` → `photo`); Fortschritt „3 / 12“, **Abbrechen** stoppt nach dem aktuellen Teil
- [ ] Browser-Check mit Mock (2 Teile offen → 2 Uploads, Zähler auf 0)
- [ ] Commit `feat: batch cutout for existing photos`

**→ Bericht L2**

---

## Meilenstein L3: Der Look

### Task 7: Komposition (TDD)

**Dateien:** `src/domain/look/types.ts`, `src/domain/look/templates.ts`, `src/domain/look/compose.ts`, `src/domain/look/compose.test.ts`

**Produziert:**
```ts
interface LookItem { id: string; name: string; categoryLabel: string; aspect: number /* Breite/Höhe des Bildes */ }
interface LookInput { key: string; occasion: Occasion; weekday: string /* 'Montag' */;
  top: LookItem; bottom: LookItem; shoes: LookItem; jacket: LookItem | null; accessories: LookItem[] }
interface Placement { itemId: string; slot: 'top'|'bottom'|'shoes'|'jacket'|'accessory';
  x: number; y: number; width: number; height: number; rotation: number;   // relativ 0–1 zum 4:5-Bild, rotation in Grad
  caption?: { title: string; subtitle: string; x: number; y: number } }
interface Look { title: string; placements: Placement[] }   // placements in Zeichenreihenfolge (hinten → vorne)
const LOOK_ASPECT = 4 / 5
composeLook(input: LookInput): Look
```
- 4 Vorlagen in `templates.ts`: {ohne, mit} Jacke × {≤ 2, > 2} Schmuck; jede Vorlage = Felder (Rechtecke relativ) je Slot + Schmuckbereich + Beschriftungspositionen, angelehnt an Mockup C (Titel oben links, Oberteil oben rechts, Unterteil links, Schuhe unten rechts)
- Teil wird mit seinem `aspect` in sein Feld eingepasst und zentriert (nicht verzerrt)
- Drehung aus einem Zufall mit Startwert = Hash von `key` (`seededRng` aus `domain/random.ts`): Kleidung ±3–10°, Schmuck ±15°
- Schmuck: Raster im Schmuckbereich, Spalten = ceil(sqrt(n)), Zellen gleich groß
- Reihenfolge: Jacke, Unterteil, Oberteil, Schuhe, Schmuck
- `title` = `${OCCASION_LABELS[occasion]} ${weekday}` (z. B. „Uni Montag“); Groß-/Kleinschreibung macht der Renderer
- Beschriftung nur für Kleidung: `title` = Name, `subtitle` = Kategorie

- [ ] Tests: gleicher `key` → identisches Ergebnis, anderer `key` → mindestens eine Drehung anders; mit Jacke liegt `jacket` vor `top` in `placements`, ohne Jacke keine `jacket`-Platzierung; jedes Rechteck innerhalb [0.01, 0.99]; Seitenverhältnis in Pixeln (`width*4 / (height*5)`) = `aspect` ± 1 %; Kleidungsdrehungen mit Betrag zwischen 3 und 10; Titel „Uni Montag“; Beschriftungen nur für Kleidung; **10 Schmuckstücke → 10 Platzierungen, paarweise ohne Überlappung der ungedrehten Rechtecke** (Review Focus 5); 2 vs. 3 Schmuckstücke wählen unterschiedliche Vorlagen
- [ ] FAIL → implementieren → PASS, Commit `feat(domain): look composition`

### Task 8: Renderer und Look-Tab (3D entfernen)

**Dateien:** `src/features/look/lookSource.ts` (+ Test), `src/features/look/renderLook.ts`, `src/features/look/useLookImages.ts`, `src/features/look/LookCanvas.tsx`, `src/features/look/LookPage.tsx`, `src/features/look/look.css`, `src/features/outfit/SuggestionCard.tsx`, `src/ui/BottomNav.tsx`, `src/ui/theme.ts`, `src/App.tsx`; löschen: `src/features/viewer3d/**`, Pakete `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

**Produziert:**
```ts
pickLookSource(item: Item): 'cutout' | 'photo' | 'silhouette'   // cutout nur bei cutoutMode 'cutout' && cutoutPath
effectiveTheme(): 'light' | 'dark'                              // in ui/theme.ts
toLookInput(s: OutfitSuggestion, occasion: Occasion, weekday: string, aspects: Map<string, number>): LookInput
renderLook(ctx: CanvasRenderingContext2D, look: Look, sources: Map<string, LookSourceImage>, theme: 'light'|'dark', widthPx: number): void
type LookSourceImage = { kind: 'cutout' | 'photo'; image: ImageBitmap } | { kind: 'silhouette'; item: Item }
useLookImages(items: Item[]): { sources: Map<string, LookSourceImage>; aspects: Map<string, number>; ready: boolean }
```
- [ ] Test `lookSource.test.ts`: Freisteller vorhanden → `cutout`; `cutoutMode 'photo'` mit Foto → `photo`; **Foto, aber `cutoutMode 'none'` → `photo`** (Review Focus 3); kein Foto → `silhouette`. FAIL → implementieren → PASS
- [ ] `useLookImages`: Signed URL → `fetch` → `blob` → `createImageBitmap` (verhindert einen verunreinigten Canvas); Silhouetten-Seitenverhältnis 0.8 (Kleidung) bzw. 1 (Schmuck/Schuhe 1.6)
- [ ] `renderLook`: Untergrund (Beton als Verlauf + feines Rauschen aus `seededRng`; dunkel #0b0b0b mit leichtem Verlauf), Titel in `--font-display` (hell: Großbuchstaben, dunkel: kursiv), Schatten über `shadowBlur`/`shadowOffsetY`, Fotos mit runden Ecken (Clip), Silhouetten mit den Kategorie-Pfaden aus `ui/CategoryIcon` als `Path2D`, Beschriftungen in Inter; vorher `await document.fonts.load(...)`
- [ ] `LookCanvas`: zeichnet in CSS-Breite × devicePixelRatio, 4:5, mit Platzhalter, solange `ready` false ist
- [ ] `LookPage` (Route `/look`, Tab „Look“ statt „3D“, Icon anpassen): ausgewähltes Outfit, sonst erster Vorschlag, sonst Hinweis; `SuggestionCard` zeigt `LookCanvas` klein statt der Vorschaubilder, Button „Look ansehen“
- [ ] Pakete entfernen, `npm run build` grün, kein `three` mehr im Bundle (`grep -r "three" dist/assets` leer)
- [ ] Browser-Check mit Mock (hell/dunkel, mit und ohne Jacke, ein Teil ohne Foto) → Screenshots
- [ ] Commit `feat: magazine look replaces 3d view`

### Task 9: Teilen und Speichern

**Dateien:** `src/features/look/exportLook.ts`, `src/features/look/LookPage.tsx`

**Produziert:** `exportLook(look: Look, sources: Map<string, LookSourceImage>, theme: 'light'|'dark'): Promise<Blob>` (1080 × 1350, PNG, Offscreen-Canvas), `shareLook(blob: Blob, filename: string): Promise<'shared' | 'saved' | 'cancelled'>`
- „Teilen“ nur, wenn `navigator.canShare?.({ files: [file] })`; sonst nur „Speichern“ (Download über Objekt-URL); Dateiname `outfit-<anlass>-<YYYY-MM-DD>.png`; Abbruch im Teilen-Dialog ist kein Fehler
- [ ] Browser-Check mit Mock: `exportLook` liefert ein PNG 1080 × 1350 ohne SecurityError, auch mit Freisteller-Bildern von der (gemockten) Supabase-Domain (**Review Focus 4**)
- [ ] Commit `feat: share and save look`

**→ Bericht L3**

---

## Meilenstein L4: Abschluss

### Task 10: README, Hinweise, Abschlussprüfung

**Dateien:** `README.md`, `THIRD_PARTY_NOTICES.md`, `docs/screenshots/*`

- [ ] README: Funktionen (Freistellen, Look, Teilen), Architektur-Tabelle um `lib/cutout` und `domain/look` ergänzen, 3D-Abschnitt entfernen, neue Screenshots, Hinweis auf `THIRD_PARTY_NOTICES.md`, Foto-Tipp („flach auf den Boden, von oben“)
- [ ] `npm test`, `npm run lint`, `npm run build` grün
- [ ] Commit `docs: readme for flat-lay look`, Push

**→ Abschlussbericht**
