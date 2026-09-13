# dolchherz.md

Ein [Obsidian](https://obsidian.md)-Plugin für Daggerheart-Spielleitungen: Wertekästen
für Gegner\*innen und Schauplätze auf Deutsch — durchsuchen, einfügen, würfeln und
während der Sitzung mitverfolgen.

Die Daten stammen aus dem deutschen SRD-Bestand in [`data/`](data) und werden mit dem
Plugin ausgeliefert. Eigene Wertekästen lassen sich ohne Codeänderung ergänzen.

Dieses Plugin ist eine deutsche Bearbeitung von [BeastVault](https://github.com/ly0va/beastvault).
Die Unterschiede zum Original fasst der Abschnitt *Unterschiede zu BeastVault* zusammen.

## Funktionen

- Wertekästen für Gegner\*innen und Schauplätze als Codeblock `dolchherz`
- Bibliothek mit 129 Gegner\*innen und 19 Schauplätzen aus dem SRD
- Suchdialog und Vorlagenbefehle, erzeugt aus dem Kartenregister
- Trefferpunkte, Stress, Schwellen, Anwendungen und Countdowns per Klick
- Schadensschwellen-Knöpfe: Klick markiert TP, Alt+Klick löscht sie wieder
- Würfeln per Klick auf Angriffsmodifikator oder Schadenswürfel
- Zustände, inklusive der drei Standardzustände mit Kurzregel
- Kampfpunkte in der Statusleiste, samt Budget und den Anpassungen aus dem SRD
- Anzahlsteuerung und Farbwahl je Karte
- Funktioniert auch in Canvas

## Installation

### Manuell

1. Ordner `.obsidian/plugins/dolchherz.md` im Vault anlegen
2. `main.js`, `manifest.json` und `styles.css` aus dem
   [neuesten Release](https://github.com/MorastBlitz/dolchherz.md/releases/latest)
   hineinkopieren
3. Obsidian neu starten, falls es geöffnet war
4. In Obsidian unter *Einstellungen → Community-Plugins* aktivieren

### Automatisch über BRAT

1. Das Plugin [BRAT](obsidian://show-plugin?id=obsidian42-brat) installieren
2. In den BRAT-Einstellungen *Add beta plugin* wählen
3. `MorastBlitz/dolchherz.md` eintragen und *Add plugin* wählen

Entwicklungsstand: `npm run build` erzeugt `main.js` im Projektordner.

## Verwendung

### Wertekasten einfügen

`Strg/Cmd+P` → *Einfügen aus Bibliothek: Gegner\*in* bzw. *Schauplatz*.
Alternativ das Menüband-Symbol **dolchherz.md**. Für schnellen Zugriff lohnt
sich eine Tastenkombination auf diese Befehle.

### Wertekasten von Hand schreiben

````markdown
```dolchherz
art: gegner
name: Arkane Söldnerin
rang: 1
typ: Anführer*in
beschreibung: Eine Söldnerin, die Schwertkunst und Magie kombiniert.
ziele_taktiken: Sprengen, befehlen, durchhalten
schwierigkeitsgrad: 14
schwellen: 8/14
tp: 6
stress: 3
angriff:
  bonus: "+3"
  waffe: Verstärktes Langschwert
  distanz: unmittelbar
  schaden: 1W8+4
  schadenstyp: phy/mag
erfahrung: Magisches Wissen +2
faehigkeiten:
  - name: Arkaner Stahl
    art: Passiv
    text: Der Schaden gilt als physischer und magischer Schaden.
```
````

Ein leeres Gerüst liefern die Befehle *Vorlage einfügen: …*.

> **Hinweis:** Beim Einfügen wird automatisch eine `id` vergeben. Sie bestimmt,
> welcher Wertekasten welchen markierten Zustand behält, und darf frei geändert
> werden. Fehlt sie, wird der Dateipfad samt Namen verwendet.

### Fußzeile

Am unteren Rand jedes Wertekastens erscheinen beim Überfahren die Bedienelemente:

| Symbol | Wirkung |
| --- | --- |
| − / + | Anzahl der Exemplare; jedes Exemplar verfolgt Trefferpunkte und Zustände eigenständig |
| Kopieren | Legt den Wertekasten als Codeblock in die Zwischenablage |
| Papierkorb | Entfernt den Codeblock nach Rückfrage aus der Notiz |
| Farbfeld | Farbe dieses Wertekastens |

**Kopieren** vergibt eine neue `id`. Die Kopie startet ohne markierte Werte, damit
zwei Wertekästen nie denselben Fortschritt teilen. Das Ergebnis ist ein vollständiger
Codeblock und lässt sich in jede Notiz oder auf ein Canvas einfügen.

**Löschen** arbeitet auf der Notiz, in der der Codeblock steht: Er wird samt Zäunen
entfernt. Vor dem Schreiben prüft das Plugin, ob der Zeilenbereich wirklich einen
eigenen Wertekasten umschließt, damit bei verschobenen Zeilen kein fremder Text
verloren geht. In einem Canvas gibt es keine Codeblockposition; dort meldet die
Funktion, dass sie nicht verfügbar ist.

### Felder

**Gegner\*innen** (SRD: Wertekästen von Gegner\*innen)

| Feld | Bedeutung | Beispiel |
| --- | --- | --- |
| `name` | Name des Wertekastens | `Arkane Söldnerin` |
| `rang` | Rang 1–4 | `1` |
| `typ` | Gegnertyp, siehe Kampfpunkte | `Anführer*in` |
| `beschreibung` | Kurzbeschreibung | `Eine Söldnerin …` |
| `ziele_taktiken` | Ziele & Taktiken | `Sprengen, befehlen` |
| `schwierigkeitsgrad` | Schwierigkeitsgrad aller Würfe gegen sie | `14` |
| `schwellen` | Mittlere/Schwere Schadensschwelle | `8/14` |
| `tp` | Trefferpunktfelder | `6` |
| `stress` | Stressfelder | `3` |
| `angriff` | Standardangriff, siehe unten | |
| `erfahrung` | Erfahrungen, durch Komma getrennt | `Magisches Wissen +2` |
| `faehigkeiten` | Liste von Fähigkeiten, siehe unten | |

`angriff` hat die Felder `bonus`, `waffe`, `distanz`, `schaden` und `schadenstyp`.
Schaden und Schadensart werden zusammengeführt, sofern die Art nicht schon im
Schadenstext steht.

**Schauplätze** (SRD: Wertekästen von Schauplätzen)

| Feld | Bedeutung | Beispiel |
| --- | --- | --- |
| `name`, `rang`, `typ` | wie oben; Typ ist `Erkundung`, `Sozial`, `Gelände` oder `Ereignis` | |
| `beschreibung` | Ein-Satz-Zusammenfassung | |
| `anregungen` | Anregungen des Schauplatzes | `Die Verzweifelten …` |
| `schwierigkeitsgrad` | Standard-Schwierigkeitsgrad | `12` |
| `moegliche_gegner` | Mögliche Gegner\*innen | `Maskierter Dieb, Händlerin` |
| `faehigkeiten` | Merkmale | |

Schauplätze haben weder Trefferpunkte noch Stress und zählen nicht in die
Kampfpunkte.

**Fähigkeiten**

| Feld | Bedeutung |
| --- | --- |
| `name` | Name der Fähigkeit |
| `art` | `Aktion`, `Reaktion` oder `Passiv` |
| `text` | Beschreibung, unterstützt Markdown |
| `anwendungen` | Anwendungen je Rast oder Szene, erzeugt Felder |
| `countdown` | Startwert eines Countdowns, erzeugt Felder |

Steht in `art` eine Countdown-Angabe, wird sie abgetrennt:
`Reaktion: Countdown (Schleife 1W6)` ergibt die Art `Reaktion`, einen Countdown
der Größe 6 mit zufälligem Startwert und die Schleifeneigenschaft.

Kursiv gesetzte Passagen mit Fragezeichen — im SRD die *Merkmal-Fragen* — werden
als Erzählteil abgetrennt und unter der Beschreibung kursiv dargestellt.

### Zustände

Unter jedem Wertekasten stehen die drei Standardzustände **Versteckt**,
**Festgesetzt** und **Verwundbar** als Schaltflächen; ein Kurztext erscheint beim
Überfahren. Über `+` lassen sich beliebige weitere Zustände eintragen, etwa
`Brand` oder `Abgelenkt`. Das Symbol daneben markiert einen Zustand als
*vorübergehend*, den das Ziel mit einem Zug löschen kann.

Zustände gelten je platziertem Exemplar und werden mit dem Vault gespeichert.

### Kampfpunkte

Die Statusleiste zeigt die aufsummierten Kampfpunkte der Wertekästen der
aktuellen Datei; beim Überfahren erscheint das Budget. Grundlage ist das SRD,
Abschnitt *Ausgewogene Begegnungen erschaffen*:

| Typ | Kosten |
| --- | --- |
| Sozial, Unterstützung | 1 |
| Horde, Fernkampf, Leichtfuß, Standard | 2 |
| Anführer\*in | 3 |
| Schwergewicht | 4 |
| Solo | 5 |
| Lakai | 1 je Gruppe in Größe der Spielrunde, aufgerundet |

Das Budget beträgt `(3 × Anzahl SC) + 2` und lässt sich in den Einstellungen um
die sechs Anpassungen des SRD verschieben.

### Eigene Wertekästen

In den Einstellungen einen Ordner angeben. Alle `.json`-, `.yml`- und
`.yaml`-Dateien darin werden gelesen, ebenso `dolchherz`-Codeblöcke in
`.md`-Dateien. Ein Eintrag ohne `hp` und `stress` gilt als Schauplatz.

## Einstellungen

| Einstellung | Wirkung |
| --- | --- |
| Standardfarbe | Farbe neuer Wertekästen |
| Farbwahl je Karte anzeigen | Farbwähler in der Fußzeile |
| "Massiv"-Schwelle anzeigen | Optionale Regel *Massive Schäden*, vierter Knopf |
| Anzahl der Spielcharaktere | Budget und Größe von Lakaiengruppen |
| Anpassungen des Budgets | Die sechs Verschiebungen aus dem SRD |
| Ordner für eigene Wertekästen | Zusätzliche Datenquelle |
| Duplikate ignorieren | Bei gleichem Namen gewinnt der eingebaute Wertekasten |
| Abweichungen von Richtwerten melden | Hinweis, wenn Werte vom Rang-Richtwert abweichen |

## Entwicklung

```bash
npm install
npm run dev      # baut bei Änderungen neu
npm run build    # Typprüfung und Produktionsbuild
npm run pruefen  # Datenprüfung gegen den echten Bestand
```

`npm run pruefen` führt `data/*.json` durch Kartenerkennung, Normalisierung,
Kampfpunkte und Würfelauswertung und schlägt bei jeder Abweichung fehl. Der
Prüflauf ersetzt das Obsidian-Modul durch eine Attrappe
([`scripts/obsidian-stub.ts`](scripts/obsidian-stub.ts)) und läuft daher ohne
laufende Oberfläche.

### Neuen Kartentyp ergänzen

Die Architektur ist darauf ausgelegt, dass ein weiterer Kartentyp — etwa
Abstammung, Gemeinschaft, Domäne oder Waffe — eine Datei und eine Zeile kostet.

1. **Typ anlegen** in `src/types.ts`, abgeleitet von den gemeinsamen Feldern.
2. **Karte schreiben** in `src/cards/`, indem [`Kartendefinition`](src/registry.ts)
   umgesetzt wird: `erkennen`, `lesen`, `untertitel`, `beschreibung`, `rendern`.
   Für die Darstellung stehen die Bausteine aus [`src/ui/primitives.ts`](src/ui/primitives.ts)
   bereit — `kopfzeile`, `faehigkeiten`, `statusleiste`, `zustandsleiste`,
   `textblock`, `tabelle`.
3. **Registrieren** in [`src/cards/index.ts`](src/cards/index.ts) mit einer Zeile.

Damit erscheinen automatisch die Einfüge- und Vorlagenbefehle, der Eintrag im
Suchdialog und im Menüband. Optionale Methoden steuern Zusatzverhalten:
`anzahlbar` für die Anzahlsteuerung, `kampfpunkttyp` für die Kampfpunkte,
`zustaende` für die Zustandsleiste, `hinweise` für die Richtwertprüfung und
`vorlage` für ein YAML-Gerüst.

## Unterschiede zu BeastVault

| Bereich | BeastVault | dolchherz.md |
| --- | --- | --- |
| Sprache | Englisch | Deutsch — Oberfläche, Befehle und Feldnamen |
| Codeblock | `daggerheart` | `dolchherz` |
| Datenbestand | englisches SRD | deutsche SRD-Übersetzung mit 129 Gegner\*innen und 19 Schauplätzen |
| Felder | `tier`, `type`, `desc`, `difficulty`, `weapon`, `range`, `damage`, `hp`, `stress`, `thresholds`, `attack`, `xp`, `motives`, `features` | `rang`, `typ`, `beschreibung`, `schwierigkeitsgrad`, `angriff`, `tp`, `stress`, `schwellen`, `erfahrung`, `ziele_taktiken`, `faehigkeiten` |
| Zustände | als geplant vermerkt | die drei Standardzustände plus eigene Zustände, als *vorübergehend* markierbar |
| Kampfpunkte | Anzeige in der Statusleiste | zusätzlich Budget `3 × Anzahl SC + 2` und die sechs Anpassungen des SRD |
| Richtwerte | – | Hinweis, wenn Kartenwerte vom Richtwert des Rangs abweichen |
| Fantasy Statblocks | optionale Kompatibilität | bewusst nicht enthalten, damit fremde Blöcke keine Meldung erzeugen |
| Datenprüfung | – | `npm run pruefen` prüft den echten Bestand |
| Paketverwaltung | pnpm | npm |

## Herkunft der Daten

Die Wertekästen beruhen auf dem Daggerheart-Systemreferenzdokument.

- Englisches Original: Daggerheart SRD 1.0, © Critical Role, LLC.
- Deutsche Übersetzung: [github.com/MorastBlitz/daggerheart-srd-ger](https://github.com/MorastBlitz/daggerheart-srd-ger)

Öffentliches Spielmaterial im Sinne der Darrington Press Community Gaming License:
<https://darringtonpress.com/license/>.

Die Architektur orientiert sich an [BeastVault](https://github.com/ly0va/beastvault)
(MIT) und an [DaggerForge](https://github.com/Torutu/daggerforge).

## Lizenz und Rechtliches

- **Code:** MIT, siehe [`LICENSE`](LICENSE). Der Originalhinweis von BeastVault
  (© 2025 Lev Potomkin) bleibt erhalten, diese Fassung steht unter derselben Lizenz.
- **Inhalte:** Die deutschen Wertekästen beruhen auf dem Daggerheart SRD und werden
  unter der *Darrington Press Community Gaming License* verwendet. Die Übersetzung
  wurde mit Werkzeugen zur künstlichen Intelligenz erstellt und anschließend
  redaktionell bearbeitet und geprüft.

Dieses Projekt ist ein unabhängiges Fanprojekt ohne Verbindung zu Critical Role LLC,
Darrington Press LLC oder Pegasus Spiele GmbH.

„Daggerheart™“, „Darrington Press™“, „Critical Role™“ sowie zugehörige Marken und
Logos sind Eigentum ihrer jeweiligen Rechteinhaber. Die Verwendung dieser Begriffe
erfolgt ausschließlich zur Beschreibung des zugrunde liegenden Rollenspielsystems,
der Kompatibilität und zur Kennzeichnung von Inhalten dieses Fanprojekts.
