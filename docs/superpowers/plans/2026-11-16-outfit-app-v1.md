# Outfit-App V1 – Umsetzungsplan

> **Für ausführende Agenten:** Mit superpowers:executing-plans Aufgabe für Aufgabe abarbeiten, inline, ohne Subagents und ohne Worktrees.
> Die Schritte nutzen Checkboxen (`- [ ]`). Nach jedem Meilenstein Julian kurz berichten: was fertig ist, wie er es am Handy testet, was als Nächstes kommt.

**Ziel:** Eine mobile-first PWA für Kleiderschrank, Outfit-Vorschläge (regelbasiert, mit Begründung), Verlauf und einfache 3D-Figur, synchronisiert über Supabase.

**Architektur:** Drei Schichten mit Abhängigkeiten nur in eine Richtung: `features → data → domain`. `domain/` ist reines TypeScript (Typen, Palette, Outfit-Logik) und wird per TDD gebaut. `data/` ist die einzige Stelle mit Supabase-Zugriff. `features/` enthält das React-UI pro Bereich.

**Tech-Stack:** Node 22, React 18.3, TypeScript 5, Vite, React Router 6, TanStack Query 5, @supabase/supabase-js 2, three + @react-three/fiber 8 + @react-three/drei 9, vite-plugin-pwa, Vitest, Fontsource (Anton, Bodoni Moda, Inter). Hosting auf Vercel.

**Spec:** `docs/superpowers/specs/2026-11-16-outfit-app-design.md`

## Globale Vorgaben

- Mobile-first, Zielgerät Galaxy S23 / Chrome; Touch-Ziele ≥ 44 px; Primäraktionen im Daumenbereich
- UI-Texte auf Deutsch, Code und Bezeichner auf Englisch, Kommentare auf Deutsch
- `src/domain/**` importiert nichts aus React, Supabase oder dem Browser (kein `Date.now()`, kein `Math.random()`: Datum und Zufall werden übergeben)
- Nur `src/data/**` importiert `@supabase/supabase-js`
- Im Frontend stehen nur `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`, niemals der `service_role`-Key
- Fotos liegen in einem privaten Bucket `item-photos` unter `{user_id}/{item_id}-{timestamp}.jpg` und werden nur über Signed URLs (1 h) angezeigt
- Fotos werden vor dem Upload verkleinert: längste Seite max. 1200 px, JPEG-Qualität 0,8
- Farben ausschließlich über CSS-Variablen (`src/ui/tokens.css`), Theme per `data-theme="light|dark"` am `<html>`
- Nichts aus der „Später“-Liste bauen (KI, Bewertungen, Wetter, GLB, Gürtel/Cap/Mütze)
- Commits klein und mit Präfix (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), Push nach jeder Aufgabe

## Review Focus

1. **Leerer oder lückenhafter Schrank** (z. B. keine Schuhe für „Sport“): verständliche Meldung, was fehlt, statt Absturz oder leerer Seite → Test in Task 10.
2. **Alle Kombinationen in den letzten 3 Tagen getragen:** eigene Meldung statt „nichts gefunden“ → Test in Task 10.
3. **Datum in lokaler Zeit:** Wer um 23:30 in Leipzig „Heute getragen“ tippt, speichert den heutigen Tag, nicht den UTC-Tag → Test für `toLocalDateString` in Task 8.
4. **Archivierte oder nicht verfügbare Teile** tauchen nie in Vorschlägen auf, auch nicht als Schmuck → Tests in Task 8 und 11.
5. **Sport-Anlass mit Schmuck:** Beim Sport nur die Uhr, auch wenn Ketten als Standard-Set markiert sind → Test in Task 11.

---

## Meilenstein 1: Setup, Supabase, Datenmodell, Kleiderschrank

### Task 1: Projektgerüst

