import { App, PluginSettingTab, Setting } from "obsidian";
import type TelegramSidebarPlugin from "./main";

export interface TelegramSidebarSettings {
	telegramUsername: string;
	webVersion: "k" | "a";
	panelSide: "left" | "right";
	autoOpen: boolean;
}

export const DEFAULT_SETTINGS: TelegramSidebarSettings = {
	telegramUsername: "",
	webVersion: "k",
	panelSide: "right",
	autoOpen: false,
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
	}
}
