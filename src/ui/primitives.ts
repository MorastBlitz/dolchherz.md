import { MarkdownRenderer, setIcon } from 'obsidian';
import { WUERFEL_MUSTER } from '../dice';
import { t } from '../i18n';
import type { Renderkontext } from '../registry';
import type { Richtwert } from '../regeln/richtwerte';
import { hordenGroesse } from '../regeln/typen';
import { standardregel } from '../regeln/zustaende';
import type { Angriff, Faehigkeit, Zustandspfad } from '../types';

/**
 * Bausteine, aus denen Kartentypen ihre Darstellung zusammensetzen.
 *
 * Jeder Baustein kennt nur den Renderkontext und die übergebenen Daten, nicht
 * den Kartentyp. Deshalb teilen sich Gegner und Schauplatz dieselben
 * Funktionen, und spätere Typen können sie unverändert mitbenutzen.
 */

/** Markierung für anklickbare Würfelausdrücke. */
export const WUERFELBAR = 'dho-wuerfelbar';
/** Zusätzliche Markierung für den Angriffsmodifikator. */
export const ANGRIFFSKLASSE = 'dho-angriff';

export type Kopffeld = {
	bezeichnung: string;
	wert?: string;
};

/** Kursiver Beschreibungstext unter dem Titel. */
export function kartenbeschreibung(ctx: Renderkontext, text?: string): void {
	if (!text) return;
	const absatz = ctx.bereiche.kopf.createEl('p', { cls: 'dho-klein dho-gedaempft' });
	absatz.createEl('i', { text });
}

/** Zeilen der Form "Bezeichnung: Wert"; leere Werte werden übersprungen. */
export function kopfzeile(ctx: Renderkontext, felder: Kopffeld[]): void {
	const gefuellt = felder.filter((feld) => feld.wert !== undefined && feld.wert !== '');
	if (gefuellt.length === 0) return;

	const absatz = ctx.bereiche.kopf.createEl('p', { cls: 'dho-klein' });
	for (const feld of gefuellt) {
		absatz.createEl('b', { text: `${feld.bezeichnung}: ` });
		absatz.createSpan({ text: feld.wert ?? '' });
		absatz.createEl('br');
	}
}

/** Standardangriff mit anklickbarem Angriffsmodifikator und Würfelschaden. */
export function angriffszeile(ctx: Renderkontext, angriff?: Angriff): void {
	if (!angriff) return;

	const absatz = ctx.bereiche.kopf.createEl('p', { cls: 'dho-klein' });

	if (angriff.bonus) {
		absatz.createEl('b', { text: `${t('feld.angriffsmodifikator')}: ` });
		absatz.createSpan({
			text: angriff.bonus,
			cls: `${WUERFELBAR} ${ANGRIFFSKLASSE}`,
			attr: { title: t('ui.angriffswurf') },
		});
		absatz.createEl('br');
	}

	if (angriff.waffe || angriff.distanz || angriff.schaden) {
		absatz.createEl('b', { text: `${angriff.waffe ?? t('feld.standardangriff')}: ` });
		const teile = [angriff.distanz, angriff.schaden].filter(
			(teil): teil is string => teil !== undefined && teil !== ''
		);
		wuerfelmarkierung(absatz, teile.join(' | '));
		absatz.createEl('br');
	}
}

/** Hängt Text an und hebt darin enthaltene Würfelausdrücke hervor. */
function wuerfelmarkierung(el: HTMLElement, text: string): void {
	let zuletzt = 0;
	for (const treffer of text.matchAll(WUERFEL_MUSTER)) {
		const index = treffer.index ?? 0;
		if (index > zuletzt) el.createSpan({ text: text.slice(zuletzt, index) });
		el.createSpan({ text: treffer[0], cls: WUERFELBAR });
		zuletzt = index + treffer[0].length;
	}
	if (zuletzt < text.length) el.createSpan({ text: text.slice(zuletzt) });
}

/** Rendert Markdown und hebt Würfelausdrücke hervor. */
export function wuerfeltext(ctx: Renderkontext, el: HTMLElement, markdown: string): void {
	const markiert = markdown.replace(
		WUERFEL_MUSTER,
		(treffer) => `<span class="${WUERFELBAR}">${treffer}</span>`
	);
	void MarkdownRenderer.render(ctx.plugin.app, markiert, el, ctx.filePath, ctx.component);
}