**Dateien:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/App.tsx`, `src/ui/tokens.css`, `src/ui/global.css`, `README.md` (Kurzfassung)

- [ ] Vite-Template `react-ts` im Repo-Root anlegen und die Pakete aus dem Tech-Stack installieren (three/fiber/drei und PWA-Plugin erst in M4/M5)
- [ ] Vitest einrichten (`npm test` = `vitest run`), `environment: 'node'` für `src/domain`
- [ ] `tokens.css`: Tokens für hell („Vice“) und dunkel (Schwarz-Weiß), Werte aus dem Mockup (`docs`-Spec Abschnitt 7). Fonts über Fontsource
- [ ] Ordner `src/domain`, `src/data`, `src/features`, `src/ui` mit je einer kurzen `README.md`-Zeile zum Zweck der Schicht
- [ ] Prüfen: `npm run build` und `npm test` laufen ohne Fehler (Vitest mit einem Platzhalter-Test)
- [ ] Commit `chore: scaffold vite react-ts project`

### Task 2: Domain-Typen und Farbpalette (TDD)

**Dateien:** `src/domain/types.ts`, `src/domain/palette.ts`, `src/domain/palette.test.ts`

**Produziert:**
```ts
type Category = 'top' | 'bottom' | 'shoes' | 'jacket' | 'accessory'
type AccessoryType = 'necklace' | 'ring' | 'bracelet' | 'watch'
type Warmth = 'light' | 'medium' | 'warm'
type Occasion = 'uni' | 'leisure' | 'going_out' | 'sport'
type TempBand = 'frost' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot'
type ColorKey = 'black'|'white'|'grey'|'anthracite'|'navy'|'beige'|'brown'|'olive'|'mustard'
              |'blue'|'lightblue'|'green'|'red'|'burgundy'|'pink'|'silver'|'gold'
interface PaletteColor { key: ColorKey; label: string; hex: string;
  role: 'neutral'|'earth'|'accent'|'metal'; temperature: 'cool'|'warm'|'none' }
interface Item { id: string; name: string; category: Category; accessoryType: AccessoryType | null;
  isCore: boolean; colorPrimary: ColorKey; colorSecondary: ColorKey | null; warmth: Warmth;
  occasions: Occasion[]; photoPath: string | null; available: boolean; archivedAt: string | null }
interface WornOutfit { id: string; wornOn: string /* YYYY-MM-DD lokal */; tempBand: TempBand;
  occasion: Occasion; itemIds: string[] }
const PALETTE: readonly PaletteColor[]
function getColor(key: ColorKey): PaletteColor
```
Dazu die deutschen Labels als `CATEGORY_LABELS`, `OCCASION_LABELS`, `WARMTH_LABELS`, `ACCESSORY_LABELS`, `TEMP_BAND_LABELS` (z. B. `frost: 'Frost <0°'`).

- [ ] Tests: `PALETTE` hat 17 Einträge mit eindeutigen Keys; neutral = black, white, grey, anthracite, navy, beige; earth = brown, olive, mustard; metal = silver, gold; `blue/lightblue/green` sind `cool`, `red/burgundy/pink` sind `warm`; jedes `hex` passt zu `/^#[0-9a-f]{6}$/i`; `getColor('navy').label === 'Navy'`
- [ ] Laufen lassen → FAIL, implementieren → PASS
- [ ] Commit `feat(domain): add types and color palette`

### Task 3: Supabase-Datenbank, Client und Login

**Dateien:** `supabase/migrations/0001_init.sql`, `src/data/supabase.ts`, `src/features/auth/LoginPage.tsx`, `src/features/auth/AuthGate.tsx`, `src/features/auth/useSession.ts`

- [ ] `0001_init.sql`: Tabellen `items`, `outfits`, `outfit_items` laut Spec Abschnitt 5 inkl. Check-Constraints
  (`accessory_type` nur bei `category = 'accessory'`, `cardinality(occasions) >= 1`), `updated_at`-Trigger, RLS auf allen drei Tabellen
  (`user_id = auth.uid()`; für `outfit_items` über das zugehörige Outfit), privater Bucket `item-photos` plus Storage-Policies
  `(storage.foldername(name))[1] = auth.uid()::text` für select, insert, update und delete
