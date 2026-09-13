import { t } from '../i18n';
import {
	parseAngriff,
	parseErfahrung,
	parseKartenbasis,
	parseSchwellen,
	parseText,
	parseZahl,
} from '../model/keys';
import { untertitelMitRang, type Kartendefinition, type Renderkontext } from '../registry';
import { pruefeGegner } from '../regeln/richtwerte';
import { normalisiereTyp } from '../regeln/typen';
import { STANDARDNAMEN } from '../regeln/zustaende';
import type { Gegner, Roh } from '../types';
import {
	angriffszeile,
	faehigkeiten,
	kartenbeschreibung,
	kopfzeile,
	statusleiste,
} from '../ui/primitives';

/**
 * Gegnerischer Charakter.
 *
 * Wertekasten laut SRD, Abschnitt "Wertekästen von Gegner*innen": Name, Rang,
 * Typ, Beschreibung, Ziele & Taktiken, Schwierigkeitsgrad, Schwellen, TP,
 * Stress, Angriffsmodifikator, Standardangriff, Erfahrung und Fähigkeiten.
 */

export const GEGNER_VORLAGE = `art: gegner
name: 
rang: 1
typ: 
beschreibung: 
ziele_taktiken: 
schwierigkeitsgrad: 
schwellen: 
tp: 
stress: 
angriff:
  bonus: 
  waffe: 
  distanz: 
  schaden: 
erfahrung: 
faehigkeiten:
  - name: 
    art: 
    text: 
`;

export const gegner: Kartendefinition<Gegner> = {
	art: 'gegner',
	anzahlbar: true,
	bezeichnung: () => t('karte.gegner'),

	erkennen: (roh: Roh) =>
		'tp' in roh ||
		'stress' in roh ||
		'schwellen' in roh ||
		'angriff' in roh ||
		'ziele_taktiken' in roh,

	lesen: (roh: Roh) => {
		const basis = parseKartenbasis(roh);
		if (!basis) return undefined;
		return {
			art: 'gegner',
			...basis,
			tp: parseZahl(roh.tp),
			stress: parseZahl(roh.stress),
			schwellen: parseSchwellen(roh.schwellen),
			ziele_taktiken: parseText(roh.ziele_taktiken),
			angriff: parseAngriff(roh),
			erfahrung: parseErfahrung(roh.erfahrung),
		};
	},

	untertitel: (karte) => untertitelMitRang(karte.rang, karte.typ),
	beschreibung: (karte) => karte.beschreibung ?? '',

	rendern: (ctx: Renderkontext<Gegner>) => {
		const werte = ctx.karte;

		kartenbeschreibung(ctx, werte.beschreibung);
		kopfzeile(ctx, [
			{ bezeichnung: t('feld.schwierigkeitsgrad'), wert: werte.schwierigkeitsgrad },
			{ bezeichnung: t('feld.ziele_taktiken'), wert: werte.ziele_taktiken },
			{
				bezeichnung: t('feld.erfahrung'),
				wert: werte.erfahrung.length > 0 ? werte.erfahrung.join(', ') : undefined,
			},
		]);
		angriffszeile(ctx, werte.angriff);
		faehigkeiten(ctx, werte.faehigkeiten);
		statusleiste(ctx, {
			tp: werte.tp,
			stress: werte.stress,
			schwellen: werte.schwellen,
		});
	},

	kampfpunkttyp: (karte) => normalisiereTyp(karte.typ),

	zustaende: () => STANDARDNAMEN,

	hinweise: (karte) => pruefeGegner(karte),

	vorlage: () => GEGNER_VORLAGE,
};