function beschreibeArt(faehigkeit: Faehigkeit): string | undefined {
	const teile: string[] = [];
	if (faehigkeit.art) teile.push(faehigkeit.art);

	if (faehigkeit.countdown !== undefined) {
		const zusatz = faehigkeit.zufaellig ? `, ${t('faehigkeit.zufaellig')}` : '';
		const schleife = faehigkeit.schleife ? `, ${t('faehigkeit.schleife')}` : '';
		teile.push(`${t('faehigkeit.countdown')} ${faehigkeit.countdown}${zusatz}${schleife}`);
	}

	return teile.length > 0 ? teile.join(' – ') : undefined;
}

/** Fähigkeitsliste mit Name, Art, Text, Erzählteil und Anwendungsfeldern. */
export function faehigkeiten(ctx: Renderkontext, liste: Faehigkeit[]): void {
	for (const [index, faehigkeit] of liste.entries()) {
		const absatz = ctx.bereiche.merkmale.createEl('p', { cls: 'dho-klein' });

		const zusatz = beschreibeArt(faehigkeit);
		if (faehigkeit.name || zusatz) {
			if (faehigkeit.name) absatz.createEl('b', { text: faehigkeit.name });
			if (faehigkeit.name && zusatz) absatz.createSpan({ text: ' – ' });
			if (zusatz) absatz.createSpan({ text: zusatz });
			if (faehigkeit.furchtfaehig) {
				absatz.createSpan({ text: ` · ${t('faehigkeit.furchtfaehig')}`, cls: 'dho-marke' });
			}
			absatz.createEl('br');
		}

		// Bei einem einzelnen Exemplar stehen die Felder in der Fähigkeitszeile,
		// bei mehreren je Exemplar in der Statusleiste.
		if (ctx.anzahl === 1) faehigkeitsfelder(ctx, absatz, 0, index, faehigkeit);

		if (faehigkeit.text) {
			const textbereich = absatz.createDiv({ cls: 'dho-faehigkeit' });
			wuerfeltext(ctx, textbereich, faehigkeit.text);
		}

		if (faehigkeit.frage) {
			absatz
				.createDiv({ cls: 'dho-gedaempft dho-frage' })
				.createEl('i', { text: faehigkeit.frage });
		}
	}
}

function feldleiste(
	ctx: Renderkontext,
	el: HTMLElement,
	pfad: Zustandspfad,
	bezeichnung: string,
	anzahl: number
): HTMLInputElement[] {
	const felder: HTMLInputElement[] = [];
	if (anzahl <= 0) return felder;

	const markiert = ctx.plugin.zustand.lese(pfad) ?? 0;
	el.createSpan({ text: `${bezeichnung}: ${anzahl} `, cls: 'dho-gedaempft' });

	for (let i = 0; i < anzahl; i++) {
		const feld = el.createEl('input', { type: 'checkbox', cls: 'dho-feld' });
		feld.checked = i < markiert;
		felder.push(feld);
	}
	el.createEl('br');

	el.addEventListener('change', () => {
		const gesetzt = felder.reduce((summe, feld) => summe + (feld.checked ? 1 : 0), 0);
		ctx.plugin.zustand.setze(pfad, gesetzt);
	});

	return felder;
}

function faehigkeitsfelder(
	ctx: Renderkontext,
	el: HTMLElement,
	instanz: number,
	index: number,
	faehigkeit: Faehigkeit
): void {
	if (faehigkeit.anwendungen !== undefined && faehigkeit.anwendungen > 0) {
		feldleiste(
			ctx,
			el,
			[ctx.id, instanz, 'anwendungen', index],
			t('faehigkeit.anwendungen'),
			faehigkeit.anwendungen
		);
	}
	if (faehigkeit.countdown !== undefined && faehigkeit.countdown > 0) {
		feldleiste(
			ctx,
			el,
			[ctx.id, instanz, 'countdown', index],
			t('faehigkeit.countdown'),
			faehigkeit.countdown
		);
	}
}

type Schwellenknoepfe = {
	leicht?: HTMLButtonElement;
	mittel?: HTMLButtonElement;
	schwer?: HTMLButtonElement;
	massiv?: HTMLButtonElement;
};

/**
 * Knöpfe für die Schadensschwellen. Die Zahlen dazwischen sind die Schwellen
 * selbst: Schaden unter der Mittleren Schwelle markiert 1 TP, ab der Mittleren 2,
 * ab der Schweren 3 und ab dem Doppelten der Schweren 4.
 */
