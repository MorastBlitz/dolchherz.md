import { normalisiereTyp } from './typen';

/**
 * Kampfpunkte je Gegner*in.
 *
 * SRD, Abschnitt "Ausgewogene Begegnungen erschaffen":
 * 1 Punkt für Soziale und Unterstützungs-Gegner*innen, 2 für Horden,
 * Fernkampf-, Leichtfuß- und Standard-Gegner*innen, 3 für Anführer*innen,
 * 4 für Schwergewichte, 5 für Solo-Gegner*innen.
 *
 * Lakaien werden nicht hier geführt: sie kosten 1 Punkt je Gruppe in
 * Größe der Spielrunde und werden in `berechneKampfpunkte` gebündelt.
 */
export const KAMPFPUNKTE_JE_TYP: Record<string, number> = {
	Sozial: 1,
	Unterstützung: 1,
	Horde: 2,
	Fernkampf: 2,
	Leichtfuß: 2,
	Standard: 2,
	'Anführer*in': 3,
	Schwergewicht: 4,
	Solo: 5,
};

export type Anpassung = {
	id: string;
	bezeichnung: string;
	wert: number;
};

/** Anpassungen des Budgets laut SRD. */
export const ANPASSUNGEN: Anpassung[] = [
	{ id: 'leichter', bezeichnung: 'Leichterer oder kürzerer Kampf', wert: -1 },
	{ id: 'zwei-solo', bezeichnung: 'Zwei oder mehr Solo-Gegner*innen', wert: -2 },
	{
		id: 'schadensbonus',
		bezeichnung: 'Allen gegnerischen Schadenswürfen +1W4 (oder statisch +2)',
		wert: -2,
	},
	{ id: 'niedrigerer-rang', bezeichnung: 'Gegner aus einem niedrigeren Rang', wert: 1 },
	{
		id: 'ohne-schwere',
		bezeichnung: 'Keine Schwergewichte, Horden, Anführer*innen oder Solo',
		wert: 1,
	},
	{ id: 'haeerter', bezeichnung: 'Härterer oder längerer Kampf', wert: 2 },
];

/** Kampfpunkte-Budget: (3 × Anzahl SC) + 2 plus gewählte Anpassungen. */
export function budget(anzahlSC: number, aktiveAnpassungen: string[] = []): number {
	const anpassung = ANPASSUNGEN.filter((eintrag) =>
		aktiveAnpassungen.includes(eintrag.id)
	).reduce((summe, eintrag) => summe + eintrag.wert, 0);
	return 3 * anzahlSC + 2 + anpassung;
}

export type Begegnungsposten = {
	typ?: string;
	anzahl: number;
};

export type Kampfpunkteergebnis = {
	punkte: number;
	/** Anzahl der Lakaien in der Begegnung. */
	lakaien: number;
};

/**
 * Summiert die Kampfpunkte einer Begegnung.
 * Lakaien kosten 1 Punkt je Gruppe in Größe der Spielrunde, aufgerundet.
 */
export function berechneKampfpunkte(
	posten: Begegnungsposten[],
	anzahlSC: number
): Kampfpunkteergebnis {
	let punkte = 0;
	let lakaien = 0;

	for (const eintrag of posten) {
		const typ = normalisiereTyp(eintrag.typ);
		if (!typ) continue;
		if (typ === 'Lakai') {
			lakaien += eintrag.anzahl;
			continue;
		}
		punkte += (KAMPFPUNKTE_JE_TYP[typ] ?? 0) * eintrag.anzahl;
	}

	return {
		punkte: punkte + Math.ceil(lakaien / Math.max(1, anzahlSC)),
		lakaien,
	};
}
