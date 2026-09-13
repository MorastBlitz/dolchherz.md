/**
 * Typen der Wertekästen und ihre Schreibvarianten.
 *
 * Grundlage ist das SRD, Abschnitt "Typ": zehn Gegnertypen und vier
 * Schauplatztypen. Die Zuordnung ist bewusst eine Tabelle und keine feste
 * Aufzählung, damit Kampagnen eigene Typen ergänzen können (das SRD führt
 * etwa "Welkend" als zusätzlichen Typ ein).
 */

/** Gegnertypen laut SRD. */
export const GEGNERTYPEN = [
	'Schwergewicht',
	'Horde',
	'Anführer*in',
	'Lakai',
	'Fernkampf',
	'Leichtfuß',
	'Sozial',
	'Solo',
	'Standard',
	'Unterstützung',
] as const;

/** Schauplatztypen laut SRD. */
export const SCHAUPLATZTYPEN = ['Erkundung', 'Sozial', 'Gelände', 'Ereignis'] as const;

export type Gegnertyp = (typeof GEGNERTYPEN)[number];
export type Schauplatztyp = (typeof SCHAUPLATZTYPEN)[number];

/**
 * Abweichungen zwischen Datenbestand und SRD-Schreibweise.
 * Schlüssel und Zielwert werden vor dem Vergleich vereinheitlicht.
 */
const ALIASE: Record<string, string> = {
	schwergewichte: 'Schwergewicht',
	bruiser: 'Schwergewicht',
	horden: 'Horde',
	'anführer': 'Anführer*in',
	'anführerin': 'Anführer*in',
	'anführerinnen': 'Anführer*in',
	leader: 'Anführer*in',
	lakaien: 'Lakai',
	minion: 'Lakai',
	'fernkampf-gegner': 'Fernkampf',
	ranged: 'Fernkampf',
	'leichtfüße': 'Leichtfuß',
	skulk: 'Leichtfuß',
	soziale: 'Sozial',
	social: 'Sozial',
	'solo-gegner': 'Solo',
	'standard-gegner': 'Standard',
	'unterstützungs': 'Unterstützung',
	'unterstutzungs': 'Unterstützung',
	'unterstützungs-gegner': 'Unterstützung',
	support: 'Unterstützung',
	erkundungen: 'Erkundung',
	exploration: 'Erkundung',
	gelande: 'Gelände',
	terrain: 'Gelände',
	ereignisse: 'Ereignis',
	event: 'Ereignis',
};

/**
 * Vereinheitlicht eine Typangabe: Kleinschreibung, Gender-Stern entfernt,
 * typografische Bindestriche normalisiert, Zusatz "Gegner*innen" abgetrennt.
 */
export function vereinheitlicheTyp(wert: string): string {
	return wert
		.trim()
		.toLowerCase()
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/\*/g, '')
		.replace(/\s*\([^)]*\)\s*$/, '')
		.replace(/\s*gegner(?:in|innen|s)?$/, '')
		.replace(/[\s-]+$/, '')
		.replace(/\s+/g, ' ');
}

const ZUORDNUNG: Record<string, string> = (() => {
	const zuordnung: Record<string, string> = {};
	for (const typ of [...GEGNERTYPEN, ...SCHAUPLATZTYPEN]) {
		zuordnung[vereinheitlicheTyp(typ)] = typ;
	}
	for (const [alias, ziel] of Object.entries(ALIASE)) {
		zuordnung[vereinheitlicheTyp(alias)] = ziel;
	}
	return zuordnung;
})();

/** Bildet eine beliebige Typangabe auf einen SRD-Typ ab, sonst `undefined`. */
export function normalisiereTyp(wert?: string): string | undefined {
	if (!wert) return undefined;
	return ZUORDNUNG[vereinheitlicheTyp(wert)];
}

const HORDENGROESSE = /^horde\s*\(\s*(\d+)\s*\/\s*(?:tp|hp)\s*\)\s*$/i;

/**
 * Liest die Größenangabe einer Horde aus dem Typ, z.B. "Horde (2/TP)":
 * je zwei Kreaturen steht ein Trefferpunkt zur Verfügung.
 */
export function hordenGroesse(typ?: string): number | undefined {
	if (!typ) return undefined;
	const treffer = typ.match(HORDENGROESSE);
	if (!treffer) return undefined;
	const groesse = Number.parseInt(treffer[1], 10);
	return Number.isFinite(groesse) && groesse > 0 ? groesse : undefined;
}
