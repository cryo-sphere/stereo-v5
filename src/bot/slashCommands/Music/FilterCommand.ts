import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";
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
	preconditions: ["GuildOnly", "DJRole"],
	description: "Sets the filter for the player",
	tDescription: "music:filter.description",
	usage: "<level>",
	arguments: [
		{
			name: "level",
			description: "The filter you want to use",
			tDescription: "music:filter.args.level",
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

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

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
