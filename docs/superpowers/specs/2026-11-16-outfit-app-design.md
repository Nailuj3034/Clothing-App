# Outfit-App – Design Version 1

Stand: 16.11.2026 · Status: zur Freigabe

## 1. Worum es geht

Eine persönliche Kleiderschrank- und Outfit-App für Julian. Hauptgerät ist ein **Samsung Galaxy S23** (Chrome),
dazu Mac und Android-Tablet. Daten sind auf allen Geräten synchron, die App ist als PWA installierbar.
Sie dient dem täglichen Gebrauch, als Portfolio-Projekt und als Lernprojekt (1. Semester Medieninformatik).

**Leitlinie:** wenige Features, aber sauber gebaut. Architekturqualität geht vor Funktionsumfang.

### Ziele (V1)
- Kleiderschrank: Teile anlegen, bearbeiten, löschen, mit optionalem Foto
- Verfügbarkeit „da / weg“ mit einem Tap
- Regelbasierter Outfit-Generator mit Punkten und Begründung, mehrere Vorschläge, „Neuer Vorschlag“
- Outfit als „heute getragen“ speichern, das beeinflusst spätere Vorschläge
- Einfache 3D-Figur, eingefärbt in den Farben des Outfits, drehen und zoomen per Touch

### Nicht-Ziele (V1, aber die Architektur bereitet darauf vor)
KI-Erkennung von Fotos · Outfit-Bewertungen und Lernen daraus · Wetter-API · GLB/GLTF-Modelle und Foto-Texturen ·
weitere Kategorien und Kriterien · Offline-Bearbeitung.

### Anti-Ziele (würde als Fehlschlag gelten, auch wenn es „funktioniert“)
- Am Handy zäh oder nur mit zwei Händen bedienbar
- Fotos öffentlich erreichbar, oder API-Schlüssel mit Schreibrechten im Frontend
- Outfit-Logik mit UI oder Datenbank verwoben (dann nicht testbar und nicht erweiterbar)
- Unruhige, überladene Oberfläche

## 2. Ansätze (entschieden: A)

| | Ansatz | Abwägung |
|---|---|---|
| **A ✔** | React + Vite + TS, Supabase, Schichten `domain / data / features` | Wenig Konzepte gleichzeitig, klare Andockstellen. Offline nur lesend. |
| B | Local-first (IndexedDB + Sync) | Voll offline, aber Sync-Konflikte machen V1 deutlich größer |
| C | Next.js Full-Stack | Backend eingebaut, aber viele Konzepte ohne Nutzen für eine Client-App mit 3D |

Julian hat **A** gewählt. Das Backend für die spätere KI kommt als Supabase Edge Function dazu.

## 3. Technik

- **React 18 + TypeScript + Vite**, Routing mit React Router (4 Tabs)
- **TanStack Query** für Laden/Speichern mit Cache und sofortigem UI-Update (z. B. beim „da/weg“-Toggle)
- **Supabase:** Postgres, Auth (E-Mail + Passwort, Registrierung deaktiviert), Storage (privater Bucket)
- **React Three Fiber + drei** für 3D, lazy geladen (erst wenn der 3D-Tab geöffnet wird)
- **vite-plugin-pwa** für Manifest und Service Worker (App-Shell-Cache)
- **Vitest** für die Domain-Logik (TDD); UI wird manuell am Handy getestet
- **Hosting:** Vercel, automatisches Deployment bei Push auf GitHub
- Schriften werden über Fontsource selbst gehostet, damit sie auch in der installierten App offline verfügbar sind

`VITE_SUPABASE_URL` und der `anon`-Key stehen im Frontend. Das ist bei Supabase so vorgesehen: Der Key ist öffentlich,
den Schutz übernehmen die Row-Level-Security-Regeln (RLS) in der Datenbank. Den `service_role`-Key bekommt das Frontend nie.

## 4. Architektur

```
src/
  domain/                 reine TS-Logik, keine Imports aus React oder Supabase
    types.ts              Item, Outfit, Category, Warmth, Occasion, TempBand …
    palette.ts            feste Farbpalette (Key → Name, Hex, Rolle)
    outfit/
      generate.ts         Kandidaten bilden → filtern → bewerten → sortieren
      rules/              eine Datei pro Bewertungsregel
      config.ts           Gewichte und Schwellen (z. B. Minuspunkte für „gestern getragen“)
    *.test.ts
  data/                   einzige Stelle mit Supabase-Zugriff
    supabase.ts           Client
    itemsRepo.ts          CRUD Items, Verfügbarkeit
    photosRepo.ts         Upload, Signed URLs, Löschen
    outfitsRepo.ts        „getragen“ speichern und lesen
  features/
    auth/  wardrobe/  outfit/  viewer3d/  profile/
  ui/                     gemeinsame Bausteine (Button, Chip, BottomNav …) und Theme-Tokens
supabase/migrations/      SQL für Tabellen, RLS, Storage-Policies (versioniert im Repo)
```

