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
	botTabs: BotTab[];
}

export const DEFAULT_SETTINGS: TelegramSidebarSettings = {
	telegramUsername: "",
	webVersion: "k",
	panelSide: "right",
	autoOpen: false,
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

		new Setting(containerEl)
			.setName("Telegram username")
			.setDesc(
				"Enter the username of the bot, user, or channel to open on launch (without @). Leave empty to show the main Telegram screen."
			)
			.addText((text) =>
				text
					.setPlaceholder("E.g. Moltbot")
					.setValue(this.plugin.settings.telegramUsername)
					.onChange(async (value) => {
						this.plugin.settings.telegramUsername = value.trim().replace(/^@/, "");
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Telegram web version")
			.setDesc("K version is lightweight. A version is React-based with modern UI.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("k", "K (lightweight)")
					.addOption("a", "A (modern React)")
					.setValue(this.plugin.settings.webVersion)
					.onChange(async (value) => {
						this.plugin.settings.webVersion = value as "k" | "a";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Panel side")
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
			.setName("Auto open on startup")
			.setDesc("Automatically open the Telegram sidebar when Obsidian starts.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoOpen)
					.onChange(async (value) => {
						this.plugin.settings.autoOpen = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Bot tabs")
			.setDesc("Add multiple bots/chats as tabs. Switch between them in the sidebar.")
			.setHeading();

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
						.setPlaceholder("Username (without @)")
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
			btn.setButtonText("Add tab").setCta().onClick(async () => {
				this.plugin.settings.botTabs.push({ name: "", username: "" });
				await this.plugin.saveSettings();
				this.display();
			})
		);
	}
}
