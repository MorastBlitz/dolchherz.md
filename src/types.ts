/**
 * Kanonisches Datenmodell des Dolchherz Orakels.
 *
 * Die Feldnamen sind bewusst deutsch und entsprechen den Rohdaten in `data/*.json`.
 * Dadurch ist keine Übersetzungsschicht nötig. Abweichende Bezeichnungen
 * (etwa englische Importe) normalisiert `model/keys.ts` beim Einlesen.
 */

/** Ein Rohdatensatz, wie er in JSON, YAML oder einem Codeblock steht. */
export type Roh = Record<string, unknown>;

/**
 * Fähigkeit eines Gegners oder Schauplatzes.
 * Der SRD kennt Aktionen, Reaktionen und Passiv-Fähigkeiten sowie Furchtfähigkeiten.
 */
export type Faehigkeit = {
	name?: string;
	/** Aktionsart ohne Countdown-Zusatz, z.B. "Reaktion". */
	art?: string;
	/** Beschreibung; unterstützt Markdown. */
	text?: string;
	/** Erzählteil aus dem Text (SRD: "Merkmal-Fragen"). */
	frage?: string;
	/** Startwert aus "Countdown (…)", z.B. "Countdown (6)" oder "Countdown (Schleife 1W6)". */
	countdown?: number;
	/** Zufälliger Startwert: der Countdown wird zu Beginn gewürfelt. */
	zufaellig?: boolean;
	/** Schleifen-Countdown: wird nach Auslösung auf den Startwert zurückgesetzt. */
	schleife?: boolean;
	/** Anwendungen je Rast oder Szene, falls die Fähigkeit begrenzt ist. */
	anwendungen?: number;
	/** Fähigkeit kostet Furcht (SRD: "Furchtfähigkeit"). */
	furchtfaehig?: boolean;
};

/** Standardangriff eines Gegners. */
export type Angriff = {
	/** Angriffsmodifikator, stets mit Vorzeichen, z.B. "+3" oder "-1". */
	bonus?: string;
	waffe?: string;
	distanz?: string;
	/** Schadenswurf inklusive Art, z.B. "1W8+4 phy". */
	schaden?: string;
	schadenstyp?: string;
};

export type Herkunft = 'eingebaut' | 'vault';

type Kartenbasis = {
	/** Stabiler Schlüssel innerhalb der Bibliothek (Slug aus dem Namen). */
	schluessel: string;
	name: string;
	rang?: number;
	typ?: string;
	beschreibung?: string;
	schwierigkeitsgrad?: string;
	faehigkeiten: Faehigkeit[];
	herkunft: Herkunft;
	/** Originaldatensatz, damit Einfügen in den Codeblock verlustfrei bleibt. */
	roh: Roh;
};

/** Gegnerischer Charakter (SRD: "Wertekästen von Gegner*innen"). */
export type Gegner = Kartenbasis & {
	art: 'gegner';
	/** Trefferpunktfelder. */
	tp: number;
	stress: number;
	/** [Mittlere, Schwere] Schadensschwelle; leer bei Lakaien ohne Schwellen. */
	schwellen: number[];
	ziele_taktiken?: string;
	angriff?: Angriff;
	/** Erfahrungen, z.B. ["Magisches Wissen +2"]. */
	erfahrung: string[];
};

/** Schauplatz (SRD: "Wertekästen von Schauplätzen"). */
export type Schauplatz = Kartenbasis & {
	art: 'schauplatz';
	anregungen?: string;
	moegliche_gegner?: string;
};

export type Karte = Gegner | Schauplatz;

/**
 * Kartendaten ohne die Felder, die die Bibliothek verwaltet
 * (`schluessel`, `herkunft` und die Rohdaten).
 */
export type Rumpf<T extends Karte = Karte> = Omit<T, 'schluessel' | 'herkunft' | 'roh'>;

/** Pfad in den Zustandsbaum, z.B. ["a1b2", 0, "tp"]. */
export type Zustandspfad = (string | number)[];

/** Zustand einer einzelnen platzierten Karte. */
export type Instanzzustand = {
	tp?: number;
	stress?: number;
	/** Anwendungen je Fähigkeitsindex. */
	anwendungen?: Record<string, number>;
	/** Stand je Fähigkeitsindex. */
	countdown?: Record<string, number>;
	/** Gesetzte Zustände, z.B. { "Verwundbar": 1 }. */
	zustaende?: Record<string, number>;
	/** Teilmenge von `zustaende`, deren Kennzeichen "vorübergehend" gesetzt ist. */
	voruebergehend?: Record<string, number>;
};

export type Kartenzustand = {
	/** Anzahl platzierter Exemplare. */
	anzahl?: number;
	farbe?: string;
} & {
	[instanz: number]: Instanzzustand | undefined;
};

export type Einstellungen = {
	standardFarbe: string;
	farbwahlAnzeigen: boolean;
	massiveSchwelle: boolean;
	/** Anzahl der Spielcharaktere; bestimmt Budget und Lakaiengruppen. */
	anzahlSC: number;
	bibliotheksOrdner: string;
	duplikateIgnorieren: boolean;
	/** Abweichungen von den Rang-Richtwerten im Wertekasten melden. */
	richtwerteMelden: boolean;
	/** IDs der aktiven Anpassungen des Kampfpunkte-Budgets. */
	kampfpunkteAnpassungen: string[];
};

export type PluginState = {
	einstellungen: Einstellungen;
	karten: Record<string, Kartenzustand>;
};