function schwellenleiste(
	ctx: Renderkontext,
	zeile: HTMLElement,
	schwellen: number[]
): Schwellenknoepfe {
	const knoepfe: Schwellenknoepfe = {};
	if (schwellen.length === 0) return knoepfe;

	const bereich = zeile.createEl('span', {
		cls: 'dho-schwellen',
		attr: { title: t('schwelle.hinweis') },
	});

	knoepfe.leicht = bereich.createEl('button', { text: t('schwelle.leicht') });
	bereich.createSpan({ text: ` ${schwellen[0]} ` });
	knoepfe.mittel = bereich.createEl('button', { text: t('schwelle.mittel') });

	if (schwellen.length > 1) {
		bereich.createSpan({ text: ` ${schwellen[1]} ` });
		knoepfe.schwer = bereich.createEl('button', { text: t('schwelle.schwer') });

		if (ctx.plugin.einstellungen.massiveSchwelle) {
			bereich.createSpan({ text: ` ${schwellen[2] ?? schwellen[1] * 2} ` });
			knoepfe.massiv = bereich.createEl('button', { text: t('schwelle.massiv') });
		}
	}

	bereich.createEl('br');
	return knoepfe;
}

export type Statuswerte = {
	tp: number;
	stress: number;
	schwellen: number[];
};

/** Trefferpunkte, Stress und Schwellen; je Exemplar eine Zeile. */
export function statusleiste(ctx: Renderkontext, werte: Statuswerte): void {
	for (let instanz = 0; instanz < ctx.anzahl; instanz++) {
		const zeile = ctx.instanzbereich(instanz).createEl('p', { cls: 'dho-status' });

		// Anzeigen, die vom markierten Schaden abhängen, etwa die Hordengröße.
		const nachAenderung: (() => void)[] = [];

		const knoepfe = schwellenleiste(ctx, zeile, werte.schwellen);
		const tpFelder = feldleiste(ctx, zeile, [ctx.id, instanz, 'tp'], t('feld.tp'), werte.tp);
		feldleiste(ctx, zeile, [ctx.id, instanz, 'stress'], t('feld.stress'), werte.stress);

		const markiere = (anzahl: number) => (ereignis: MouseEvent) => {
			const felder = ereignis.altKey ? [...tpFelder].reverse() : tpFelder;
			let offen = anzahl;
			let gesetzt = 0;
			for (const feld of felder) {
				if (feld.checked === ereignis.altKey && offen > 0) {
					feld.checked = !feld.checked;
					offen--;
				}
				if (feld.checked) gesetzt++;
			}
			ctx.plugin.zustand.setze([ctx.id, instanz, 'tp'], gesetzt);
			for (const aktualisiere of nachAenderung) aktualisiere();
		};

		knoepfe.leicht?.addEventListener('click', markiere(1));
		knoepfe.mittel?.addEventListener('click', markiere(2));
		knoepfe.schwer?.addEventListener('click', markiere(3));
		knoepfe.massiv?.addEventListener('click', markiere(4));

		if (ctx.anzahl > 1) {
			for (const [index, faehigkeit] of ctx.karte.faehigkeiten.entries()) {
				faehigkeitsfelder(ctx, zeile, instanz, index, faehigkeit);
			}
		}

		const groesse = hordenGroesse(ctx.karte.typ);
		if (groesse !== undefined && werte.tp > 0) {
			const anzeige = zeile.createSpan({ cls: 'dho-gedaempft' });
			nachAenderung.push(() => {
				const markiert = ctx.plugin.zustand.lese([ctx.id, instanz, 'tp']) ?? 0;
				anzeige.setText(
					t('status.horde', { groesse: groesse * Math.max(0, werte.tp - markiert) })
				);
			});
		}

		zeile.addEventListener('change', () => {
			for (const aktualisiere of nachAenderung) aktualisiere();
		});
	}
}

/** Zustandsleiste je Exemplar. `vorauswahl` sind die vorgeschlagenen Zustände. */
export function zustandsleiste(ctx: Renderkontext, vorauswahl: string[]): void {
	const namen = new Set(vorauswahl);
	for (let instanz = 0; instanz < ctx.anzahl; instanz++) {
		for (const name of ctx.plugin.zustand.zustaende(ctx.id, instanz)) {
			namen.add(name);
		}
	}
	if (namen.size === 0) return;

	for (let instanz = 0; instanz < ctx.anzahl; instanz++) {
		const zeile = ctx.instanzbereich(instanz).createDiv({ cls: 'dho-zustaende' });
		if (ctx.anzahl > 1) {
			zeile.createSpan({ text: `${instanz + 1}. `, cls: 'dho-gedaempft' });
		}
		zeile.createSpan({ text: `${t('zustand.titel')}: `, cls: 'dho-gedaempft' });

		for (const name of namen) zustandsknopf(ctx, zeile, instanz, name);
		zustandHinzufuegen(ctx, zeile, instanz);
	}
}