- [ ] **Julian führt aus** (Anleitung im Chat, Menüpunkte übersetzt): Supabase-Projekt anlegen (Region Frankfurt), SQL im
  „SQL Editor“ ausführen, unter Authentication → Sign In / Providers „Allow new users to sign up“ ausschalten,
  eigenen Nutzer unter Authentication → Users → „Add user“ anlegen, URL und anon-Key in `.env.local` bzw. an Claude geben
- [ ] `LoginPage`: E-Mail und Passwort, Fehlermeldung auf Deutsch. `AuthGate` zeigt die Login-Seite, solange keine Session besteht
- [ ] Prüfen: `npm run dev`, Login mit Julians Nutzer klappt, falsches Passwort zeigt eine Meldung
- [ ] Commit `feat: supabase schema, client and login`

### Task 4: App-Rahmen und Kleiderschrank (ohne Foto)

**Dateien:** `src/data/mappers.ts` (+ `mappers.test.ts`), `src/data/itemsRepo.ts`, `src/data/queryClient.ts`,
`src/ui/BottomNav.tsx`, `src/ui/Button.tsx`, `src/ui/Chip.tsx`, `src/features/wardrobe/WardrobePage.tsx`,
`src/features/wardrobe/ItemRow.tsx`, `src/features/wardrobe/ItemFormPage.tsx`, `src/features/wardrobe/ColorPicker.tsx`, `src/App.tsx`

**Produziert:**
```ts
mapItemRow(row: ItemRow): Item;  toItemRow(item: ItemInput, userId: string): ItemRowInsert
type ItemInput = Omit<Item, 'id' | 'archivedAt'>
itemsRepo.list(): Promise<Item[]>            // nur nicht archivierte
itemsRepo.listArchived(): Promise<Item[]>
itemsRepo.create(input: ItemInput): Promise<Item>
itemsRepo.update(id: string, patch: Partial<ItemInput>): Promise<Item>
itemsRepo.archive(id: string): Promise<void>;  itemsRepo.restore(id: string): Promise<void>
itemsRepo.removeForever(id: string): Promise<void>
// React-Query-Hooks in features/wardrobe/useItems.ts: useItems(), useSaveItem(), useArchiveItem()
```

- [ ] Test `mappers.test.ts`: snake_case ↔ camelCase in beide Richtungen, `accessory_type` und `color_secondary` bleiben `null`
- [ ] Routing: `/` Schrank, `/outfit`, `/3d`, `/profil`, `/teil/neu`, `/teil/:id`; Bottom-Navigation wie im Mockup
- [ ] Schrank: Filter-Chips nach Kategorie mit Anzahl, Liste mit Farbfläche und Kategorie-Icon als Vorschau, +-Button rechts unten
- [ ] Formular: Name, Kategorie, Haupt- und Zweitfarbe (Farbfelder antippen), Wärmegrad, Anlässe (Mehrfachauswahl, mindestens einer).
  Bei Accessoire zusätzlich Art und Schalter „Trage ich meistens“. „Archivieren“ mit Bestätigung direkt auf der Seite
- [ ] Prüfen: Teil anlegen, bearbeiten, archivieren, es erscheint auf einem zweiten Gerät bzw. Tab nach Neuladen
- [ ] Commit `feat: wardrobe list and item form`

**→ Bericht M1 an Julian**

---

## Meilenstein 2: Foto, Verfügbarkeit, Deployment

### Task 5: Foto aufnehmen, komprimieren, speichern

**Dateien:** `src/lib/compressImage.ts`, `src/data/photosRepo.ts`, `src/features/wardrobe/PhotoPicker.tsx`, `src/features/wardrobe/ItemThumb.tsx`

