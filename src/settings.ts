import { type App, PluginSettingTab, Setting } from 'obsidian';
import { t } from './i18n';
import type DolchherzOrakel from './main';
import { ANPASSUNGEN } from './regeln/kampfpunkte';
import type { Einstellungen } from './types';

export const STANDARDEINSTELLUNGEN: Einstellungen = {
	standardFarbe: '#8A5CF5',
	farbwahlAnzeigen: true,
	massiveSchwelle: false,
	anzahlSC: 4,
	bibliotheksOrdner: '',
	duplikateIgnorieren: true,
	richtwerteMelden: false,
	kampfpunkteAnpassungen: [],
};

export class DhOrakelSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: DolchherzOrakel
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const uebernehmen = () => {
			void this.plugin.saveData(this.plugin.state);
			this.plugin.neuzeichnen();
		};

		new Setting(containerEl).setName(t('einstellung.darstellung')).setHeading();

		new Setting(containerEl).setName(t('einstellung.standardfarbe')).addColorPicker((auswahl) =>
			auswahl
				.setValue(this.plugin.einstellungen.standardFarbe)
				.onChange((wert) => {
					this.plugin.einstellungen.standardFarbe = wert;
					uebernehmen();
				})
		);

		new Setting(containerEl).setName(t('einstellung.farbwahl')).addToggle((schalter) =>
			schalter.setValue(this.plugin.einstellungen.farbwahlAnzeigen).onChange((wert) => {
				this.plugin.einstellungen.farbwahlAnzeigen = wert;
				uebernehmen();
			})
		);

		new Setting(containerEl)
			.setName(t('einstellung.massiveSchwelle'))
			.setDesc(t('einstellung.massiveSchwelleBeschreibung'))
			.addToggle((schalter) =>
				schalter.setValue(this.plugin.einstellungen.massiveSchwelle).onChange((wert) => {
					this.plugin.einstellungen.massiveSchwelle = wert;
					uebernehmen();
				})
			);

		new Setting(containerEl).setName(t('einstellung.begegnung')).setHeading();

		new Setting(containerEl)
			.setName(t('einstellung.anzahlSC'))
			.setDesc(t('einstellung.anzahlSCBeschreibung'))
			.addSlider((regler) =>
				regler
					.setLimits(0, 10, 1)
					.setValue(this.plugin.einstellungen.anzahlSC)
					.setDynamicTooltip()
					.onChange((wert) => {
						this.plugin.einstellungen.anzahlSC = wert;
						uebernehmen();
					})
			);

		new Setting(containerEl)
			.setName(t('einstellung.anpassungen'))
			.setDesc(t('einstellung.anpassungenBeschreibung'))
			.setHeading();

		for (const anpassung of ANPASSUNGEN) {
			new Setting(containerEl)
				.setName(anpassung.bezeichnung)
				.setDesc(`${anpassung.wert > 0 ? '+' : ''}${anpassung.wert} Kampfpunkte`)
				.addToggle((schalter) =>
					schalter
						.setValue(
							this.plugin.einstellungen.kampfpunkteAnpassungen.includes(anpassung.id)
						)
						.onChange((wert) => {
							const aktiv = new Set(this.plugin.einstellungen.kampfpunkteAnpassungen);
							if (wert) aktiv.add(anpassung.id);
							else aktiv.delete(anpassung.id);
							this.plugin.einstellungen.kampfpunkteAnpassungen = [...aktiv];
							uebernehmen();
						})
				);
		}

		new Setting(containerEl).setName(t('einstellung.bibliothek')).setHeading();

		new Setting(containerEl)
			.setName(t('einstellung.ordner'))
			.setDesc(t('einstellung.ordnerBeschreibung'))
			.addText((feld) =>
				feld
					.setPlaceholder(t('einstellung.ordnerPlatzhalter'))
					.setValue(this.plugin.einstellungen.bibliotheksOrdner)
					.onChange((wert) => {
						this.plugin.einstellungen.bibliotheksOrdner = wert;
						void this.plugin.saveData(this.plugin.state);
						void this.plugin.ladeBibliothek(false);
					})
			);

		new Setting(containerEl)
			.setName(t('einstellung.duplikate'))
			.setDesc(t('einstellung.duplikateBeschreibung'))
			.addToggle((schalter) =>
				schalter.setValue(this.plugin.einstellungen.duplikateIgnorieren).onChange((wert) => {
					this.plugin.einstellungen.duplikateIgnorieren = wert;
					void this.plugin.saveData(this.plugin.state);
					void this.plugin.ladeBibliothek(false);
				})
			);

		new Setting(containerEl)
			.setName(t('einstellung.richtwerte'))
			.setDesc(t('einstellung.richtwerteBeschreibung'))
			.addToggle((schalter) =>
				schalter.setValue(this.plugin.einstellungen.richtwerteMelden).onChange((wert) => {
					this.plugin.einstellungen.richtwerteMelden = wert;
					uebernehmen();
				})
			);
	}
}
