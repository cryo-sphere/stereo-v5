import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "join",
	preconditions: ["GuildOnly"],
	description: "Get Stereo to join your channel",
	tDescription: "music:join.description",
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		const player = this.client.manager.get(interaction.guildId) || this.client.manager.create({ guild: interaction.guildId });

		if (!state || !state.channelId) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "MusicGeneral:vc.none"));
			return;
		}

		if (player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.alreadyCreated", {
					voice: channel.name
				})
			);
			return;
		}

		if (!state.channel?.joinable) {
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.locked", {
					channel: state.channel?.name ?? "unknown channel"
				})
			);
			return;
		}

		player.setVoice(state.channelId).setText(interaction.channelId).connect();
		await interaction.followUp(
			this.translate.translate(interaction.guildId, "MusicGeneral:vc.connected", {
				channel: state.channel?.name ?? "unknown channel"
			})
		);
	}
}