**Produziert:**
```ts
compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<Blob>
photosRepo.upload(itemId: string, blob: Blob): Promise<string>   // gibt photoPath zurück
photosRepo.remove(path: string): Promise<void>
photosRepo.signedUrl(path: string): Promise<string>              // 1 h, via React Query gecacht (staleTime 50 min)
```

- [ ] `compressImage` mit `createImageBitmap(file, { imageOrientation: 'from-image' })` + Canvas + `toBlob('image/jpeg', quality)`
- [ ] `PhotoPicker`: zwei Buttons „Kamera“ (`capture="environment"`) und „Galerie“, Vorschau, „Foto austauschen“ und „Foto entfernen“.
  Beim Austauschen erst neue Datei hochladen und speichern, dann alte löschen
- [ ] `ItemThumb`: Foto über Signed URL, sonst Farbfläche; genutzt in Liste und später in Outfit-Karten
- [ ] Prüfen am Handy: Foto mit Kamera und aus Galerie, Dateigröße im Supabase-Storage < 300 KB, Bild steht richtig herum;
  die Datei-URL ohne Signatur liefert einen Fehler (privat)
- [ ] Commit `feat: item photos with client-side compression`

### Task 6: Verfügbarkeit mit einem Tap

**Dateien:** `src/features/wardrobe/AvailabilityToggle.tsx`, `src/features/wardrobe/useItems.ts`

- [ ] `useToggleAvailability()` mit optimistischem Update (UI sofort, bei Fehler zurück und Hinweis)
- [ ] Button „da“ / „weg“ (≥ 44 px), nicht verfügbare Zeilen ausgegraut
- [ ] Prüfen: Toggle reagiert sofort; im Flugmodus wird die Änderung zurückgesetzt und ein Hinweis erscheint
- [ ] Commit `feat: one-tap availability toggle`

### Task 7: Deployment auf Vercel

**Dateien:** `vercel.json` (SPA-Rewrite auf `/index.html`)

- [ ] **Julian führt aus** (Anleitung im Chat): Vercel mit GitHub verbinden, Repo importieren, die zwei Umgebungsvariablen eintragen;
  in Supabase unter Authentication → URL Configuration die Vercel-URL als „Site URL“ eintragen
- [ ] Prüfen: App am S23 über die Vercel-URL öffnen, einloggen, Teil mit Foto anlegen; direkter Aufruf von `/profil` liefert keinen 404
- [ ] Commit `chore: vercel config`

**→ Bericht M2 an Julian**

---

## Meilenstein 3: Outfit-Generator, Getragen, Verlauf

Alle Domain-Tasks strikt per TDD: erst Test, dann FAIL sehen, dann implementieren, dann PASS.

### Task 8: Konfiguration, Datum und harte Filter

**Dateien:** `src/domain/outfit/config.ts`, `src/domain/date.ts`, `src/domain/outfit/filters.ts` (+ Tests)

**Produziert:**
```ts
const OUTFIT_CONFIG = {
  bands: { frost: { warmth: ['warm'], jacket: 'required', preferred: 'warm' },
           cold:  { warmth: ['medium','warm'], jacket: 'required', preferred: 'warm' },
           cool:  { warmth: ['light','medium','warm'], jacket: 'required', preferred: 'medium' },
           mild:  { warmth: ['light','medium'], jacket: 'optional', preferred: 'light' },
           warm:  { warmth: ['light','medium'], jacket: 'none', preferred: 'light' },
           hot:   { warmth: ['light'], jacket: 'none', preferred: 'light' } },
  recentlyWornDays: 1, recentlyWornPenalty: 8, excludeSameComboDays: 3,
  suggestionsPerPage: 3,
  accessoryLimits: { watch: 1, necklace: 2, bracelet: 3, ring: 4 }, maxAccessorySwaps: 2,
  accessoryTypesByOccasion: { sport: ['watch'] },   // andere Anlässe: alle Arten
} as const
toLocalDateString(d: Date): string          // 'YYYY-MM-DD' in lokaler Zeit
daysBetween(a: string, b: string): number   // ganze Tage zwischen zwei lokalen Datumsstrings
interface OutfitContext { tempBand: TempBand; occasion: Occasion; today: string }
usableItems(items: Item[], ctx: OutfitContext): Record<'top'|'bottom'|'shoes'|'jacket'|'accessory', Item[]>
```

