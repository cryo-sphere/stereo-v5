import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";
import { Filter } from "@stereo-bot/lavalink";

const bassboosts = [
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
];

@ApplyOptions<SlashCommand.Options>({
	name: "bassboost",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Sets the bassboost level for the player",
	tDescription: "music:bassboost.description",
	usage: "<level>",
	cooldownDelay: 15e3,
	cooldownLimit: 1,
	arguments: [
		{
			name: "level",
			description: "The bassboost level",
			tDescription: "music:bassboost.args.level",
			type: "STRING",
			required: true,
			choices: bassboosts,
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

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
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
				filter: `bassboost - ${bassboosts.find((x) => x.value === filter)?.name}`,
			})
		);
	}
}