Abhängigkeiten zeigen nur in eine Richtung: `features → data → domain` und `features → domain`.
`domain` hängt von nichts ab.

## 5. Datenmodell (Postgres)

**items**
| Feld | Typ | Hinweis |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → auth.users | RLS: nur eigene Zeilen |
| name | text | |
| category | text (check: top, bottom, shoes, jacket, accessory) | |
| color_primary | text | Key aus der Palette |
| color_secondary | text, nullable | |
| warmth | text (check: light, medium, warm) | |
| occasions | text[] (uni, leisure, going_out, sport) | mehrere möglich, mind. einer |
| photo_path | text, nullable | Pfad im Storage, keine URL |
| available | boolean, default true | |
| created_at, updated_at | timestamptz | |

**outfits** (ein getragenes Outfit): `id, user_id, worn_on (date), temp_band, occasion, created_at`
**outfit_items**: `outfit_id, item_id, slot (top/bottom/shoes/jacket)`, Primärschlüssel aus beiden IDs

Wird ein Teil gelöscht, bleiben vergangene Outfits erhalten. Dafür steht auf `outfit_items.item_id` die Regel
`on delete cascade`: Der Eintrag verschwindet aus dem Outfit, die Historie bleibt ansonsten bestehen.

Kategorien und Anlässe sind `text` mit Check-Constraint statt Postgres-Enum, weil sich neue Werte so leichter ergänzen lassen.

**Storage:** privater Bucket `item-photos`, Pfad `{user_id}/{item_id}-{timestamp}.jpg`. Die Storage-Policies erlauben
Zugriff nur auf den eigenen Ordner. Die Anzeige läuft über Signed URLs, die 1 Stunde gültig sind und gecacht werden.

## 6. Funktionen im Detail

### Kleiderschrank
- Liste mit Vorschaubild (Foto, sonst Farbfläche mit Kategorie-Icon), Name und Meta-Zeile, Toggle „da/weg“ (min. 44 px)
- Filter-Chips nach Kategorie; nicht verfügbare Teile sind ausgegraut, aber sichtbar
- Großer +-Button → Formular (Vollbild-Seite): Name, Kategorie, Haupt- und Zweitfarbe (Farbfelder antippen),
  Wärmegrad, Anlässe (Mehrfachauswahl), Foto
- Bearbeiten durch Antippen eines Teils; Löschen im Formular mit Bestätigung direkt in der Seite

### Foto
- „Foto hinzufügen“ öffnet ein Auswahlfenster mit „Kamera“ (`<input type=file accept=image/* capture=environment>`) oder „Galerie“ (ohne `capture`)
- Vor dem Upload wird das Bild im Browser per Canvas verkleinert: längste Seite max. 1200 px, JPEG-Qualität 0,8
  (Ziel unter ~250 KB). Dabei wird die EXIF-Ausrichtung berücksichtigt.
- Austauschen lädt eine neue Datei hoch und löscht danach die alte. „Foto entfernen“ löscht die Datei und setzt `photo_path` auf null.
- Keine Erkennung; alle Felder trägt Julian selbst ein

### Farbpalette (15 Farben, Hex-Werte legt der Builder fest)
Neutral: Schwarz, Weiß, Grau, Anthrazit, Navy, Beige · Erdig: Braun, Olive, Senf ·
Akzent kühl: Blau, Hellblau, Grün · Akzent warm: Rot, Bordeaux, Rosa.
Jede Farbe hat `key, label, hex, role (neutral | earth | accent)` und `temperature (cool | warm | none)`.

### Outfit-Generator
**Eingabe:** Temperatur-Band (Kalt <8° · Kühl 8–15° · Mild 15–22° · Warm >22°, vier große Buttons) und Anlass (ein Button).

**Ablauf (`generate(items, wornHistory, context, options)`):**
1. **Harte Filter:** nur `available`; Anlass muss in `occasions` enthalten sein; Wärmegrad muss zum Temperatur-Band passen
   (Kalt: medium/warm · Kühl: alle · Mild: light/medium · Warm: light).
   Jacke: Pflicht bei Kalt und Kühl, optional bei Mild, nicht bei Warm.
2. **Kandidaten:** alle Kombinationen aus Oberteil × Unterteil × Schuhe (× Jacke). Bei einem privaten Kleiderschrank
   ist das klein genug für vollständige Aufzählung.
3. **Ausschluss:** exakt dieselbe Kombination wie in den letzten 3 Tagen getragen.
4. **Bewertung:** Jede Regel liefert `{ points, reason? }`, die Summe ergibt den Score:
   - `colorHarmony`: neutral + alles gut; max. ein Akzent; Akzente gleicher Temperatur passen; erdig + neutral gut;
     zwei Akzente unterschiedlicher Temperatur geben Abzug
   - `warmthFit`: Bonus, wenn der Wärmegrad optimal zum Band passt (z. B. Kalt → warm)
   - `recentlyWorn`: leichter Abzug pro Teil, das heute oder gestern getragen wurde
