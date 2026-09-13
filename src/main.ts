import {
	type Debouncer,
	type Editor,
	type MarkdownPostProcessorContext,
	Menu,
	Notice,
	Plugin,
	debounce,
	parseYaml,
	setTooltip,
} from 'obsidian';
import { registriereKarten } from './cards';
import { t } from './i18n';
import { CODEMARKEN, baueBibliothek, eingebauteDaten, leseOrdner, type Bibliothekseintrag } from './model/library';
import { slug, uebersetzeSchluessel } from './model/keys';
import { Kartenregister, type Kartendefinition } from './registry';
import { type Begegnungsposten, berechneKampfpunkte, budget } from './regeln/kampfpunkte';
import { DhOrakelSettingTab, STANDARDEINSTELLUNGEN } from './settings';
import { Zustandsspeicher } from './state';
import type { Einstellungen, Karte, PluginState, Roh } from './types';
import { Kartenhost, type AufgeloesteKarte } from './ui/cardHost';
import { Kartenmodal } from './ui/picker';

/** Liest den Codeblock als YAML; Fehler werden gemeldet und führen zu einer leeren Karte. */
function liesYaml(quelle: string): Roh {
	try {
		const daten: unknown = parseYaml(quelle);
		if (typeof daten === 'object' && daten !== null && !Array.isArray(daten)) {
			return daten as Roh;
		}
		return {};
	} catch (fehler) {
		console.error('Dolchherz Orakel: Codeblock ist kein gültiges YAML.', fehler);
		new Notice(t('meldung.yamlFehler'));
		return {};
	}
}

export default class DolchherzOrakel extends Plugin {
	state!: PluginState;
	zustand!: Zustandsspeicher;

	readonly kartenregister = new Kartenregister();
	bibliothek: Bibliothekseintrag[] = [];

	private readonly aktiveKarten = new Map<Kartenhost, string>();
	private kampfpunkteAnzeige!: HTMLElement;
	private sichernDebounced!: Debouncer<[], Promise<void>>;

	get einstellungen(): Einstellungen {
		return this.state.einstellungen;
	}

