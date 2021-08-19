import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "clear",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Clears the queue (except the current song)",
	tDescription: "music:clear.description",
})
export default class ClearCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		if (!player.queue.next.length)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noQueue")
			);

		player.queue.next = [];
		player.queue.previous = [];
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:clear.success")
		);
	}
}
