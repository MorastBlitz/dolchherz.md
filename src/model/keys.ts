import type { Angriff, Faehigkeit, Roh } from '../types';

/**
 * Aufbereitung der Rohdaten.
 *
 * Die eingebauten Daten liegen bereits in der kanonischen Form vor. Diese
 * Datei normalisiert trotzdem jeden Datensatz, damit auch abweichende
 * Bestände funktionieren: englische Wertekästen, Zahlen statt Zeichenketten
 * und in Textfeldern versteckte Angaben wie Countdown und Erzählteil.
 */

/** Schreibvarianten fremder Datenbestände (u.a. englische Wertekästen). */
const SCHLUESSEL_ALIASE: Record<string, string> = {
	tier: 'rang',
	rank: 'rang',
	type: 'typ',
	desc: 'beschreibung',
	description: 'beschreibung',
	difficulty: 'schwierigkeitsgrad',
	motives: 'ziele_taktiken',
	motives_and_tactics: 'ziele_taktiken',
	experience: 'erfahrung',
	xp: 'erfahrung',
	hp: 'tp',
	thresholds: 'schwellen',
	features: 'faehigkeiten',
	feats: 'faehigkeiten',
	impulses: 'anregungen',
	adversaries: 'moegliche_gegner',
	potential_adversaries: 'moegliche_gegner',
	weapon: 'waffe',
	range: 'distanz',
	damage: 'schaden',
	dmg: 'schaden',
};

