import { ApplyOptions } from "@sapphire/decorators";
import { Utils } from "@stereo-bot/lavalink";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "remove",
	preconditions: ["GuildOnly"],
	description: "Seeks the current track to the timestamp",
	tDescription: "music:seek.description",
	usage: "<timestamp (ex: 10:30)>",
	musicPermissions: ["PLAYER_CONTROLS"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "timestamp",
				description: "The timestamp (ex: 10:30) to seek to",
				tDescription: "music:seek.args.timestamp",
				type: "STRING",
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

		let timestamp: number;
		try {
			timestamp = Utils.convert(interaction.options.getString("timestamp", true));
		} catch (e) {
			await interaction.reply(this.translate.translate(interaction.guildId, "music:seek.invalid"));
			return;
		}

		player.seek(timestamp);
		await interaction.reply(
			this.translate.translate(interaction.guildId, "music:seek.success", {
				seek: Utils.convert(timestamp)
			})
		);
	}
}
