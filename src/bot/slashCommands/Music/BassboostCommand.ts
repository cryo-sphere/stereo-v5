import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { Filter } from "@stereo-bot/lavalink";

@ApplyOptions<SlashCommand.Options>({
	name: "bassboost",
	preconditions: ["GuildOnly"],
	description: "Sets the bassboost level for the player",
	tDescription: "music:bassboost.description",
	arguments: [
		{
			name: "level",
			description: "the bassboost level",
			type: "STRING",
			required: true,
			choices: [
				{
					name: "Extreme",
					value: "bassboostExtreme",
				},
				{
					name: "Hard",
					value: "bassboostHard",
				},
				{
					name: "Medium",
					value: "bassboostMedium",
				},
				{
					name: "Low",
					value: "bassboostLow",
				},
				{
					name: "None",
					value: "none",
				},
			],
		},
	],
})
export default class BassboostCommand extends SlashCommand {
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

		const filter = args.getString("level", true) ?? {};
		player.filters.apply(filter === "none" ? {} : (filter as Filter));

		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "MusicGeneral:filter", {
				filter: filter.replace("bassboost", "bassboost - "),
			})
		);
	}
}
