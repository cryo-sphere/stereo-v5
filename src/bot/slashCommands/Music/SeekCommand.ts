import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { Utils } from "@stereo-bot/lavalink";

@ApplyOptions<SlashCommand.Options>({
	name: "Seek",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Seeks the current track to the timestamp",
	tDescription: "music:seek.description",
	arguments: [
		{
			name: "timestamp",
			description: "the timestamp (ex: 10:30) to seek to",
			type: "STRING",
			required: true,
		},
	],
})
export default class seekCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		let timestamp: number;
		try {
			timestamp = Utils.convert(args.getString("timestamp", true));
		} catch (e) {
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:seek.invalid")
			);
		}

		player.seek(timestamp);
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:seek.success", {
				seek: Utils.convert(timestamp),
			})
		);
	}
}
