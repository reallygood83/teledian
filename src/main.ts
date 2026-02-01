import { Plugin, WorkspaceLeaf, MarkdownView, Notice } from "obsidian";
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

		this.addRibbonIcon("send", "Open Telegram Sidebar", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-telegram-sidebar",
			name: "Open Telegram Sidebar",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "reload-telegram",
			name: "Reload Telegram",
			callback: () => this.reloadView(),
		});

		this.addCommand({
			id: "go-to-chat",
			name: "Go to Chat",
			callback: () => {
				const view = this.getActiveView();
				if (view) {
					view.navigateToChat(this.settings.telegramUsername);
				} else {
					this.activateView();
				}
			},
		});

		this.addCommand({
			id: "send-note-path-to-telegram",
			name: "Send Current Note Path to Telegram",
			callback: () => this.sendNotePathToTelegram(),
		});

		this.addCommand({
			id: "send-selection-to-telegram",
			name: "Send Selected Text to Telegram",
			editorCallback: (editor) => {
				const selectedText = editor.getSelection();
				if (!selectedText) {
					new Notice("No text selected");
					return;
				}
				const view = this.getActiveView();
				if (view) {
					view.insertTextToChat(selectedText);
					new Notice("Text sent to Telegram input");
				} else {
					new Notice("Telegram sidebar is not open");
				}
			},
		});

		this.addCommand({
			id: "save-telegram-selection-to-note",
			name: "Save Telegram Selection to Note",
			callback: async () => {
				const telegramView = this.getActiveView();
				if (!telegramView) {
					new Notice("Telegram sidebar is not open");
					return;
				}

				const selectedText = await telegramView.getSelectedText();
				if (!selectedText) {
					new Notice("No text selected in Telegram");
					return;
				}

				const markdownLeaf = this.app.workspace.getLeavesOfType("markdown");
				const activeMarkdownLeaf = markdownLeaf.find(
					(leaf) => leaf.view instanceof MarkdownView
				);

				if (!activeMarkdownLeaf) {
					new Notice("No active note to save to");
					return;
				}

				const editor = (activeMarkdownLeaf.view as MarkdownView).editor;
				const cursor = editor.getCursor();
				editor.replaceRange(`\n${selectedText}\n`, cursor);
				new Notice("Telegram text saved to note");
			},
		});

		this.addSettingTab(new TelegramSidebarSettingTab(this.app, this));

		if (this.settings.autoOpen) {
			this.app.workspace.onLayoutReady(() => {
				this.activateView();
			});
		}
	}

	async onunload(): Promise<void> {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TELEGRAM);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		const existing = workspace.getLeavesOfType(VIEW_TYPE_TELEGRAM);
		if (existing.length > 0) {
			workspace.revealLeaf(existing[0]);
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
			workspace.revealLeaf(leaf);
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

		const vaultBasePath = (this.app.vault.adapter as any).basePath;
		const absolutePath = `${vaultBasePath}/${activeFile.path}`;

		const view = this.getActiveView();
		if (!view) {
			await this.activateView();
			const newView = this.getActiveView();
			if (newView) {
				setTimeout(() => newView.insertTextToChat(absolutePath), 1000);
			}
			return;
		}
		view.insertTextToChat(absolutePath);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