5. **Ausgabe:** Top 3 Vorschläge, jeweils mit Score und 1–2 Sätzen Begründung aus den `reason`-Texten.
   „Neuer Vorschlag“ blättert durch die nächstbesten. Wenn alles durch ist, kommt eine Zufallsauswahl aus dem oberen Drittel.
6. Gibt es kein gültiges Outfit, nennt die App den Grund, z. B. „Keine verfügbaren Schuhe für Anlass Sport“.

Zahlen (Punkte, Abzüge, Zeitfenster) stehen in `config.ts`. Der Generator ist eine reine Funktion. Den Zufall bekommt
er als Parameter übergeben, damit die Tests deterministisch sind.

### Getragen
Der Button „Heute getragen“ speichert das Outfit mit Datum, Temperatur und Anlass. Ein zweites Speichern am selben Tag ist erlaubt.

### 3D-Ansicht
- Stilisiertes Mannequin aus Grundformen (Kapseln, Zylinder, Kugel) auf einer Bodenscheibe, weiches Licht, keine Schatten-Maps
- Pro Slot gibt es eine eigene Komponente (`Top`, `Bottom`, `Shoes`, `Jacket`), eingefärbt in der Hauptfarbe des Teils.
  Ein leerer Slot wird neutral gezeichnet.
- `OrbitControls` aus drei: mit einem Finger drehen, mit zwei Fingern zoomen (begrenzt), kein Verschieben
- Zeigt das aktuell ausgewählte Outfit; der Outfit-Vorschlag hat dafür den Button „In 3D ansehen“.
  Im 3D-Tab ohne Auswahl wird der erste Vorschlag angezeigt.
- Ziel: flüssig am S23 (`dpr` auf max. 2 begrenzt, `frameloop="demand"`)

### Profil
Theme-Wahl (System / Hell / Dunkel), Abmelden.

### PWA
Manifest mit Name, Icons und Theme-Farbe, Service Worker cached die App-Shell. Ohne Netz zeigt die App die zuletzt
geladenen Daten mit einem Hinweis an; Änderungen gehen offline nicht.

## 7. Design

- **Hell „Vice“:** heller, warmweißer Grund; Verläufe Pink → Orange → Lila; Türkis für „da“; Display-Schrift Anton
  (fett, schmal, Versalien), Text in Inter.
- **Dunkel:** reines Schwarz-Weiß; Aktionen sind weiße Flächen mit schwarzer Schrift; Farbe kommt nur von den Kleidungsstücken;
  Display-Schrift Bodoni Moda kursiv mit leichtem Schimmer.
- Nur von der Stimmung inspiriert, keine Logos, Schriften oder Artworks von GTA oder The Weeknd.
- Mobile-first: Bottom-Navigation (Schrank / Outfit / 3D / Profil), Primäraktionen im Daumenbereich, Touch-Ziele ≥ 44 px.
- Farben als CSS-Variablen (Design-Tokens), Theme per `data-theme` am `<html>`.
- Referenz-Mockup: https://claude.ai/artifact/HmMYxsTSe86cMHJDmGFpJf

## 8. Wo spätere Erweiterungen andocken

| Später | Andockstelle |
|---|---|
| KI-Erkennung | Supabase Edge Function bekommt `photo_path` und liefert Feldvorschläge zurück; das Formular füllt sie vor. Der Schlüssel liegt nur in der Function. |
| Bewertungen und Lernen | Spalte `rating` in `outfits` + neue Regel `personalPreference` in `domain/outfit/rules/` |
| Wetter-API | Setzt nur das Temperatur-Band im Kontext; der Generator bleibt unverändert |
| GLB-Modelle, Foto-Texturen | Die Slot-Komponenten in `viewer3d/` werden über ein Register (`category → Komponente`) ausgewählt; ein GLB-Loader ersetzt die Grundform |
| Neue Kategorien und Kriterien | Check-Constraint erweitern, Typ und Palette ergänzen, neue Regel-Datei |

## 9. Entscheidungen, die ich (Claude) getroffen habe – bitte prüfen

- Hauptfarbe + optionale Zweitfarbe; die Regeln bewerten nur die Hauptfarbe
- Mehrere Anlässe pro Teil; Accessoires nicht im Generator
- Login mit E-Mail + Passwort statt Magic Link
- Temperatur-Grenzen 8 / 15 / 22 °C
- Vorschläge: Top 3, „Neuer Vorschlag“ blättert weiter
- Löschen eines Teils entfernt es auch aus alten Outfits (keine Archivierung in V1)
- Fotos max. 1200 px, JPEG 0,8
- Hosting auf Vercel

## 10. Dem Builder überlassen
Exakte Hex-Werte der Palette und Theme-Tokens, Icons, genaue Regel-Gewichte (Startwerte in `config.ts`),
Komponentenstruktur innerhalb der Features, App-Icon.
