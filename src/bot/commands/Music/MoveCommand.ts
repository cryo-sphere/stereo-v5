import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "move",
	preconditions: ["GuildOnly"],
	description: "Moves a song from 1 place to another",
	tDescription: "music:move.description",
	usage: "<song> <location>",
	musicPermissions: ["EDIT_QUEUE"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "song",
				description: "The song to move",
				tDescription: "music:move.args.song",
				type: "INTEGER",
				required: true
			},
			{
				name: "location",
				description: "The location the song has to move to",
				tDescription: "music:move.args.location",
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

		if (!player.queue.next.length) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noQueue"));
			return;
		}

		const song = interaction.options.getInteger("song", true);
		const location = interaction.options.getInteger("location", true);

		if (song > player.queue.next.length || song < 1 || location > player.queue.next.length || location < 1) {
			await interaction.reply(
				this.translate.translate(interaction.guildId, "music:move.fail", {
					length: player.queue.next.length
				})
			);
			return;
		}

		player.queue.next.splice(location - 1, 0, player.queue.next.splice(song - 1, 1)[0]);

		await interaction.reply(
			this.translate.translate(interaction.guildId, "music:move.success", {
				position: song,
				location
			})
		);
	}
}
