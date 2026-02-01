import { App, PluginSettingTab, Setting } from "obsidian";
import type TelegramSidebarPlugin from "./main";

export interface BotTab {
	name: string;
	username: string;
}

export interface TelegramSidebarSettings {
	telegramUsername: string;
	webVersion: "k" | "a";
	panelSide: "left" | "right";
	autoOpen: boolean;
	customCSS: string;
	botTabs: BotTab[];
}

export const DEFAULT_SETTINGS: TelegramSidebarSettings = {
	telegramUsername: "",
	webVersion: "k",
	panelSide: "right",
	autoOpen: false,
	customCSS: "",
	botTabs: [],
};

export class TelegramSidebarSettingTab extends PluginSettingTab {
	plugin: TelegramSidebarPlugin;

	constructor(app: App, plugin: TelegramSidebarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Telegram Sidebar Settings" });

		new Setting(containerEl)
			.setName("Telegram Username")
			.setDesc(
				"Enter the username of the bot, user, or channel to open on launch (without @). Leave empty to show the main Telegram screen."
			)
			.addText((text) =>
				text
					.setPlaceholder("e.g. moltbot")
					.setValue(this.plugin.settings.telegramUsername)
					.onChange(async (value) => {
						this.plugin.settings.telegramUsername = value.trim().replace(/^@/, "");
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Telegram Web Version")
			.setDesc("K version is lightweight. A version is React-based with modern UI.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("k", "K (Lightweight)")
					.addOption("a", "A (Modern React)")
					.setValue(this.plugin.settings.webVersion)
					.onChange(async (value) => {
						this.plugin.settings.webVersion = value as "k" | "a";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Panel Side")
			.setDesc("Which side of the workspace to open the Telegram panel.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("right", "Right")
					.addOption("left", "Left")
					.setValue(this.plugin.settings.panelSide)
					.onChange(async (value) => {
						this.plugin.settings.panelSide = value as "left" | "right";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Auto Open on Startup")
			.setDesc("Automatically open the Telegram sidebar when Obsidian starts.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoOpen)
					.onChange(async (value) => {
						this.plugin.settings.autoOpen = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h2", { text: "Custom CSS" });

		new Setting(containerEl)
			.setName("Custom CSS for Telegram Web")
			.setDesc("CSS injected into Telegram Web on load. Use to customize appearance, hide elements, or match your Obsidian theme.")
			.addTextArea((textarea) => {
				textarea.inputEl.rows = 10;
				textarea.inputEl.cols = 50;
				textarea.inputEl.addClass("telegram-sidebar-css-textarea");
				textarea
					.setPlaceholder("e.g.\nbody { background: #1e1e1e !important; }\n.sidebar { display: none !important; }")
					.setValue(this.plugin.settings.customCSS)
					.onChange(async (value) => {
						this.plugin.settings.customCSS = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", { text: "Bot Tabs" });

		containerEl.createEl("p", {
			text: "Add multiple bots/chats as tabs. Switch between them in the sidebar.",
			cls: "setting-item-description",
		});

		this.plugin.settings.botTabs.forEach((tab, index) => {
			const s = new Setting(containerEl)
				.setName(`Tab ${index + 1}`)
				.addText((text) =>
					text
						.setPlaceholder("Display name")
						.setValue(tab.name)
						.onChange(async (value) => {
							this.plugin.settings.botTabs[index].name = value;
							await this.plugin.saveSettings();
						})
				)
				.addText((text) =>
					text
						.setPlaceholder("username (without @)")
						.setValue(tab.username)
						.onChange(async (value) => {
							this.plugin.settings.botTabs[index].username = value.trim().replace(/^@/, "");
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton((btn) =>
					btn.setIcon("trash").setTooltip("Remove tab").onClick(async () => {
						this.plugin.settings.botTabs.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					})
				);
			s.infoEl.remove();
		});

		new Setting(containerEl).addButton((btn) =>
			btn.setButtonText("Add Tab").setCta().onClick(async () => {
				this.plugin.settings.botTabs.push({ name: "", username: "" });
				await this.plugin.saveSettings();
				this.display();
			})
		);
	}
}