	async onload(): Promise<void> {
		const gespeichert = (await this.loadData()) as Partial<PluginState> | null;
		this.state = {
			einstellungen: { ...STANDARDEINSTELLUNGEN, ...(gespeichert?.einstellungen ?? {}) },
			karten: gespeichert?.karten ?? {},
		};

		this.sichernDebounced = debounce(() => this.saveData(this.state), 1000, true);
		this.zustand = new Zustandsspeicher(this.state, () => void this.sichernDebounced());

		registriereKarten(this.kartenregister);

		this.kampfpunkteAnzeige = this.addStatusBarItem();
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => this.aktualisiereKampfpunkte())
		);
		this.app.workspace.onLayoutReady(() => void this.ladeBibliothek(false));

		const prozessor = (
			quelle: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		): void => {
			const roh = uebersetzeSchluessel(liesYaml(quelle));

			// Ein leerer Block entsteht beim Tippen; dort ist kein Fehlerhinweis nötig.
			if (Object.keys(roh).length === 0) return;
			const host = new Kartenhost(
				el,
				this,
				ctx,
				ctx.sourcePath,
				this.loeseKarte(roh, ctx.sourcePath)
			);
			ctx.addChild(host);
			host.rendern();

			this.aktiveKarten.set(host, ctx.sourcePath);
			this.aktualisiereKampfpunkte();

			host.register(() => {
				this.aktiveKarten.delete(host);
				this.aktualisiereKampfpunkte();
			});
		};

		for (const marke of CODEMARKEN) {
			this.registerMarkdownCodeBlockProcessor(marke, prozessor);
		}

		this.registriereBefehle();
		this.addSettingTab(new DhOrakelSettingTab(this.app, this));
	}

	onunload(): void {
		void this.saveData(this.state);
	}

	// --- Karten auflösen -----------------------------------------------------

	/** Macht aus Rohdaten eine Karte samt Laufzeit-ID. */
	private loeseKarte(roh: Roh, filePath: string): AufgeloesteKarte | undefined {
		const gelesen = this.kartenregister.lese(roh);
		if (!gelesen) return undefined;

		const ausBlock = typeof roh.id === 'string' ? roh.id.trim() : '';
		const id = ausBlock !== '' ? ausBlock : `${filePath}::${gelesen.rumpf.name}`;

		const karte = {
			...gelesen.rumpf,
			schluessel: slug(gelesen.rumpf.name),
			herkunft: 'vault' as const,
			roh,
		} as Karte;

		return { definition: gelesen.definition, karte, id };
	}

	/** Zeichnet alle sichtbaren Wertekasten neu. */
	neuzeichnen(): void {
		for (const [host] of this.aktiveKarten) host.rendern();
		this.aktualisiereKampfpunkte();
	}

	// --- Bibliothek ----------------------------------------------------------

	async ladeBibliothek(mitMeldung: boolean): Promise<void> {
		const quellen = eingebauteDaten();
		const ordnerPfad = this.einstellungen.bibliotheksOrdner.trim();
		const ordner = await leseOrdner(this.app, ordnerPfad);

		if (!ordner.vorhanden && ordnerPfad !== '' && mitMeldung) {
			new Notice(t('meldung.ordnerFehlt'));
		}
		if (ordner.fehler.length > 0) {
			new Notice(t('meldung.dateiFehler', { pfad: ordner.fehler[0] }));
		}

		quellen.push(...ordner.eintraege);
		this.bibliothek = baueBibliothek(
			quellen,
			this.kartenregister,
			this.einstellungen.duplikateIgnorieren
		);

		if (!mitMeldung) return;
		if (this.bibliothek.length === 0) {
			new Notice(t('meldung.bibliothekLeer', { ordner: ordnerPfad }));
		} else {
			new Notice(t('meldung.bibliothekGeladen', { anzahl: this.bibliothek.length }));
		}
	}

	// --- Statusleiste --------------------------------------------------------

	private aktualisiereKampfpunkte(): void {
		const datei = this.app.workspace.getActiveFile();
		if (!datei) {
			this.kampfpunkteAnzeige.setText('');
			return;
		}

		const posten: Begegnungsposten[] = [];
		for (const [host, pfad] of this.aktiveKarten) {
			if (pfad !== datei.path) continue;
			const typ = host.kampfpunkttyp;
			if (typ === undefined) continue;
			posten.push({ typ, anzahl: host.anzahl });
		}

		if (posten.length === 0) {
			this.kampfpunkteAnzeige.setText('');
			return;
		}

		const anzahlSC = this.einstellungen.anzahlSC;
		const { punkte, lakaien } = berechneKampfpunkte(posten, anzahlSC);
		const ziel = budget(anzahlSC, this.einstellungen.kampfpunkteAnpassungen);

		this.kampfpunkteAnzeige.setText(`${punkte} ${t('status.kampfpunkte')}`);

		const zeilen = [t('status.kampfpunkteTooltip', { punkte, budget: ziel, anzahlSC })];
		if (lakaien > 0) {
			zeilen.push(
				t('status.lakaien', { gruppen: Math.ceil(lakaien / Math.max(1, anzahlSC)) })
			);
		}
		setTooltip(this.kampfpunkteAnzeige, zeilen.join(' · '), { delay: 500, placement: 'top' });
	}

	// --- Befehle und Menü ----------------------------------------------------

	private oeffneSuchdialog(editor: Editor, definition: Kartendefinition<any>): void {
		const eintraege = this.bibliothek.filter(
			(eintrag) => eintrag.definition.art === definition.art
		);
		new Kartenmodal(this.app, editor, eintraege).open();
	}

	/**
	 * Befehle und Menüeinträge entstehen aus dem Register. Ein neuer Kartentyp
	 * erhält dadurch automatisch seine Einfüge- und Vorlagenbefehle.
	 */
	private registriereBefehle(): void {
		for (const definition of this.kartenregister.alle()) {
			const vorlage = definition.vorlage?.bind(definition);
			if (vorlage) {
				this.addCommand({
					id: `vorlage-${definition.art}`,
					name: t('befehl.vorlage', { typ: definition.bezeichnung() }),
					editorCallback: (editor: Editor) => {
						editor.replaceRange(vorlage().trim(), editor.getCursor());
					},
				});
			}

			this.addCommand({
				id: `einfuegen-${definition.art}`,
				name: t('befehl.einfuegen', { typ: definition.bezeichnung() }),
				editorCallback: (editor: Editor) => this.oeffneSuchdialog(editor, definition),
			});
		}

		this.addCommand({
			id: 'bibliothek-aktualisieren',
			name: t('befehl.bibliothekAktualisieren'),
			callback: () => void this.ladeBibliothek(true),
		});

		this.addCommand({
			id: 'kartenzustand-zuruecksetzen',
			name: t('befehl.kartenzustandZuruecksetzen'),
			callback: () => {
				this.zustand.allesZuruecksetzen();
				this.neuzeichnen();
				new Notice(t('meldung.kartenZurueckgesetzt'));
			},
		});

		this.addRibbonIcon('swords', t('band.menue'), (ereignis) => {
			const menue = new Menu();

			const imEditor = (aktion: (editor: Editor) => void) => () => {
				const editor = this.app.workspace.activeEditor?.editor;
				if (!editor) {
					new Notice(t('meldung.keinEditor'));
					return;
				}
				aktion(editor);
			};

			for (const definition of this.kartenregister.alle()) {
				menue.addItem((eintrag) =>
					eintrag
						.setTitle(t('befehl.einfuegen', { typ: definition.bezeichnung() }))
						.setIcon('book-copy')
						.onClick(imEditor((editor) => this.oeffneSuchdialog(editor, definition)))
				);

				const vorlage = definition.vorlage?.bind(definition);
				if (vorlage) {
					menue.addItem((eintrag) =>
						eintrag
							.setTitle(t('befehl.vorlage', { typ: definition.bezeichnung() }))
							.setIcon('book-dashed')
							.onClick(
								imEditor((editor) =>
									editor.replaceRange(vorlage().trim(), editor.getCursor())
								)
							)
					);
				}

				menue.addSeparator();
			}

			menue.addItem((eintrag) =>
				eintrag
					.setTitle(t('befehl.bibliothekAktualisieren'))
					.setIcon('refresh-cw')
					.onClick(() => void this.ladeBibliothek(true))
			);

			menue.addItem((eintrag) =>
				eintrag
					.setTitle(t('befehl.kartenzustandZuruecksetzen'))
					.setIcon('eraser')
					.onClick(() => {
						this.zustand.allesZuruecksetzen();
						this.neuzeichnen();
					})
			);

			menue.showAtMouseEvent(ereignis);
		});
	}
}
