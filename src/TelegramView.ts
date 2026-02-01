import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_TELEGRAM, TELEGRAM_WEB_K, TELEGRAM_WEB_A } from "./constants";
import type TelegramSidebarPlugin from "./main";

export class TelegramView extends ItemView {
	plugin: TelegramSidebarPlugin;
	private webviewEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: TelegramSidebarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TELEGRAM;
	}

	getDisplayText(): string {
		return "Telegram";
	}

	getIcon(): string {
		return "send";
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("telegram-sidebar-container");
		this.createWebview();
	}

	async onClose(): Promise<void> {
		this.webviewEl = null;
	}

	private createWebview(): void {
		const doc = this.contentEl.doc;
		this.webviewEl = doc.createElement("webview");

		this.webviewEl.setAttribute("src", this.buildUrl());
		this.webviewEl.setAttribute("allowpopups", "");
		// persist partition with vault-specific appId to isolate sessions per vault
		this.webviewEl.setAttribute("partition", `persist:telegram-sidebar-${(this.app as any).appId}`);
		this.webviewEl.addClass("telegram-sidebar-webview");

		this.webviewEl.addEventListener("did-fail-load" as any, (event: any) => {
			// errorCode -3 is ERR_ABORTED (expected during navigation)
			if (event.errorCode !== -3) {
				console.error("Telegram Sidebar: Failed to load", event.errorDescription);
				this.showError(event.errorDescription);
			}
		});

		this.webviewEl.addEventListener("new-window" as any, (event: any) => {
			if (event.url) {
				window.open(event.url);
			}
		});

		this.webviewEl.addEventListener("destroyed", () => {
			if (doc !== this.contentEl.doc) {
				this.webviewEl?.detach();
				this.createWebview();
			}
		});

		this.contentEl.appendChild(this.webviewEl as unknown as HTMLElement);
	}

	buildUrl(): string {
		const base =
			this.plugin.settings.webVersion === "a" ? TELEGRAM_WEB_A : TELEGRAM_WEB_K;
		const username = this.plugin.settings.telegramUsername;
		if (!username) {
			return base;
		}
		return `${base}#@${username}`;
	}

	reload(): void {
		if (this.webviewEl) {
			(this.webviewEl as any).reload();
		}
	}

	navigateToChat(username: string): void {
		if (this.webviewEl) {
			const base =
				this.plugin.settings.webVersion === "a" ? TELEGRAM_WEB_A : TELEGRAM_WEB_K;
			const url = username ? `${base}#@${username}` : base;
			(this.webviewEl as any).loadURL(url);
		}
	}

	private showError(errorDescription: string): void {
		const errorEl = this.contentEl.createDiv({ cls: "telegram-sidebar-error" });
		errorEl.createEl("h3", { text: "Failed to load Telegram Web" });
		errorEl.createEl("p", { text: errorDescription || "Unknown error" });
		errorEl.createEl("p", {
			text: "Please check your internet connection and try reloading.",
		});
		const reloadBtn = errorEl.createEl("button", { text: "Reload" });
		reloadBtn.addEventListener("click", () => {
			errorEl.remove();
			this.reload();
		});
	}
}
