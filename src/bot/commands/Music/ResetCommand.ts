import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "reset",
	preconditions: ["GuildOnly"],
	description: "Resets the player and stops with playing",
	tDescription: "music:reset.description",
	cooldownDelay: 1e4,
	musicPermissions: ["EDIT_QUEUE", "PLAYER_CONTROLS"],
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

		player.stop();
		player.queue.reset();
		player.queue.setRepeatQueue(false);
		player.queue.setRepeatSong(false);
		player.filters.apply(null, true);
		player.position = 0;
		player.volume = 100;

		await interaction.reply(this.translate.translate(interaction.guildId, "music:reset.success"));
	}
}
