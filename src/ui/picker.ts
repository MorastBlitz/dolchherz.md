import { type App, type Editor, SuggestModal, stringifyYaml } from 'obsidian';
import { t } from '../i18n';
import type { Bibliothekseintrag } from '../model/library';
import { neueKartenId } from '../model/keys';
import type { Roh } from '../types';

/**
 * Suchdialog über die Bibliothek.
 *
 * Der Dialog kennt die Kartentypen nur über die übergebene Liste; ein
 * zusätzlicher Typ erscheint ohne Änderung an dieser Datei.
 */
export class Kartenmodal extends SuggestModal<Bibliothekseintrag> {
	constructor(
		app: App,
		private readonly editor: Editor,
		private readonly eintraege: Bibliothekseintrag[]
	) {
		super(app);
		this.limit = 200;
		this.setPlaceholder(t('suche.platzhalter'));
	}

	getSuggestions(suche: string): Bibliothekseintrag[] {
		const begriff = suche.trim().toLowerCase();
		if (begriff === '') return this.eintraege;

		return this.eintraege.filter((eintrag) => {
			const karte = eintrag.karte;
			return (
				karte.name.toLowerCase().includes(begriff) ||
				(karte.typ ?? '').toLowerCase().includes(begriff) ||
				(karte.beschreibung ?? '').toLowerCase().includes(begriff)
			);
		});
	}

	renderSuggestion(eintrag: Bibliothekseintrag, el: HTMLElement): void {
		const karte = eintrag.karte;
		const kopf = el.createDiv({ cls: 'dho-verteilt' });
		kopf.createEl('b', { text: karte.name });

		const angaben = [
			eintrag.definition.untertitel(karte),
			karte.herkunft === 'vault' ? t('suche.eigene') : '',
		].filter((angabe) => angabe !== '');

		kopf.createSpan({ text: angaben.join(' · '), cls: 'dho-kleiner dho-gedaempft' });
		el.createDiv({
			text: eintrag.definition.beschreibung(karte),
			cls: 'dho-kleiner dho-gedaempft',
		});
	}

	onChooseSuggestion(eintrag: Bibliothekseintrag): void {
		const karte = eintrag.karte;
		const daten: Roh = { ...karte.roh, art: karte.art, id: neueKartenId() };
		const yaml = stringifyYaml(daten).trim();
		this.editor.replaceSelection(`\`\`\`dolchherz\n${yaml}\n\`\`\`\n`);
	}
}
