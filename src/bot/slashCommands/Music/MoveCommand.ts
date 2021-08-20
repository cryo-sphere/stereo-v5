import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "move",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Moves a song from 1 place to another",
	tDescription: "music:move.description",
	usage: "<song> <location>",
	arguments: [
		{
			name: "song",
			description: "The song to move",
			tDescription: "music:move.args.song",
			type: "INTEGER",
			required: true,
		},
		{
			name: "location",
			description: "The location the song has to move to",
			tDescription: "music:move.args.location",
			type: "INTEGER",
			required: true,
		},
	],
})
export default class MoveCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		const song = args.getInteger("song", true);
		const location = args.getInteger("location", true);

		if (
			song > player.queue.next.length ||
			song < 1 ||
			location > player.queue.next.length ||
			location < 1
		)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:move.fail", {
					length: player.queue.next.length,
				})
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		if (!player.queue.next.length)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noQueue")
			);

		player.queue.next.splice(location - 1, 0, player.queue.next.splice(song - 1, 1)[0]);

		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:move.success", {
				position: song,
				location,
			})
		);
	}
}
