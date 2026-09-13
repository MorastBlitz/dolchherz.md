/**
 * Minimale Attrappen der Obsidian-Schnittstelle für den Prüflauf.
 *
 * `scripts/pruefe.mjs` bündelt die Prüfung mit esbuild und ersetzt das Modul
 * "obsidian" durch diese Datei. Dadurch lässt sich die Datenverarbeitung ohne
 * laufende Obsidian-Oberfläche prüfen. Die Datei wird nicht mit ausgeliefert.
 */

export class MarkdownRenderChild {
	constructor(public readonly containerEl: unknown) {}
	register(): void {}
}

export const MarkdownRenderer = {
	render: async (): Promise<void> => undefined,
};

export const setIcon = (): void => undefined;

export class Notice {
	constructor(_nachricht?: unknown) {}
}

export const requireApiVersion = (): boolean => true;

export const parseYaml = (): unknown => ({});

export const stringifyYaml = (): string => '';

export const debounce = <T,>(fn: T): T => fn;

export class Plugin {}

export class SuggestModal {}

export class PluginSettingTab {}

export class Setting {}

export class Menu {}

export class Editor {}

export class TFile {}

export class TFolder {}
