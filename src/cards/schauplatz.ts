import { t } from '../i18n';
import { parseKartenbasis, parseText, parseZahl } from '../model/keys';
import { untertitelMitRang, type Kartendefinition, type Renderkontext } from '../registry';
import { pruefeSchauplatz } from '../regeln/richtwerte';
import { SCHAUPLATZTYPEN, normalisiereTyp } from '../regeln/typen';
import type { Roh, Schauplatz } from '../types';
import { faehigkeiten, kartenbeschreibung, kopfzeile } from '../ui/primitives';

/**
 * Schauplatz.
 *
 * Wertekasten laut SRD, Abschnitt "Wertekästen von Schauplätzen": Name, Rang,
 * Typ, Beschreibung, Anregungen, Schwierigkeitsgrad, mögliche Gegner*innen
 * und Merkmale. Trefferpunkte, Stress und Kampfpunkte gibt es hier bewusst
 * nicht; der Kartentyp lässt die entsprechenden Methoden einfach weg.
 */

export const SCHAUPLATZ_VORLAGE = `art: schauplatz
name: 
rang: 1
typ: 
beschreibung: 
anregungen: 
schwierigkeitsgrad: 
moegliche_gegner: 
faehigkeiten:
  - name: 
    art: 
    text: 
`;

export const schauplatz: Kartendefinition<Schauplatz> = {
	art: 'schauplatz',
	anzahlbar: false,
	bezeichnung: () => t('karte.schauplatz'),

	erkennen: (roh: Roh) => {
		if ('tp' in roh || 'stress' in roh || 'angriff' in roh || 'ziele_taktiken' in roh) {
			return false;
		}
		if ('anregungen' in roh || 'moegliche_gegner' in roh) return true;

		const typ = normalisiereTyp(parseText(roh.typ));
		return typ !== undefined && (SCHAUPLATZTYPEN as readonly string[]).includes(typ);
	},

	lesen: (roh: Roh) => {
		const basis = parseKartenbasis(roh);
		if (!basis) return undefined;
		return {
			art: 'schauplatz',
			...basis,
			anregungen: parseText(roh.anregungen),
			moegliche_gegner: parseText(roh.moegliche_gegner),
		};
	},

	untertitel: (karte) => untertitelMitRang(karte.rang, karte.typ),
	beschreibung: (karte) => karte.beschreibung ?? '',

	rendern: (ctx: Renderkontext<Schauplatz>) => {
		const werte = ctx.karte;

		kartenbeschreibung(ctx, werte.beschreibung);
		kopfzeile(ctx, [
			{ bezeichnung: t('feld.schwierigkeitsgrad'), wert: werte.schwierigkeitsgrad },
			{ bezeichnung: t('feld.anregungen'), wert: werte.anregungen },
			{ bezeichnung: t('feld.moeglicheGegner'), wert: werte.moegliche_gegner },
		]);
		faehigkeiten(ctx, werte.faehigkeiten);
	},

	hinweise: (karte) => pruefeSchauplatz(karte),

	vorlage: () => SCHAUPLATZ_VORLAGE,
};