- [ ] Tests `date.test.ts`: `toLocalDateString(new Date(2026, 10, 16, 23, 30)) === '2026-11-16'`; `daysBetween('2026-11-14','2026-11-16') === 2`; Monatswechsel `daysBetween('2026-10-31','2026-11-01') === 1`
- [ ] Tests `filters.test.ts`: nicht verfügbare und archivierte Teile fehlen; Teil ohne passenden Anlass fehlt;
  bei `frost` nur `warm`-Kleidung; bei `hot` keine Jacken in der Liste; Wärmegrad-Filter gilt nicht für Accessoires
- [ ] Implementieren, PASS, Commit `feat(domain): outfit config, dates and filters`

### Task 9: Bewertungsregeln

**Dateien:** `src/domain/outfit/rules/types.ts`, `colorHarmony.ts`, `warmthFit.ts`, `recentlyWorn.ts`, `index.ts` (+ je ein Test)

**Produziert:**
```ts
interface CandidateOutfit { top: Item; bottom: Item; shoes: Item; jacket: Item | null }
interface RuleContext extends OutfitContext { history: WornOutfit[] }
interface RuleResult { points: number; reason?: string }
type Rule = (o: CandidateOutfit, ctx: RuleContext) => RuleResult
const RULES: Rule[]     // [colorHarmony, warmthFit, recentlyWorn] – neue Regeln nur hier anhängen
```
Startwerte (in `config.ts` unter `colorPoints` ablegen): nur neutrale/metallische Hauptfarben +20 „Ruhige Kombination in neutralen Farben.“;
genau ein Akzent +25 „<Farbe> als einziger Farbakzent, der Rest hält sich zurück.“; erdige Farbe mit sonst nur Neutralen +5 zusätzlich;
zwei Akzente gleicher Temperatur +10; Akzente unterschiedlicher Temperatur −20; mehr als zwei Akzente −10.
`warmthFit`: +5 je Kleidungsstück mit `preferred`-Wärmegrad des Bands. `recentlyWorn`: −`recentlyWornPenalty` je Teil, das vor ≤ `recentlyWornDays` Tagen getragen wurde, Begründung nur bei Abzug.

- [ ] Tests: Navy+Beige+Schwarz → 20; Navy+Rot+Weiß → 25 mit „Rot“ in der Begründung; Rot+Blau → −20; Silber zählt neutral;
  Kalt mit Warm-Hoodie bekommt +5 für das Teil; gestern getragene Schuhe −8, vorgestern getragene 0
- [ ] Implementieren, PASS, Commit `feat(domain): scoring rules`

### Task 10: Generator und Blättern

**Dateien:** `src/domain/outfit/generate.ts` (+ Test)

**Produziert:**
```ts
interface OutfitSuggestion extends CandidateOutfit { accessories: Item[]; score: number; reasons: string[]; key: string }
type GenerateResult = { ok: true; ranked: OutfitSuggestion[] } | { ok: false; reason: string }
generate(items: Item[], history: WornOutfit[], ctx: OutfitContext, rng: () => number): GenerateResult
pageSuggestions(ranked: OutfitSuggestion[], page: number, rng: () => number): OutfitSuggestion[]
```
`key` = sortierte IDs der Kleidung (ohne Schmuck), mit `|` verbunden. Bei gleichem Score ist die Reihenfolge stabil (nach `key`).
Schmuck kommt aus Task 11; bis dahin `accessories: []`.

