import { SlashCommand, SlashCommandRegistrar } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { exec } from "child_process";

@ApplyOptions<SlashCommand.Options>({
	name: "update",
	description: "Updates the bot (devs only)",
	preconditions: ["OwnerOnly"],
	arguments: [
		{
			name: "fetch",
			description: "fetch the code",
			type: "BOOLEAN",
			required: false,
		},
		{
			name: "restart",
			description: "restart the bot",
			type: "BOOLEAN",
			required: false,
		},
		{
			name: "update-deps",
			description: "update the deps",
			type: "BOOLEAN",
			required: false,
		},
		{
			name: "update-langs",
			description: "update the languages",
			type: "BOOLEAN",
			required: false,
		},
		{
			name: "update-slash",
			description: "update the slash commands",
			type: "BOOLEAN",
			required: false,
		},
	],
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		this.container.client.loggers
			.get("bot")
			?.info(`Executing update - requested by ${interaction.user.tag}`);

		const fetch = args.getBoolean("fetch") ?? true;
		const restart = args.getBoolean("restart") ?? true;
		const update = args.getBoolean("update-deps") ?? true;
		const langs = args.getBoolean("update-langs") ?? false;
		const slash = args.getBoolean("update-slash") ?? false;
		await interaction.reply(">>> 🤖 | **Update Command**");

		if (fetch) {
			await interaction.editReply(">>> 🤖 | **Update Command**\nFetching code from GitHub...");
			await this.Exec("git pull");
		}

		if (update) {
			await interaction.editReply(">>> 🤖 | **Update Command**\nInstalling new Dependencies...");
			await this.Exec("yarn install");
		}

		if (langs) {
			await interaction.editReply(">>> 🤖 | **Update Command**\nUpdating the languages...");
			this.client.languageHandler.loadAll();
		}

		if (slash) {
			await interaction.editReply(">>> 🤖 | **Update Command**\nUpdating the slash commands...");

			const registrar = new SlashCommandRegistrar();
			registrar.initializeData(this.client);
			await registrar.testGuildRegister();
			await registrar.supportGuildRegister();
			if (process.env.NODE_ENV === "production") await registrar.globalRegister();

			this.client.loggers.get("bot")?.info("Slash commands successfully refreshed!");
		}

		if (restart) {
			await interaction.editReply(">>> 🤖 | **Update Command**\nBot is updated - restarting...");
			return process.exit(0);
		}

		await interaction.editReply(
			">>> 🤖 | **Update Command**:\nUpdate completed, no restart executed!"
		);
	}

	private async Exec(command: string) {
		return new Promise((res, rej) =>
			exec(command, { cwd: process.cwd() }, (e, str) => (e ? rej(e) : res(str)))
		);
	}
}