function zustandsknopf(
	ctx: Renderkontext,
	zeile: HTMLElement,
	instanz: number,
	name: string
): void {
	const pfad: Zustandspfad = [ctx.id, instanz, 'zustaende', name];
	const aktiv = ctx.plugin.zustand.lese(pfad) === 1;
	const voruebergehend =
		ctx.plugin.zustand.lese([ctx.id, instanz, 'voruebergehend', name]) === 1;

	const knopf = zeile.createEl('button', {
		cls: `dho-zustand${aktiv ? ' dho-zustand-aktiv' : ''}`,
		text: voruebergehend ? `${name} (${t('zustand.voruebergehend')})` : name,
		attr: { title: standardregel(name) ?? t('zustand.entfernen') },
	});

	knopf.addEventListener('click', () => {
		ctx.plugin.zustand.setze(pfad, aktiv ? 0 : 1);
		if (aktiv) {
			ctx.plugin.zustand.setze([ctx.id, instanz, 'voruebergehend', name], 0);
		}
		ctx.neuzeichnen();
	});

	if (!aktiv) return;

	const kennzeichen = zeile.createEl('button', {
		cls: `dho-kennzeichen${voruebergehend ? ' dho-zustand-aktiv' : ''}`,
		attr: { title: t('zustand.voruebergehend') },
	});
	setIcon(kennzeichen, 'hourglass');
	kennzeichen.addEventListener('click', () => {
		ctx.plugin.zustand.setze(
			[ctx.id, instanz, 'voruebergehend', name],
			voruebergehend ? 0 : 1
		);
		ctx.neuzeichnen();
	});
}

/** Freitextfeld für Zustände, die nicht zu den Standardzuständen gehören. */
function zustandHinzufuegen(ctx: Renderkontext, zeile: HTMLElement, instanz: number): void {
	const knopf = zeile.createEl('button', {
		cls: 'dho-hinzufuegen',
		text: '+',
		attr: { title: t('zustand.hinzufuegen') },
	});

	knopf.addEventListener('click', () => {
		const eingabe = zeile.createEl('input', {
			type: 'text',
			cls: 'dho-zustandseingabe',
			attr: { placeholder: t('zustand.platzhalter') },
		});
		eingabe.focus();

		const uebernehmen = () => {
			const name = eingabe.value.trim();
			if (name !== '') {
				ctx.plugin.zustand.setze([ctx.id, instanz, 'zustaende', name], 1);
				ctx.neuzeichnen();
			} else {
				eingabe.remove();
			}
		};

		eingabe.addEventListener('keydown', (ereignis) => {
			if (ereignis.key === 'Enter') uebernehmen();
			if (ereignis.key === 'Escape') eingabe.remove();
		});
		eingabe.addEventListener('blur', uebernehmen);
	});
}

/** Hinweis auf Abweichungen von den Rang-Richtwerten. */
export function richtwerteHinweis(ctx: Renderkontext, liste: Richtwert[]): void {
	if (liste.length === 0) return;
	const absatz = ctx.bereiche.hinweise.createEl('p', { cls: 'dho-klein dho-hinweis' });
	absatz.createEl('b', { text: `${t('ui.richtwertHinweis')}: ` });
	absatz.createSpan({
		text: liste
			.map((eintrag) => `${eintrag.bezeichnung} ${eintrag.gefunden} statt ${eintrag.erwartet}`)
			.join('; '),
	});
}

/** Freier Markdownblock; für Kartentypen ohne Wertezeilen. */
export function textblock(ctx: Renderkontext, markdown: string): void {
	const bereich = ctx.bereiche.merkmale.createDiv({ cls: 'dho-textblock' });
	wuerfeltext(ctx, bereich, markdown);
}

/** Einfache Tabelle; für Ausrüstungs- und Nachschlagetabellen. */
export function tabelle(ctx: Renderkontext, spalten: string[], zeilen: string[][]): void {
	const element = ctx.bereiche.merkmale.createEl('table', { cls: 'dho-tabelle' });
	const kopf = element.createEl('thead').createEl('tr');
	for (const spalte of spalten) kopf.createEl('th', { text: spalte });

	const koerper = element.createEl('tbody');
	for (const zeile of zeilen) {
		const reihe = koerper.createEl('tr');
		for (const zelle of zeile) reihe.createEl('td', { text: zelle });
	}
}
