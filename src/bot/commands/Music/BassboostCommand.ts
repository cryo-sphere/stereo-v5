import { ApplyOptions } from "@sapphire/decorators";
import type { Filter } from "@stereo-bot/lavalink";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

const bassboosts = [
	{
		name: "Extreme",
		value: "bassboostExtreme"
	},
	{
		name: "Hard",
		value: "bassboostHard"
	},
	{
		name: "Medium",
		value: "bassboostMedium"
	},
	{
		name: "Low",
		value: "bassboostLow"
	},
	{
		name: "None",
		value: "none"
	}
];

@ApplyOptions<Command.Options>({
	name: "bassboost",
	preconditions: ["GuildOnly"],
	description: "Sets the bassboost level for the player",
	tDescription: "music:bassboost.description",
	usage: "<level>",
	cooldownDelay: 15e3,
	musicPermissions: ["FILTERS"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "level",
				description: "The bassboost level",
				tDescription: "music:bassboost.args.level",
				type: "STRING",
				required: true,
				choices: bassboosts
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

		if (!player.queue.current) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noTrack"));
			return;
		}

		const filter = interaction.options.getString("level", true);
		player.filters.apply(filter === "none" ? null : (filter as Filter));

		await interaction.reply(
			this.translate.translate(interaction.guildId, "MusicGeneral:filter", {
				filter: `bassboost - ${bassboosts.find((x) => x.value === filter)?.name}`
			})
		);
	}
}
