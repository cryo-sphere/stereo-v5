import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "remove",
	preconditions: ["GuildOnly"],
	description: "Removes songs from 1 point to another",
	tDescription: "music:remove.description",
	usage: "<start> [end]",
	musicPermissions: ["EDIT_QUEUE"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "start",
				description: "The start location",
				tDescription: "music:remove.args.start",
				type: "INTEGER",
				required: true
			},
			{
				name: "end",
				description: "The end location",
				tDescription: "music:remove.args.end",
				type: "INTEGER",
				required: false
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

		const start = interaction.options.getInteger("start", true);
		const end = interaction.options.getInteger("end") ?? 1;

		if (start > player.queue.next.length || start < 1 || end > player.queue.next.length || end < 1)
			return interaction.reply(
				this.translate.translate(interaction.guildId, "music:remove.fail", {
					length: player.queue.next.length
				})
			);

		const tracks = player.queue.remove(start - 1, end);

		await interaction.reply(
			this.translate.translate(interaction.guildId, "music:remove.success", {
				amount: tracks.length
			})
		);
	}
}
