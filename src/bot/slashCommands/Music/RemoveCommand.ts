import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "remove",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Removes songs from 1 point to another",
	tDescription: "music:remove.description",
	usage: "<start> [end]",
	arguments: [
		{
			name: "start",
			description: "The start location",
			tDescription: "music:remove.args.start",
			type: "INTEGER",
			required: true,
		},
		{
			name: "end",
			description: "The end location",
			tDescription: "music:remove.args.end",
			type: "INTEGER",
			required: false,
		},
	],
})
export default class RemoveCommand extends SlashCommand {
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

		const start = args.getInteger("start", true);
		const end = args.getInteger("end") ?? 1;

		if (start > player.queue.next.length || start < 1 || end > player.queue.next.length || end < 1)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:remove.fail", {
					length: player.queue.next.length,
				})
			);

		const tracks = player.queue.remove(start - 1, end);

		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:remove.success", {
				amount: tracks.length,
			})
		);
	}
}
