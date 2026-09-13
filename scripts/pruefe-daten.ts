/// <reference types="node" />

/**
 * Prüflauf für die Datenverarbeitung.
 *
 * Führt die echten Bestände aus `data/` durch Kartenerkennung, Normalisierung,
 * Kampfpunkte und Würfelauswertung und meldet jede Abweichung. Start über
 * `npm run pruefen`.
 */

import GEGNER_DATEN from '../data/gegner.json';
import SCHAUPLAETZE_DATEN from '../data/schauplaetze.json';
import { registriereKarten } from '../src/cards';
import { normalisiereWurf, wuerfle } from '../src/dice';
import { entferneCodeblock, istCodeblockEnde, istWertekastenAnfang } from '../src/model/library';
import { neueKartenId, uebersetzeSchluessel } from '../src/model/keys';
import { Kartenregister } from '../src/registry';
import { Zustandsspeicher } from '../src/state';
import type { PluginState } from '../src/types';
import { berechneKampfpunkte, budget, KAMPFPUNKTE_JE_TYP } from '../src/regeln/kampfpunkte';
import { hordenGroesse, normalisiereTyp } from '../src/regeln/typen';

const gegnerDaten = GEGNER_DATEN as unknown as Record<string, unknown>[];
const schauplatzDaten = SCHAUPLAETZE_DATEN as unknown as Record<string, unknown>[];

const fehler: string[] = [];
const zeilen: string[] = [];

function pruefe(bedingung: boolean, meldung: string): void {
	if (!bedingung) fehler.push(meldung);
}

function gleich(erwartet: unknown, gefunden: unknown, was: string): void {
	const a = JSON.stringify(erwartet);
	const b = JSON.stringify(gefunden);
	if (a !== b) fehler.push(`${was}: erwartet ${a}, gefunden ${b}`);
}

function finde<K extends Record<string, unknown>>(liste: K[], name: string): K {
	const treffer = liste.find((eintrag) => eintrag.name === name);
	if (!treffer) throw new Error(`Prüfdatensatz "${name}" nicht gefunden`);
	return treffer;
}

const register = new Kartenregister();
registriereKarten(register);

// --- Erkennung ------------------------------------------------------------

let geleseneGegner = 0;
const unbekannteGegnertypen = new Map<string, number>();

for (const roh of gegnerDaten) {
	const kanonisch = uebersetzeSchluessel(roh);
	const gelesen = register.lese(kanonisch);
	if (!gelesen) {
		fehler.push(`Gegner nicht gelesen: ${String(roh.name)}`);
		continue;
	}
	if (gelesen.definition.art !== 'gegner') {
		fehler.push(`Gegner als "${gelesen.definition.art}" erkannt: ${String(roh.name)}`);
		continue;
	}
	geleseneGegner++;

	const typ = normalisiereTyp(kanonisch.typ as string | undefined);
	if (typ === undefined) {
		const rohTyp = String(kanonisch.typ);
		unbekannteGegnertypen.set(rohTyp, (unbekannteGegnertypen.get(rohTyp) ?? 0) + 1);
	}
}

let geleseneSchauplaetze = 0;
const unbekannteSchauplatztypen = new Map<string, number>();

for (const roh of schauplatzDaten) {
	const kanonisch = uebersetzeSchluessel(roh);
	const gelesen = register.lese(kanonisch);
	if (!gelesen) {
		fehler.push(`Schauplatz nicht gelesen: ${String(roh.name)}`);
		continue;
	}
	if (gelesen.definition.art !== 'schauplatz') {
		fehler.push(`Schauplatz als "${gelesen.definition.art}" erkannt: ${String(roh.name)}`);
		continue;
	}
	geleseneSchauplaetze++;

	const typ = normalisiereTyp(kanonisch.typ as string | undefined);
	if (typ === undefined) {
		const rohTyp = String(kanonisch.typ);
		unbekannteSchauplatztypen.set(rohTyp, (unbekannteSchauplatztypen.get(rohTyp) ?? 0) + 1);
	}
}

gleich(gegnerDaten.length, geleseneGegner, 'Anzahl gelesener Gegner');
gleich(schauplatzDaten.length, geleseneSchauplaetze, 'Anzahl gelesener Schauplätze');

