import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "pause",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Pauses the player",
	tDescription: "music:pause.description",
})
export default class PauseCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(
				player.channels.voice as string
			)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		if (player.paused)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:pause.fail")
			);

		player.pause(true);
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:pause.success")
		);
	}
}
