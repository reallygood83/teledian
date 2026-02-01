import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { VIEW_TYPE_TELEGRAM, TELEGRAM_WEB_K, TELEGRAM_WEB_A } from "./constants";
import type TelegramSidebarPlugin from "./main";
import type { BotTab } from "./settings";

interface WebviewEntry {
	el: HTMLElement;
	username: string;
	name: string;
}

export class TelegramView extends ItemView {
	plugin: TelegramSidebarPlugin;
	private tabBarEl: HTMLElement | null = null;
	private webviewContainerEl: HTMLElement | null = null;
	private webviews: Map<string, WebviewEntry> = new Map();
	private activeTabId: string = "default";

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

		this.tabBarEl = this.contentEl.createDiv({ cls: "telegram-sidebar-tab-bar" });
		this.webviewContainerEl = this.contentEl.createDiv({ cls: "telegram-sidebar-webview-container" });

		this.buildTabs();
	}

	async onClose(): Promise<void> {
		this.webviews.clear();
		this.tabBarEl = null;
		this.webviewContainerEl = null;
	}

	private buildTabs(): void {
		if (!this.tabBarEl || !this.webviewContainerEl) return;

		this.tabBarEl.empty();
		this.webviewContainerEl.empty();
		this.webviews.clear();

		const tabs: { id: string; name: string; username: string }[] = [];

		const defaultUsername = this.plugin.settings.telegramUsername;
		tabs.push({
			id: "default",
			name: defaultUsername || "Telegram",
			username: defaultUsername,
		});

		this.plugin.settings.botTabs.forEach((bot: BotTab, i: number) => {
			if (bot.username) {
				tabs.push({
					id: `tab-${i}`,
					name: bot.name || bot.username,
					username: bot.username,
				});
			}
		});

		const hasTabs = tabs.length > 1;
		this.tabBarEl.toggleClass("telegram-sidebar-tab-bar-hidden", !hasTabs);

		tabs.forEach((tab) => {
			const tabBtn = this.tabBarEl!.createEl("button", {
				text: tab.name,
				cls: "telegram-sidebar-tab-btn",
			});
			tabBtn.dataset.tabId = tab.id;
			tabBtn.addEventListener("click", () => this.switchTab(tab.id));

			const webviewEl = this.createWebview(tab.username);
			this.webviewContainerEl!.appendChild(webviewEl);

			this.webviews.set(tab.id, {
				el: webviewEl,
				username: tab.username,
				name: tab.name,
			});
		});

		this.activeTabId = tabs[0]?.id || "default";
		this.switchTab(this.activeTabId);
	}

	refreshTabs(): void {
		this.buildTabs();
	}

	private switchTab(tabId: string): void {
		this.activeTabId = tabId;

		this.webviews.forEach((entry, id) => {
			entry.el.toggleClass("telegram-sidebar-webview-active", id === tabId);
			entry.el.toggleClass("telegram-sidebar-webview-hidden", id !== tabId);
		});

		this.tabBarEl?.querySelectorAll(".telegram-sidebar-tab-btn").forEach((btn) => {
			const el = btn as HTMLElement;
			el.toggleClass("telegram-sidebar-tab-btn-active", el.dataset.tabId === tabId);
		});
	}

	private createWebview(username: string): HTMLElement {
		const doc = this.contentEl.doc;
		const webviewEl = doc.createElement("webview");

		const url = this.buildUrlForUsername(username);
		webviewEl.setAttribute("src", url);
		webviewEl.setAttribute("allowpopups", "");
		// persist partition with vault-specific appId to isolate sessions per vault
		webviewEl.setAttribute("partition", `persist:telegram-sidebar-${(this.app as any).appId}`);
		webviewEl.addClass("telegram-sidebar-webview");

		webviewEl.addEventListener("did-fail-load" as any, (event: any) => {
			// errorCode -3 is ERR_ABORTED (expected during navigation)
			if (event.errorCode !== -3) {
				console.error("Telegram Sidebar: Failed to load", event.errorDescription);
			}
		});

		webviewEl.addEventListener("new-window" as any, (event: any) => {
			if (event.url) {
				window.open(event.url);
			}
		});

		webviewEl.addEventListener("destroyed", () => {
			if (doc !== this.contentEl.doc) {
				webviewEl.detach();
				this.buildTabs();
			}
		});

		return webviewEl;
	}

	private getActiveWebview(): HTMLElement | null {
		const entry = this.webviews.get(this.activeTabId);
		return entry?.el || null;
	}

	private buildUrlForUsername(username: string): string {
		const base =
			this.plugin.settings.webVersion === "a" ? TELEGRAM_WEB_A : TELEGRAM_WEB_K;
		if (!username) {
			return base;
		}
		return `${base}#@${username}`;
	}

	buildUrl(): string {
		return this.buildUrlForUsername(this.plugin.settings.telegramUsername);
	}

	reload(): void {
		const webview = this.getActiveWebview();
		if (webview) {
			(webview as any).reload();
		}
	}

	navigateToChat(username: string): void {
		const webview = this.getActiveWebview();
		if (webview) {
			const url = this.buildUrlForUsername(username);
			(webview as any).loadURL(url);
		}
	}

	async insertTextToChat(text: string): Promise<void> {
		const webview = this.getActiveWebview();
		if (!webview) return;
		const escaped = text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
		const isVersionA = this.plugin.settings.webVersion === "a";

		// Telegram K: .input-message-input[contenteditable]
		// Telegram A: #editable-message-text[contenteditable]
		const selector = isVersionA
			? "#editable-message-text"
			: ".input-message-input";

		const js = `
			(function() {
				var el = document.querySelector('${selector}');
				if (!el) return false;
				el.focus();
				document.execCommand('insertText', false, '${escaped}');
				el.dispatchEvent(new Event('input', { bubbles: true }));
				return true;
			})();
		`;
		(webview as any).executeJavaScript(js, true);
	}

	async getSelectedText(): Promise<string> {
		const webview = this.getActiveWebview();
		if (!webview) return "";
		try {
			const text = await (webview as any).executeJavaScript(
				"window.getSelection().toString()",
				true
			);
			return text || "";
		} catch {
			return "";
		}
	}
}
