import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "volume",
	preconditions: ["GuildOnly"],
	description: "Changes the volume of the player",
	tDescription: "music:volume.description",
	musicPermissions: ["PLAYER_CONTROLS"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "volume",
				description: "The value to set the volume to",
				tDescription: "music:volume.args.volume",
				type: "INTEGER",
				required: true
			}
		]
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

		const volume = interaction.options.getInteger("volume", true);
		if (volume > 200 || volume < 1) {
			await interaction.reply(this.translate.translate(interaction.guildId, "music:volume.invalid"));

			return;
		}

		player.setVolume(volume);
		await interaction.reply(this.translate.translate(interaction.guildId, "music:volume.success", { volume }));
	}
}