zeilen.push(`Gegner gelesen: ${geleseneGegner}/${gegnerDaten.length}`);
zeilen.push(`Schauplätze gelesen: ${geleseneSchauplaetze}/${schauplatzDaten.length}`);

// --- Kampfpunkte-Typen ----------------------------------------------------

const offeneGegnertypen = [...unbekannteGegnertypen.entries()];
const offeneSchauplatztypen = [...unbekannteSchauplatztypen.entries()];

for (const [typ, anzahl] of offeneGegnertypen) {
	fehler.push(`Gegnertyp ohne Kampfpunkte-Zuordnung: "${typ}" (${anzahl}×)`);
}
for (const [typ, anzahl] of offeneSchauplatztypen) {
	fehler.push(`Schauplatztyp ohne Zuordnung: "${typ}" (${anzahl}×)`);
}

zeilen.push(`Kampfpunkte-Kategorien: ${Object.keys(KAMPFPUNKTE_JE_TYP).join(', ')}`);

// --- Normalisierung im Detail --------------------------------------------

const arkane = finde(gegnerDaten, 'Arkane Söldnerin');
const arkaneKarte = register.lese(uebersetzeSchluessel(arkane))?.rumpf as
	| Record<string, unknown>
	| undefined;

if (!arkaneKarte) {
	fehler.push('Arkane Söldnerin konnte nicht gelesen werden');
} else {
	gleich(1, arkaneKarte.rang, 'Arkane Söldnerin: rang');
	gleich(6, arkaneKarte.tp, 'Arkane Söldnerin: tp');
	gleich(3, arkaneKarte.stress, 'Arkane Söldnerin: stress');
	gleich([8, 14], arkaneKarte.schwellen, 'Arkane Söldnerin: schwellen');
	gleich('14', arkaneKarte.schwierigkeitsgrad, 'Arkane Söldnerin: schwierigkeitsgrad');
	gleich(['Magisches Wissen +2'], arkaneKarte.erfahrung, 'Arkane Söldnerin: erfahrung');

	const angriff = arkaneKarte.angriff as Record<string, unknown> | undefined;
	gleich('+3', angriff?.bonus, 'Arkane Söldnerin: Angriffsbonus');
	gleich('Verstärktes Langschwert', angriff?.waffe, 'Arkane Söldnerin: Waffe');
	gleich('1W8+4 phy/mag', angriff?.schaden, 'Arkane Söldnerin: Schaden');
	gleich(4, (arkaneKarte.faehigkeiten as unknown[]).length, 'Arkane Söldnerin: Fähigkeiten');
}

// Gedankenstrich-Minus und Lakaien ohne Schwellen
const lehrling = register.lese(uebersetzeSchluessel(finde(gegnerDaten, 'Assassinenlehrling')))
	?.rumpf as Record<string, unknown> | undefined;
if (!lehrling) {
	fehler.push('Assassinenlehrling konnte nicht gelesen werden');
} else {
	gleich([], lehrling.schwellen, 'Assassinenlehrling: schwellen ohne Wert');
	gleich(1, lehrling.tp, 'Assassinenlehrling: tp');
	const bonus = (lehrling.angriff as Record<string, unknown> | undefined)?.bonus;
	gleich('-1', bonus, 'Assassinenlehrling: Angriffsbonus mit Gedankenstrich');
	gleich('Lakai', (lehrling.typ as string) ?? '', 'Assassinenlehrling: Typ');
}

// Countdown aus dem Feld "art"
const libelle = register.lese(
	uebersetzeSchluessel(finde(gegnerDaten, 'Ausgewachsene Blitzlibelle'))
)?.rumpf as Record<string, unknown> | undefined;
const atem = (libelle?.faehigkeiten as Record<string, unknown>[] | undefined)?.find(
	(eintrag) => eintrag.name === 'Halluzinatorischer Atem'
);
if (!atem) {
	fehler.push('Fähigkeit "Halluzinatorischer Atem" nicht gefunden');
} else {
	gleich('Reaktion', atem.art, 'Blitzlibelle: Aktionsart ohne Countdown-Zusatz');
	gleich(6, atem.countdown, 'Blitzlibelle: Countdown');
	gleich(true, atem.zufaellig, 'Blitzlibelle: zufälliger Startwert');
	gleich(true, atem.schleife, 'Blitzlibelle: Schleife');
}

