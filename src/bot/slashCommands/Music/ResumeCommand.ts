import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "resume",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Resumes the player",
	tDescription: "music:resume.description",
	cooldownDelay: 1e4,
})
export default class ResumeCommand extends SlashCommand {
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

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(
				player.channels.voice as string
			)) as VoiceChannel;

			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		if (!player.paused)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:resume.fail")
			);

		const timeout = this.client.timeouts.get(interaction.guildId);
		if (timeout) {
			clearTimeout(timeout);
			this.client.timeouts.delete(interaction.guildId);
		}

		player.pause(false);
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:resume.success")
		);
	}
}
