import { type App, Modal, Setting } from 'obsidian';
import { t } from '../i18n';

/**
 * Kleiner Bestätigungsdialog für Schritte, die sich nicht rückgängig machen
 * lassen. Aktuell nur für das Entfernen eines Wertekastens aus einer Notiz.
 */
export class Bestaetigungsmodal extends Modal {
	constructor(
		app: App,
		private readonly titel: string,
		private readonly text: string,
		private readonly bestaetigen: () => void
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(this.titel);
		this.contentEl.createEl('p', { text: this.text });
		this.contentEl.createEl('p', {
			text: t('dialog.loeschenHinweis'),
			cls: 'dho-kleiner dho-gedaempft',
		});

		new Setting(this.contentEl)
			.addButton((knopf) =>
				knopf.setButtonText(t('dialog.abbrechen')).onClick(() => this.close())
			)
			.addButton((knopf) =>
				knopf
					.setButtonText(t('dialog.loeschen'))
					.setWarning()
					.onClick(() => {
						this.close();
						this.bestaetigen();
					})
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
