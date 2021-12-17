import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "pause",
	preconditions: ["GuildOnly"],
	description: "Pauses the player",
	tDescription: "music:pause.description",
	cooldownDelay: 1e4,
	musicPermissions: ["PLAYER_CONTROLS"],
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

		if (player.paused) {
			await interaction.reply(this.translate.translate(interaction.guildId, "music:pause.fail"));
			return;
		}

		const config = this.client.config.get(player.guild);
		if (!config?.afk) {
			const timeout = setTimeout(() => player.destroy(), 12e4);
			this.client.timeouts.set(player.guild, timeout);
		}

		player.pause(true);
		await interaction.reply(this.translate.translate(interaction.guildId, "music:pause.success"));
	}
}