// Erzählteil bei Schauplätzen
const siedlung = register.lese(uebersetzeSchluessel(finde(schauplatzDaten, 'Abgelegene Siedlung')))
	?.rumpf as Record<string, unknown> | undefined;
if (!siedlung) {
	fehler.push('Abgelegene Siedlung konnte nicht gelesen werden');
} else {
	gleich(1, siedlung.rang, 'Abgelegene Siedlung: rang');
	gleich('Sozial', siedlung.typ, 'Abgelegene Siedlung: typ');

	const faecher = siedlung.faehigkeiten as Record<string, unknown>[];
	gleich(5, faecher.length, 'Abgelegene Siedlung: Fähigkeiten');
	pruefe(
		faecher.every((eintrag) => typeof eintrag.frage === 'string' && eintrag.frage !== ''),
		'Abgelegene Siedlung: Erzählteil nicht bei allen Fähigkeiten abgetrennt'
	);
	pruefe(
		faecher.every((eintrag) => !String(eintrag.text ?? '').includes('_')),
		'Abgelegene Siedlung: Kursivmarkierung noch im Beschreibungstext'
	);
}

// --- Würfel ---------------------------------------------------------------

gleich('1d8+4', normalisiereWurf('1W8+4'), 'W-Notation mit Modifikator');
gleich('3d20', normalisiereWurf('3W20'), 'W-Notation ohne Modifikator');
gleich('2d6+3', normalisiereWurf('2W6+3'), 'W-Notation mehrteilig');
gleich('1d20-1', normalisiereWurf('1d20\u20131'), 'Gedankenstrich als Minus');

const angriffswurf = wuerfle('1d20\u20131');
pruefe(
	angriffswurf.ergebnis >= 0 && angriffswurf.ergebnis <= 19,
	`Angriffswurf außerhalb des Erwarteten: ${angriffswurf.ergebnis}`
);
const schadenswurf = wuerfle('3W20');
pruefe(
	schadenswurf.ergebnis >= 3 && schadenswurf.ergebnis <= 60,
	`Schadenswurf außerhalb des Erwarteten: ${schadenswurf.ergebnis}`
);

// --- Horden ---------------------------------------------------------------

gleich('Horde', normalisiereTyp('Horde (2/TP)'), 'Hordentyp mit Größenangabe');
gleich(2, hordenGroesse('Horde (2/TP)'), 'Hordengröße aus dem Typ');
gleich(5, hordenGroesse('Horde (5/TP)'), 'Hordengröße fünf');
gleich(undefined, hordenGroesse('Horde (/TP)'), 'Hordengröße ohne Zahl');
gleich(undefined, hordenGroesse('Solo'), 'Hordengröße bei anderem Typ');

// --- Kampfpunkte und Budget ----------------------------------------------

gleich(
	{ punkte: 10, lakaien: 4 },
	berechneKampfpunkte(
		[
			{ typ: 'Solo', anzahl: 1 },
			{ typ: 'Standard', anzahl: 2 },
			{ typ: 'Lakai', anzahl: 4 },
		],
		4
	),
	'Kampfpunkte einer Beispielbegegnung'
);

gleich(14, budget(4, []), 'Budget ohne Anpassungen');
gleich(14, budget(4, ['haeerter', 'zwei-solo']), 'Budget mit ausgeglichenen Anpassungen');
gleich(13, budget(4, ['leichter']), 'Budget mit leichterem Kampf');

// Gegnertypen aus dem Bestand, die Kampfpunkte erzeugen
const vergebeneTypen = new Set<string>();
for (const roh of gegnerDaten) {
	const typ = normalisiereTyp(roh.typ as string | undefined);
	if (typ !== undefined) vergebeneTypen.add(typ);
}
zeilen.push(
	`Typen im Bestand: ${[...vergebeneTypen].sort().join(', ') || 'keine'}`
);

// --- IDs und Codeblock-Entfernung ----------------------------------------

const ids = new Set<string>();
for (let i = 0; i < 2000; i++) ids.add(neueKartenId());
gleich(2000, ids.size, 'Karten-IDs sind eindeutig');
pruefe(
	[...ids].every((id) => /^[a-z0-9]{9}$/.test(id)),
	'Karten-IDs haben eine feste Länge und erlaubte Zeichen'
);

