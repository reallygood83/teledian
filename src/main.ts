import { Plugin, WorkspaceLeaf } from "obsidian";
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

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
