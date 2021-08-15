import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { Filter } from "@stereo-bot/lavalink";

const filters = [
	{
		name: "Karaoke",
		value: "karaoke",
	},
	{
		name: "Tremolo",
		value: "tremolo",
	},
	{
		name: "Pop",
		value: "pop",
	},
	{
		name: "8D",
		value: "eightD",
	},
	{
		name: "Slowed",
		value: "slowed",
	},
	{
		name: "Vaporwave",
		value: "vaporwave",
	},
	{
		name: "Nightcore",
		value: "nightcore",
	},
	{
		name: "Soft",
		value: "soft",
	},
	{
		name: "None",
		value: "none",
	},
];

@ApplyOptions<SlashCommand.Options>({
	name: "filter",
	preconditions: ["GuildOnly"],
	description: "Sets the filter for the player",
	tDescription: "music:filter.description",
	arguments: [
		{
			name: "level",
			description: "the filter you want to use",
			type: "STRING",
			required: true,
			choices: filters,
		},
	],
})
export default class FilterCommand extends SlashCommand {
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

		const filter = args.getString("level", true);
		player.filters.apply(filter === "none" ? null : (filter as Filter));

		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "MusicGeneral:filter", {
				filter: filters.find((x) => x.value === filter)?.name,
			})
		);
	}
}