pruefe(istWertekastenAnfang('```dolchherz'), 'Codeblockanfang "dolchherz"');
pruefe(istWertekastenAnfang('```daggerheart  '), 'Codeblockanfang mit Leerzeichen');
pruefe(!istWertekastenAnfang('```statblock'), '"statblock" ist kein Wertekasten');
pruefe(!istWertekastenAnfang('```'), 'Leerer Zaun ist kein Wertekasten');
pruefe(!istWertekastenAnfang('Text'), 'Fließtext ist kein Wertekasten');
pruefe(istCodeblockEnde('```'), 'Codeblockende');

const notiz = [
	'# Begegnung',
	'',
	'```dolchherz',
	'art: gegner',
	'name: Bär',
	'```',
	'',
	'Nach dem Kampf.',
].join('\n');

gleich(
	'# Begegnung\n\nNach dem Kampf.',
	entferneCodeblock(notiz, 2, 5),
	'Codeblock wird entfernt und die Leerzeile zusammengezogen'
);
gleich(
	undefined,
	entferneCodeblock(notiz, 0, 1),
	'Bereich ohne Codeblock wird abgelehnt'
);
gleich(
	undefined,
	entferneCodeblock(notiz, 2, 99),
	'Bereich außerhalb der Datei wird abgelehnt'
);
gleich(
	undefined,
	entferneCodeblock('# Titel\n\n```statblock\nname: X\n```\n', 2, 4),
	'Fremder Codeblock wird nicht entfernt'
);

const notizAmAnfang = ['```dolchherz', 'name: Bär', '```', '# Danach'].join('\n');
gleich(
	'# Danach',
	entferneCodeblock(notizAmAnfang, 0, 2),
	'Codeblock am Dateianfang wird entfernt'
);

// --- Zustandsspeicher -----------------------------------------------------

const speicher = new Zustandsspeicher(
	{ einstellungen: {}, karten: {} } as unknown as PluginState,
	() => undefined
);

speicher.setze(['k1', 0, 'tp'], 3);
speicher.setze(['k1', 0, 'stress'], 1);
speicher.setze(['k1', 0, 'zustaende', 'Verwundbar'], 1);
speicher.setze(['k1', 0, 'zustaende', 'Brand'], 1);
speicher.setze(['k1', 0, 'voruebergehend', 'Brand'], 1);

gleich(3, speicher.lese(['k1', 0, 'tp']), 'Zustand: markierte TP');
gleich(1, speicher.lese(['k1', 0, 'zustaende', 'Verwundbar']), 'Zustand: Verwundbar gesetzt');
gleich(
	['Verwundbar', 'Brand'],
	speicher.zustaende('k1', 0),
	'Zustand: nur Zustandsnamen, keine Exemplarfelder'
);

// Zweites Exemplar derselben Karte bleibt getrennt
gleich([], speicher.zustaende('k1', 1), 'Zustand: zweites Exemplar ohne Zustände');
gleich(undefined, speicher.lese(['k1', 1, 'tp']), 'Zustand: zweites Exemplar ohne TP');

// Ein entfernter Zustand verschwindet aus der Liste
speicher.setze(['k1', 0, 'zustaende', 'Verwundbar'], 0);
gleich(['Brand'], speicher.zustaende('k1', 0), 'Zustand: entfernt');

// Reste der früheren fehlerhaften Abfrage werden übersprungen
speicher.setze(['k2', 0, 'zustaende', 'tp'], 1);
speicher.setze(['k2', 0, 'zustaende', 'zustaende'], 1);
speicher.setze(['k2', 0, 'zustaende', 'voruebergehend'], 1);
speicher.setze(['k2', 0, 'zustaende', 'Krank'], 1);
gleich(['Krank'], speicher.zustaende('k2', 0), 'Zustand: Exemplarfelder gefiltert');

// --- Ergebnis -------------------------------------------------------------

for (const zeile of zeilen) console.log(`  ${zeile}`);
console.log('');

if (fehler.length === 0) {
	console.log('Alle Prüfungen bestanden.');
	process.exit(0);
}

console.error(`${fehler.length} Abweichung(en):`);
for (const eintrag of fehler) console.error(`  - ${eintrag}`);
process.exit(1);