- [ ] Tests: vollständiges Outfit aus Minimal-Schrank; Jacke ist bei `cool` dabei und bei `warm` nicht; Sortierung nach Score absteigend;
  Kombination von vor 2 Tagen ist ausgeschlossen, von vor 4 Tagen nicht;
  **keine Schuhe für Sport** → `{ ok: false, reason: 'Keine verfügbaren Schuhe für den Anlass „Sport“.' }`;
  **Jacke Pflicht, aber keine da** → Grund nennt Jacke und Temperatur;
  **alle Kombinationen kürzlich getragen** → `reason` = 'Alle passenden Kombinationen hast du in den letzten 3 Tagen getragen.';
  `pageSuggestions` Seite 0 = Plätze 1–3, Seite 1 = 4–6; über das Ende hinaus 3 verschiedene aus dem oberen Drittel (deterministisch mit festem `rng`)
- [ ] Implementieren, PASS, Commit `feat(domain): outfit generator`

### Task 11: Schmuck auswählen

**Dateien:** `src/domain/outfit/accessories.ts` (+ Test), `generate.ts` (Aufruf ergänzen)

**Produziert:** `pickAccessories(pool: Item[], ctx: RuleContext, rng: () => number): { items: Item[]; reasons: string[] }`

Ablauf: Start = Standard-Stücke (`isCore`) aus dem Pool, deren Art für den Anlass erlaubt ist, gekürzt auf die Obergrenzen.
Dann `n = floor(rng() * (maxAccessorySwaps + 1))` Wechsel: Kandidat = Nicht-Standard-Stück einer erlaubten Art, bevorzugt am längsten
nicht getragen (Auswahl per `rng` unter den drei am längsten nicht getragenen). Ist die Art unter der Grenze, wird ergänzt,
sonst ein Standard-Stück derselben Art ersetzt. Pro Wechsel ein Begründungssatz („Heute die <Name> statt der <Name>.“ bzw. „Dazu: <Name>.“).

- [ ] Tests: Standard-Set wird übernommen; Sport → nur Uhr, obwohl Ketten `isCore` sind; nie mehr als 1 Uhr und 4 Ringe;
  nicht verfügbare oder archivierte Stücke tauchen nie auf; mit `rng = () => 0` keine Wechsel; ein Wechsel ergibt eine Begründung
- [ ] In `generate` aufrufen (einmal pro Vorschlag, nach dem Ranking der Top-Kandidaten), Begründungen anhängen
- [ ] PASS, Commit `feat(domain): jewelry selection`

### Task 12: Outfit-Seite und „Heute getragen“

**Dateien:** `src/data/outfitsRepo.ts`, `src/features/outfit/OutfitPage.tsx`, `TempBandPicker.tsx`, `OccasionPicker.tsx`,
`SuggestionCard.tsx`, `useSuggestions.ts`, `src/features/outfit/selectedOutfitStore.ts`

**Produziert:**
```ts
outfitsRepo.listRecent(days: number): Promise<WornOutfit[]>
outfitsRepo.listAll(): Promise<WornOutfit[]>
outfitsRepo.saveWorn(input: { wornOn: string; tempBand: TempBand; occasion: Occasion;
  items: { itemId: string; slot: Category }[] }): Promise<void>
outfitsRepo.remove(id: string): Promise<void>
useSelectedOutfit(): [OutfitSuggestion | null, (o: OutfitSuggestion) => void]   // für den 3D-Tab
```

- [ ] Temperatur als 3×2-Raster, Anlass als Buttonreihe; Auswahl in `localStorage` merken
- [ ] Karten mit Vorschaubildern, Score, Begründungen, Buttons „Neuer Vorschlag“, „Heute getragen“, „In 3D ansehen“; bei `ok: false` die Begründung groß anzeigen
- [ ] Nach „Heute getragen“: Erfolgshinweis, Verlauf/Vorschläge werden neu geladen (ein gerade getragenes Outfit rutscht nach hinten)
- [ ] Prüfen am Handy mit echten Teilen
- [ ] Commit `feat: outfit suggestions and wear tracking`

### Task 13: Verlauf und Archiv

