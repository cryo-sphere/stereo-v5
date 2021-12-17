import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "remove",
	preconditions: ["GuildOnly"],
	description: "Skips the current song",
	tDescription: "music:skip.description",
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

		if (!player.queue.current) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noTrack"));
			return;
		}

		const config = this.client.config.get(interaction.guildId);
		if (!config) return;

		const voice = interaction.guild?.me?.voice;
		const required = voice?.channel?.members.filter((m) => !m.user.bot).size ?? 0;

		const skips = this.client.skips.get(player.guild);
		const current = skips?.length ?? 0;

		if (skips?.includes(interaction.user.id)) {
			await interaction.reply(
				this.translate.translate(interaction.guildId, "music:skip.fail", {
					current,
					required
				})
			);
			return;
		}

		if (required - (current + 1) <= 0 || required - 1 <= 0) {
			player.skip();
			return interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:skip"));
		}

		this.client.skips.set(interaction.guildId, [...(skips ?? []), interaction.user.id]);
		await interaction.reply(
			this.translate.translate(interaction.guildId, "music:skip.success", {
				current: current + 1,
				required
			})
		);
	}
}