function istObjekt(wert: unknown): wert is Roh {
	return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

/** Getrimmter Text oder `undefined`, wenn nichts Verwertbares vorliegt. */
export function parseText(wert: unknown): string | undefined {
	return typeof wert === 'string' && wert.trim() !== '' ? wert.trim() : undefined;
}

/** Zahl aus Zahl oder Text; nicht lesbare Werte ergeben `standard`. */
export function parseZahl(wert: unknown, standard = 0): number {
	if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
	if (typeof wert === 'string') {
		const treffer = wert.match(/\d+/);
		if (treffer) return Number.parseInt(treffer[0], 10);
	}
	return standard;
}

/** Ersetzt bekannte Fremdschlüssel durch die kanonischen deutschen Feldnamen. */
export function uebersetzeSchluessel(roh: Roh): Roh {
	const ergebnis: Roh = {};
	for (const [schluessel, wert] of Object.entries(roh)) {
		const ziel = SCHLUESSEL_ALIASE[schluessel] ?? schluessel;
		if (!(ziel in ergebnis)) ergebnis[ziel] = wert;
	}
	return ergebnis;
}

/**
 * Kurze ID für ein platziertes Exemplar.
 *
 * Jede Einfügung und jede Kopie erhält eine eigene ID, damit markierte
 * Trefferpunkte und Zustände nicht zwischen zwei Wertekästen geteilt werden.
 * Drei Blöcke zu je drei Zeichen ergeben immer dieselbe Länge und rund
 * 10^14 Möglichkeiten.
 */
export function neueKartenId(): string {
	const block = () => Math.floor(Math.random() * 46656).toString(36).padStart(3, '0');
	return block() + block() + block();
}

/** Bildet einen Namen auf einen stabilen Schlüssel ab. */
export function slug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function parseRang(wert: unknown): number | undefined {
	if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
	if (typeof wert === 'string') {
		const treffer = wert.match(/\d+/);
		if (treffer) return Number.parseInt(treffer[0], 10);
	}
	return undefined;
}

/**
 * Wandelt Schwellenangaben in Zahlen um.
 * "8/14" ergibt [8, 14]; "Keine" (Lakaien) ergibt eine leere Liste.
 */
export function parseSchwellen(wert: unknown): number[] {
	const teile: unknown[] = Array.isArray(wert)
		? wert
		: typeof wert === 'string' || typeof wert === 'number'
			? [wert]
			: [];

	// "8/14" bzw. "8, 14" steht für Mittlere und Schwere Schadensschwelle.
	const zahlen = teile
		.flatMap((teil) => (typeof teil === 'string' ? teil.split(/[,/]/) : [teil]))
		.map((teil) =>
			typeof teil === 'number'
				? teil
				: Number.parseInt(String(teil).replace(/[\u2013\u2014\u2212]/g, '-').trim(), 10)
		);

	return zahlen.filter((zahl) => Number.isFinite(zahl));
}

/** Setzt ein Vorzeichen vor den Angriffsmodifikator und normalisiert Minuszeichen. */
export function formatiereBonus(wert: unknown): string | undefined {
	if (typeof wert === 'number' && Number.isFinite(wert)) {
		return wert >= 0 ? `+${wert}` : `${wert}`;
	}
	if (typeof wert !== 'string') return undefined;

	const bereinigt = wert.replace(/[\u2013\u2014\u2212]/g, '-').trim();
	if (bereinigt === '') return undefined;
	if (/^[+-]/.test(bereinigt)) return bereinigt;

	const zahl = Number.parseInt(bereinigt, 10);
	if (Number.isNaN(zahl)) return bereinigt;
	return zahl >= 0 ? `+${zahl}` : `${zahl}`;
}

/** Fügt Würfelausdruck und Schadensart zusammen, ohne die Art zu verdoppeln. */
function formatiereSchaden(schaden: unknown, schadenstyp: unknown): string | undefined {
	const ausdruck = parseText(schaden);
	if (!ausdruck) return undefined;
	const art = parseText(schadenstyp);
	if (!art || /\b(phy|mag)\b/i.test(ausdruck)) return ausdruck;
	return `${ausdruck} ${art}`;
}

/**
 * Liest den Standardangriff. Unterstützt die verschachtelte deutsche Form
 * (`angriff: { … }`) ebenso wie die flache englische Form.
 */
export function parseAngriff(roh: Roh): Angriff | undefined {
	const verschachtelt = istObjekt(roh.angriff) ? roh.angriff : undefined;
	const flacherBonus =
		typeof roh.angriff === 'number' || typeof roh.angriff === 'string' ? roh.angriff : undefined;

	const bonus = formatiereBonus(verschachtelt?.bonus ?? flacherBonus ?? roh.bonus);
	const waffe = parseText(verschachtelt?.waffe ?? roh.waffe);
	const distanz = parseText(verschachtelt?.distanz ?? roh.distanz);
	const schaden = formatiereSchaden(
		verschachtelt?.schaden ?? roh.schaden,
		verschachtelt?.schadenstyp ?? roh.schadenstyp
	);

	if (!bonus && !waffe && !distanz && !schaden) return undefined;
	return { bonus, waffe, distanz, schaden };
}

export function parseErfahrung(wert: unknown): string[] {
	if (Array.isArray(wert)) {
		return wert.map((eintrag) => String(eintrag).trim()).filter((eintrag) => eintrag !== '');
	}
	if (typeof wert === 'string') {
		return wert
			.split(',')
			.map((eintrag) => eintrag.trim())
			.filter((eintrag) => eintrag !== '');
	}
	return [];
}

export function parseSchwierigkeitsgrad(wert: unknown): string | undefined {
	if (typeof wert === 'number' && Number.isFinite(wert)) return String(wert);
	return parseText(wert);
}

const COUNTDOWN = /countdown\s*\(([^)]*)\)/i;

/**
 * Trennt die Aktionsart von einer angehängten Countdown-Angabe.
 * "Reaktion: Countdown (Schleife 1W6)" ergibt Art "Reaktion" und Countdown 6.
 */
function trenneCountdown(art: string | undefined): {
	art?: string;
	countdown?: number;
	zufaellig?: boolean;
	schleife?: boolean;
} {
	if (!art) return {};
	const treffer = art.match(COUNTDOWN);
	if (!treffer || treffer.index === undefined) return { art };

	const inhalt = treffer[1] ?? '';
	const bereinigteArt = art.slice(0, treffer.index).replace(/[:\s]+$/, '').trim();
	const schleife = /schleife/i.test(inhalt);

	const wurf = inhalt.match(/\d*[WwDd](\d+)/);
	if (wurf) {
		return {
			art: bereinigteArt || undefined,
			countdown: Number.parseInt(wurf[1], 10),
			zufaellig: true,
			schleife,
		};
	}

	const zahl = inhalt.match(/\d+/);
	return {
		art: bereinigteArt || undefined,
		countdown: zahl ? Number.parseInt(zahl[0], 10) : undefined,
		schleife,
	};
}