**Dateien:** `src/features/outfit/HistoryList.tsx`, `src/features/profile/ProfilePage.tsx`, `src/features/profile/ArchivePage.tsx`

- [ ] Umschalter „Vorschläge | Verlauf“ im Outfit-Tab; Verlauf nach Datum (neueste zuerst), archivierte Teile mit Hinweis „archiviert“
- [ ] „Nochmal tragen“: sind Teile nicht verfügbar oder archiviert, nennt die Seite sie und fragt nach Bestätigung, bevor gespeichert wird; Eintrag löschen mit Bestätigung
- [ ] Profil → Archiv: Wiederherstellen; „Endgültig löschen“ mit Bestätigung löscht auch das Foto
- [ ] Commit `feat: history and archive`

**→ Bericht M3 an Julian**

---

## Meilenstein 4: 3D-Ansicht

### Task 14: Mannequin mit Kleidung und Schmuck

**Dateien:** `src/features/viewer3d/ViewerPage.tsx` (lazy importiert), `Mannequin.tsx`, `garments/registry.ts`,
`garments/Top.tsx`, `Bottom.tsx`, `Shoes.tsx`, `Jacket.tsx`, `garments/Jewelry.tsx`

**Produziert:**
```ts
interface GarmentProps { item: Item | null; color: string }   // color = Hex der Hauptfarbe, Fallback neutral
const GARMENT_REGISTRY: Record<'top'|'bottom'|'shoes'|'jacket', React.ComponentType<GarmentProps>>
```
Später ersetzt ein GLB-Loader einzelne Einträge im Register, ohne dass sich `Mannequin` ändert.

- [ ] Figur aus Kapseln, Zylindern und einer Kugel auf einer Bodenscheibe; weiches Licht (Hemisphere + Directional), keine Schatten-Maps
- [ ] Schmuck: Kette = dünner Torus am Hals, Armband = Torus am Handgelenk, Uhr = Torus + Scheibe, Ringe = kleine Tori an der Hand; Metallfarbe aus der Palette
- [ ] `<Canvas dpr={[1, 2]} frameloop="demand">`, `OrbitControls` ohne Verschieben, Zoom begrenzt, mit dem Theme abgestimmter Hintergrund
- [ ] Zeigt `useSelectedOutfit()`; ohne Auswahl den ersten Vorschlag, ohne Vorschlag eine neutrale Figur mit Hinweis
- [ ] Prüfen: `npm run build`, der 3D-Code liegt in einem eigenen Chunk; am S23 flüssiges Drehen und Zoomen
- [ ] Commit `feat: 3d mannequin view`

**→ Bericht M4 an Julian**

---

## Meilenstein 5: PWA, Feinschliff, README

### Task 15: Installierbar, Theme, Offline-Hinweis, README

**Dateien:** `vite.config.ts`, `public/icons/*`, `src/ui/theme.ts`, `src/ui/OfflineBanner.tsx`, `src/features/profile/ProfilePage.tsx`, `README.md`

- [ ] `vite-plugin-pwa`: Manifest (Name „Outfit“, `display: standalone`, Theme-Farbe, Icons 192/512 und maskable), App-Shell-Precache, `registerType: 'autoUpdate'`
- [ ] Theme-Wahl System / Hell / Dunkel im Profil, gespeichert in `localStorage`, setzt `data-theme`
- [ ] React Query hält die zuletzt geladenen Daten; ohne Netz zeigt `OfflineBanner` „Offline – Änderungen sind gerade nicht möglich.“
- [ ] README: Zweck, Screenshots, Architektur (Schichten-Diagramm), Setup (Supabase, `.env.local`, `npm run dev`), Tests, Deployment, „Wo Erweiterungen andocken“
- [ ] Prüfen: Lighthouse-PWA-Check ohne Fehler; am S23 „App installieren“ in Chrome, Start vom Homescreen ohne Browserleiste; `npm test` und `npm run build` grün
- [ ] Commit `feat: pwa install, theme switch, readme`

**→ Abschlussbericht an Julian**
