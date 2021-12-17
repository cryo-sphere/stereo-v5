import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "repeat",
	preconditions: ["GuildOnly"],
	description: "Changes the repeat mode",
	tDescription: "music:repeat.description",
	usage: "<mode>",
	musicPermissions: ["PLAYER_CONTROLS"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "mode",
				description: "The repeat mode",
				tDescription: "music:repeat.args.mode",
				type: "STRING",
				required: true,
				choices: [
					{
						name: "None",
						value: "none"
					},
					{
						name: "Song",
						value: "song"
					},
					{
						name: "Queue",
						value: "queue"
					}
				]
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

		const mode = interaction.options.getString("mode", true);
		if (mode === "queue") {
			player.queue.setRepeatQueue(true);
		} else if (mode === "song") {
			player.queue.setRepeatSong(true);
		} else {
			player.queue.setRepeatQueue(false);
			player.queue.setRepeatSong(false);
		}

		await interaction.reply(
			this.translate.translate(interaction.guildId, "music:repeat.success", {
				mode
			})
		);
	}
}