const KURSIV = /_([^_]+)_/g;

/**
 * Trennt den Erzählteil ab, den das SRD bei Schauplätzen als
 * "Merkmal-Fragen" führt. In den Rohdaten steht er kursiv und wird nicht
 * immer ans Textende gestellt, weshalb jedes kursive Segment mit Fragezeichen
 * sowie ein kursorsives Segment am Textende als Erzählteil gilt.
 */
function trenneErzaehltext(text: string): { text: string; frage?: string } {
	const treffer = Array.from(text.matchAll(KURSIV));
	if (treffer.length === 0) return { text };

	const fragen: string[] = [];
	const bereiche: [number, number][] = [];

	for (const fund of treffer) {
		const inhalt = fund[1].replace(/\s+/g, ' ').trim();
		const start = fund.index ?? 0;
		const ende = start + fund[0].length;
		const amTextende = text.slice(ende).trim() === '';
		if (!inhalt.endsWith('?') && !amTextende) continue;

		fragen.push(inhalt);
		bereiche.push([start, ende]);
	}

	if (fragen.length === 0) return { text };

	let rest = '';
	let zuletzt = 0;
	for (const [start, ende] of bereiche) {
		rest += text.slice(zuletzt, start);
		zuletzt = ende;
	}
	rest += text.slice(zuletzt);

	return {
		text: rest.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
		frage: fragen.join(' '),
	};
}

/** Frisst eine Fähigkeit Furcht? Entspricht der SRD-Kategorie "Furchtfähigkeit". */
function istFurchtfaehig(text: string, art?: string, name?: string): boolean {
	return (
		/furcht\s+aus\b/i.test(text) ||
		/spend\s+(?:\d+\s+)?fear\b/i.test(text) ||
		/furchtfähigkeit/i.test(art ?? '') ||
		/furchtfähigkeit/i.test(name ?? '')
	);
}

export function parseFaehigkeit(roh: Roh): Faehigkeit {
	const name = parseText(roh.name ?? roh.titel);
	const rohArt = parseText(roh.art ?? roh.type);
	const rohText = parseText(roh.text ?? roh.desc) ?? '';

	const { text, frage } = trenneErzaehltext(rohText);
	const ausArt = trenneCountdown(rohArt);

	// Bereits strukturierte Angaben haben Vorrang vor dem Textfeld.
	const countdown = typeof roh.countdown === 'number' ? roh.countdown : ausArt.countdown;
	const anwendungen =
		typeof roh.anwendungen === 'number'
			? roh.anwendungen
			: typeof roh.uses === 'number'
				? roh.uses
				: undefined;

	return {
		name,
		art: ausArt.art,
		text: text !== '' ? text : undefined,
		frage,
		countdown,
		zufaellig: ausArt.zufaellig,
		schleife: ausArt.schleife,
		anwendungen,
		furchtfaehig: istFurchtfaehig(rohText, rohArt, name) || undefined,
	};
}

export function parseFaehigkeiten(wert: unknown): Faehigkeit[] {
	if (!Array.isArray(wert)) return [];
	return wert.filter(istObjekt).map((eintrag) => parseFaehigkeit(eintrag));
}

/** Gemeinsame Felder aller Kartentypen. */
export type Kartenbasisfelder = {
	name: string;
	rang?: number;
	typ?: string;
	beschreibung?: string;
	schwierigkeitsgrad?: string;
	faehigkeiten: Faehigkeit[];
};

/**
 * Liest die gemeinsamen Felder. Liefert `undefined`, wenn kein brauchbarer
 * Name vorhanden ist; nur Einträge mit Namen kommen in die Bibliothek.
 */
export function parseKartenbasis(roh: Roh): Kartenbasisfelder | undefined {
	const name = parseText(roh.name ?? roh.titel);
	if (!name) return undefined;
	return {
		name,
		rang: parseRang(roh.rang),
		typ: parseText(roh.typ),
		beschreibung: parseText(roh.beschreibung),
		schwierigkeitsgrad: parseSchwierigkeitsgrad(roh.schwierigkeitsgrad),
		faehigkeiten: parseFaehigkeiten(roh.faehigkeiten),
	};
}
