import {
	MarkdownRenderChild,
	type MarkdownPostProcessorContext,
	Notice,
	requireApiVersion,
	setIcon,
	stringifyYaml,
} from 'obsidian';
import { wuerfle } from '../dice';
import { t } from '../i18n';
import type DolchherzOrakel from '../main';
import { entferneCodeblock } from '../model/library';
import { neueKartenId } from '../model/keys';
import type { Kartendefinition, Kartenbereiche, Renderkontext } from '../registry';
import type { Karte, Roh } from '../types';
import { Bestaetigungsmodal } from './bestaetigung';
import { ANGRIFFSKLASSE, WUERFELBAR, richtwerteHinweis, zustandsleiste } from './primitives';

/** Eine aus einem Codeblock gelesene Karte samt ihrer Laufzeit-ID. */
export type AufgeloesteKarte = {
	definition: Kartendefinition<any>;
	karte: Karte;
	id: string;
};

function hexZuRgb(hex: string): string {
	const bereinigt = hex.replace(/^#/, '');
	const vollstaendig =
		bereinigt.length === 3
			? bereinigt
					.split('')
					.map((zeichen) => zeichen + zeichen)
					.join('')
			: bereinigt;
	const zahl = Number.parseInt(vollstaendig, 16);
	return `${zahl >> 16}, ${(zahl >> 8) & 255}, ${zahl & 255}`;
}

/**
 * Bindeglied zwischen Codeblock und Kartentyp.
 *
 * Der Host kennt Titel, Anzahl, Farbwahl, Würfe und Zustände; der Kartentyp
 * füllt nur die Bereiche. Dadurch bleibt ein neuer Kartentyp frei von
 * Zustands- und Interaktionslogik.
 */
export class Kartenhost extends MarkdownRenderChild {
	/** Laufzeit-ID aus dem Codeblock. */
	readonly id: string;

	constructor(
		containerEl: HTMLElement,
		private readonly plugin: DolchherzOrakel,
		private readonly ctx: MarkdownPostProcessorContext,
		private readonly filePath: string,
		private readonly aufgeloest: AufgeloesteKarte | undefined
	) {
		super(containerEl);
		this.id = aufgeloest?.id ?? '';
	}

	/** Kampfpunkte-Kategorie laut SRD, sofern der Kartentyp eine hat. */
	get kampfpunkttyp(): string | undefined {
		if (!this.aufgeloest) return undefined;
		return this.aufgeloest.definition.kampfpunkttyp?.(this.aufgeloest.karte);
	}

	/** Anzahl der platzierten Exemplare. */
	get anzahl(): number {
		return this.plugin.zustand.anzahl(this.id);
	}

	rendern(): void {
		this.containerEl.empty();

		if (!this.aufgeloest) {
			const fehler = this.containerEl.createDiv({ cls: 'dho-fehler' });
			fehler.createEl('b', { text: t('meldung.karteUnbekannt') });
			return;
		}

		const { karte, definition } = this.aufgeloest;

		const rahmen = this.containerEl.createDiv({
			cls: 'callout dho-karte',
			attr: { 'data-callout': 'dolchherz' },
		});

		const titel = rahmen.createDiv({ cls: 'callout-title dho-verteilt' });
		titel.createEl('b', { cls: 'dho-groesser', text: karte.name });
		const untertitel = definition.untertitel(karte);
		if (untertitel !== '') {
			titel.createEl('b', { cls: 'dho-kleiner dho-rand', text: untertitel });
		}

		const inhalt = rahmen.createDiv({ cls: 'callout-content' });
		const bereiche: Kartenbereiche = {
			kopf: inhalt.createDiv(),
			merkmale: inhalt.createDiv(),
			instanzen: inhalt.createDiv(),
			hinweise: inhalt.createDiv(),
		};

		// Ein Block je Exemplar, beim ersten Zugriff angelegt.
		const bloecke = new Map<number, HTMLElement>();
		const instanzbereich = (instanz: number): HTMLElement => {
			const vorhanden = bloecke.get(instanz);
			if (vorhanden) return vorhanden;
			const block = bereiche.instanzen.createDiv({ cls: 'dho-instanz' });
			if (instanz > 0) block.createEl('hr');
			bloecke.set(instanz, block);
			return block;
		};

		const neuzeichnen = () => this.rendern();
		const ctx: Renderkontext = {
			karte,
			id: this.id,
			anzahl: this.anzahl,
			filePath: this.filePath,
			plugin: this.plugin,
			component: this,
			bereiche,
			instanzbereich,
			neuzeichnen,
		};

		this.setzeFarbe(
			rahmen,
			this.plugin.zustand.farbe(this.id) ?? this.plugin.einstellungen.standardFarbe
		);
		this.verdrahteWuerfe(rahmen);

		definition.rendern(ctx);
		zustandsleiste(ctx, definition.zustaende?.(karte) ?? []);
		if (this.plugin.einstellungen.richtwerteMelden && definition.hinweise) {
			richtwerteHinweis(ctx, definition.hinweise(karte));
		}

		this.erstelleFusszeile(rahmen, definition, neuzeichnen);
	}

	/**
	 * Fußzeile mit Anzahlsteuerung und Farbwahl. Bewusst im Fluss statt absolut
	 * positioniert, damit nichts mit dem Bearbeiten-Knopf von Obsidian kollidiert.
	 */
	private erstelleFusszeile(
		rahmen: HTMLElement,
		definition: Kartendefinition<any>,
		neuzeichnen: () => void
	): void {
		const zeigeFarbwahl = this.plugin.einstellungen.farbwahlAnzeigen;
		const fuss = rahmen.createDiv({ cls: 'dho-fuss' });

		if (definition.anzahlbar) {
			const gruppe = fuss.createDiv({ cls: 'dho-anzahl' });

			const verringern = gruppe.createEl('button', {
				cls: 'dho-knopf',
				attr: { 'aria-label': t('ui.anzahlVerringern') },
			});
			setIcon(verringern, 'minus');
			gruppe.createSpan({ text: String(this.anzahl), cls: 'dho-anzahlwert' });
			const erhoehen = gruppe.createEl('button', {
				cls: 'dho-knopf',
				attr: { 'aria-label': t('ui.anzahlErhoehen') },
			});
			setIcon(erhoehen, 'plus');

			erhoehen.addEventListener('click', () => {
				this.plugin.zustand.setzeAnzahl(this.id, this.anzahl + 1);
				neuzeichnen();
			});
			verringern.addEventListener('click', () => {
				if (this.anzahl <= 1) return;
				this.plugin.zustand.setzeAnzahl(this.id, this.anzahl - 1);
				neuzeichnen();
			});
		}

		const aktionen = fuss.createDiv({ cls: 'dho-aktionen' });

		const kopieren = aktionen.createEl('button', {
			cls: 'dho-knopf',
			attr: { 'aria-label': t('ui.kopieren') },
		});
		setIcon(kopieren, 'copy');
		kopieren.addEventListener('click', () => void this.kopieren());

		const loeschen = aktionen.createEl('button', {
			cls: 'dho-knopf',
			attr: { 'aria-label': t('ui.loeschen') },
		});
		setIcon(loeschen, 'trash-2');
		loeschen.addEventListener('click', () => this.loeschen());

		if (zeigeFarbwahl) {
			const farbwahl = fuss.createEl('input', {
				type: 'color',
				cls: 'dho-farbwahl',
				value: this.plugin.zustand.farbe(this.id) ?? this.plugin.einstellungen.standardFarbe,
				attr: { 'aria-label': t('ui.farbe') },
			});
			farbwahl.addEventListener('input', () => this.setzeFarbe(rahmen, farbwahl.value));
			farbwahl.addEventListener('change', () =>
				this.plugin.zustand.setzeFarbe(this.id, farbwahl.value)
			);
		}
	}

	private setzeFarbe(rahmen: HTMLElement, farbe: string): void {
		// Ab Obsidian 1.13 erwartet --callout-color einen Farbwert statt eines RGB-Tripels.
		const calloutFarbe = requireApiVersion('1.13.0') ? farbe : hexZuRgb(farbe);
		rahmen.style.setProperty('--callout-color', calloutFarbe);
		rahmen.style.setProperty('--dho-farbe', farbe);
		rahmen.style.setProperty('--checkbox-color', farbe);
		rahmen.style.setProperty('--checkbox-color-hover', farbe);
	}

	private verdrahteWuerfe(rahmen: HTMLElement): void {
		rahmen.addEventListener('click', (ereignis) => {
			const ziel = ereignis.target;
			if (!(ziel instanceof HTMLElement)) return;
			const element = ziel.closest(`.${WUERFELBAR}`);
			if (!(element instanceof HTMLElement)) return;

			const karte = this.aufgeloest?.karte;
			const istAngriff = element.classList.contains(ANGRIFFSKLASSE);
			const bonus = istAngriff && karte?.art === 'gegner' ? (karte.angriff?.bonus ?? '') : '';
			const ausdruck = istAngriff ? `1d20${bonus}` : (element.textContent ?? '');
			if (ausdruck.trim() === '') return;

			try {
				const { notation, ergebnis } = wuerfle(ausdruck);
				const fragment = document.createDocumentFragment();
				fragment.createEl('code', { text: `${notation} = ${ergebnis}` });
				new Notice(fragment);
			} catch (fehler) {
				new Notice(`${ausdruck} ist kein auswertbarer Wurf.`);
				console.error('Dolchherz Orakel:', fehler);
			}
		});
	}

	/**
		* Legt den Wertekasten als Codeblock in die Zwischenablage.
		* Die Kopie erhält eine neue ID und wird dadurch eigenständig verfolgt.
		*/
	private async kopieren(): Promise<void> {
		const aufgeloest = this.aufgeloest;
		if (!aufgeloest) return;

		const daten: Roh = {
			...aufgeloest.karte.roh,
			art: aufgeloest.karte.art,
			id: neueKartenId(),
		};

		try {
			const yaml = stringifyYaml(daten).trim();
			await navigator.clipboard.writeText(`\`\`\`dolchherz\n${yaml}\n\`\`\`\n`);
			new Notice(t('meldung.kopiert'));
		} catch (fehler) {
			console.error('Dolchherz Orakel:', fehler);
			new Notice(t('meldung.kopierenNichtMoeglich'));
		}
	}

	/** Fragt nach und entfernt anschließend den Codeblock aus der Notiz. */
	private loeschen(): void {
		const aufgeloest = this.aufgeloest;
		if (!aufgeloest) return;

		const abschnitt = this.ctx.getSectionInfo(this.containerEl);
		if (!abschnitt) {
			new Notice(t('meldung.loeschenNichtMoeglich'));
			return;
		}

		new Bestaetigungsmodal(
			this.plugin.app,
			t('dialog.loeschenTitel'),
			t('dialog.loeschenFrage', { name: aufgeloest.karte.name }),
			() => void this.entferne(abschnitt.lineStart, abschnitt.lineEnd)
		).open();
	}

	private async entferne(start: number, ende: number): Promise<void> {
		const datei = this.plugin.app.vault.getFileByPath(this.filePath);
		if (!datei) {
			new Notice(t('meldung.loeschenNichtMoeglich'));
			return;
		}

		let entfernt = false;
		await this.plugin.app.vault.process(datei, (inhalt: string) => {
			const gekuerzt = entferneCodeblock(inhalt, start, ende);
			if (gekuerzt === undefined) return inhalt;
			entfernt = true;
			return gekuerzt;
		});

		new Notice(entfernt ? t('meldung.geloescht') : t('meldung.loeschenNichtMoeglich'));
	}
}
