import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "repeat",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Changes the repeat mode",
	tDescription: "music:repeat.description",
	usage: "<mode>",
	arguments: [
		{
			name: "mode",
			description: "The repeat mode",
			type: "STRING",
			required: true,
			choices: [
				{
					name: "None",
					value: "none",
				},
				{
					name: "Song",
					value: "song",
				},
				{
					name: "Queue",
					value: "queue",
				},
			],
		},
	],
})
export default class RepeatCommand extends SlashCommand {
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

		const mode = args.getString("mode", true);
		if (mode === "queue") {
			player.queue.setRepeatQueue(true);
		} else if (mode === "song") {
			player.queue.setRepeatSong(true);
		} else {
			player.queue.setRepeatQueue(false);
			player.queue.setRepeatSong(false);
		}

		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:repeat.success", {
				mode,
			})
		);
	}
}
