import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "disconnect",
	preconditions: ["GuildOnly"],
	description: "Disconnects from the voice channel",
	tDescription: "music:disconnect.description",
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name
				})
			);

			return;
		}

		const channel = (await this.client.utils.getChannel(player.channels.voice ?? "")) as VoiceChannel;

		player.destroy();
		await interaction.reply(
			this.translate.translate(interaction.guildId, "MusicGeneral:vc.disconnected", {
				channel: channel.name ?? "deleted-channel"
			})
		);
	}
}
