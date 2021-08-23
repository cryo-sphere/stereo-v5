import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "reset",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Resets the player and stops with playing",
	tDescription: "music:reset.description",
	cooldownDelay: 1e4,
})
export default class ResetCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

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
