import { roll } from '@airjp73/dice-notation';

/**
 * Würfelausdrücke in Daggerheart-Notation, einschließlich der deutschen
 * Schreibweise "1W8+4" und "3W20".
 *
 * Aufbau: optionaler Würfelanzahl, Würfelkennung (W/d/D), Seitenzahl,
 * optional weitere Würfelterme, optionaler flacher Modifikator.
 */
const WUERFEL_KERN =
	'\\d*[WwDd]\\d+(?:\\s*[+-]\\s*\\d*[WwDd]\\d+)*(?:\\s*[+-]\\s*\\d+)?';

/** Globales Muster zum Auffinden von Würfelausdrücken in Fließtext. */
export const WUERFEL_MUSTER = new RegExp(`(${WUERFEL_KERN})`, 'g');

/** True, wenn der gesamte Text ein einzelner Würfelausdruck ist. */
export function istWurf(text: string): boolean {
	return new RegExp(`^${WUERFEL_KERN}$`).test(text.trim());
}

/**
 * Bringt einen Würfelausdruck in die Notation der Würfelbibliothek:
 * deutsche W-Schreibweise wird zu `d`, typografische Minuszeichen zu `-`,
 * eine fehlende Würfelanzahl zu `1`.
 */
export function normalisiereWurf(text: string): string {
	return text
		.replace(/[\u2013\u2014\u2212]/g, '-')
		.replace(/\s+/g, '')
		.replace(/\b([WwDd])(\d+)/g, '1d$2')
		.replace(/(\d+)[WwDd](\d+)/g, '$1d$2');
}

export type Wurfergebnis = {
	/** Normalisierter Ausdruck, z.B. "1d20+3". */
	notation: string;
	/** Gewürfelte Summe. */
	ergebnis: number;
};

/** Würfelt einen Ausdruck und liefert Notation und Summe zurück. */
export function wuerfle(text: string): Wurfergebnis {
	const notation = normalisiereWurf(text);
	return { notation, ergebnis: roll(notation).result };
}
