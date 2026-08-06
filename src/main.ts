import { FileSystemAdapter, Plugin, WorkspaceLeaf, MarkdownView, Notice } from "obsidian";
import { VIEW_TYPE_TELEGRAM } from "./constants";
import { TelegramView } from "./TelegramView";
import {
	TelegramSidebarSettingTab,
	TelegramSidebarSettings,
	DEFAULT_SETTINGS,
} from "./settings";

export default class TelegramSidebarPlugin extends Plugin {
	settings: TelegramSidebarSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_TELEGRAM, (leaf: WorkspaceLeaf) => {
			return new TelegramView(leaf, this);
		});

		this.addRibbonIcon("send", "Open Telegram sidebar", () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-sidebar",
			name: "Open sidebar",
			callback: () => void this.activateView(),
		});

		this.addCommand({
			id: "reload-telegram",
			name: "Reload Telegram",
			callback: () => this.reloadView(),
		});

		this.addCommand({
			id: "go-to-chat",
			name: "Go to chat",
			callback: () => {
				const view = this.getActiveView();
				if (view) {
					view.navigateToChat(this.settings.telegramUsername);
				} else {
					void this.activateView();
				}
			},
		});

		this.addCommand({
			id: "send-note-path-to-telegram",
			name: "Send current note path to Telegram",
			callback: () => void this.sendNotePathToTelegram(),
		});

		this.addCommand({
			id: "send-selection-to-telegram",
			name: "Send selected text to Telegram",
			editorCallback: (editor) => {
				const selectedText = editor.getSelection();
				if (!selectedText) {
					new Notice("No text selected");
					return;
				}
				const view = this.getActiveView();
				if (view) {
					void view.insertTextToChat(selectedText);
					new Notice("Text sent to Telegram input");
				} else {
					new Notice("Telegram sidebar is not open");
				}
			},
		});

		this.addCommand({
			id: "save-telegram-selection-to-note",
			name: "Save Telegram selection to note",
			checkCallback: (checking) => {
				const telegramView = this.getActiveView();
				const activeMarkdownLeaf = this.app.workspace
					.getLeavesOfType("markdown")
					.find((leaf) => leaf.view instanceof MarkdownView);

				if (!telegramView || !activeMarkdownLeaf) return false;
				if (checking) return true;

				void (async () => {
					const selectedText = await telegramView.getSelectedText();
					if (!selectedText) {
						new Notice("No text selected in Telegram");
						return;
					}

					const editor = (activeMarkdownLeaf.view as MarkdownView).editor;
					const cursor = editor.getCursor();
					editor.replaceRange(`\n${selectedText}\n`, cursor);
					new Notice("Telegram text saved to note");
				})();
				return true;
			},
		});

		this.addSettingTab(new TelegramSidebarSettingTab(this.app, this));

		if (this.settings.autoOpen) {
			this.app.workspace.onLayoutReady(() => {
				void this.activateView();
			});
		}
	}

	onunload(): void {}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		const existing = workspace.getLeavesOfType(VIEW_TYPE_TELEGRAM);
		if (existing.length > 0) {
			await workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf =
			this.settings.panelSide === "left"
				? workspace.getLeftLeaf(false)
				: workspace.getRightLeaf(false);

		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_TELEGRAM,
				active: true,
			});
			await workspace.revealLeaf(leaf);
		}
	}

	getActiveView(): TelegramView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TELEGRAM);
		if (leaves.length > 0) {
			return leaves[0].view as TelegramView;
		}
		return null;
	}

	reloadView(): void {
		const view = this.getActiveView();
		if (view) {
			view.reload();
		}
	}

	async sendNotePathToTelegram(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;

		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) return;
		const absolutePath = `${adapter.getBasePath()}/${activeFile.path}`;

		const view = this.getActiveView();
		if (!view) {
			await this.activateView();
			const newView = this.getActiveView();
			if (newView) {
				window.setTimeout(() => void newView.insertTextToChat(absolutePath), 1000);
			}
			return;
		}
		await view.insertTextToChat(absolutePath);
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<TelegramSidebarSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
