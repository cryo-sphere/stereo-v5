import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "reset",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Resets the player and stops with playing",
	tDescription: "music:reset.description",
})
export default class ClearCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		player.stop();
		player.queue.reset();
		player.queue.setRepeatQueue(false);
		player.queue.setRepeatSong(false);
		player.filters.apply(null, true);
		player.position = 0;
		player.volume = 100;

		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:reset.success")
		);
	}
}
