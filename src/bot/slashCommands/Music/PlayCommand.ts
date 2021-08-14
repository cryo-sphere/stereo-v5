import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "play",
	preconditions: ["GuildOnly"],
	defaultPermission: true,
	description: "play command",
	arguments: [
		{
			name: "query",
			description: "search query",
			type: "STRING",
			required: true,
		},
	],
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		const player =
			this.client.manager.get(interaction.guild?.id as string) ||
			this.client.manager.create({ guild: interaction.guild?.id as string });

		if (!state || !state.channelId) return interaction.followUp("Not in a voice channel");
		if (player.channels.voice && state.channelId !== player.channels.voice)
			return interaction.followUp("Not in correct voice channel");

		const query = args.getString("query", true);
		const res = await player.search(query, interaction.user.id, "yt");

		switch (res.loadType) {
			case "LOAD_FAILED":
				return interaction.followUp(
					`Error while searching for your query: ${res.exception?.message}`
				);
			case "NO_MATCHES":
				return interaction.followUp("Nothing found for your search query");
			case "PLAYLIST_LOADED":
				player.queue.add(...res.tracks);
				interaction.followUp(`Successfully loaded playlist: **${res.playlistInfo?.name}**`);
				break;
			case "SEARCH_RESULT":
			case "TRACK_LOADED":
				player.queue.add(res.tracks[0]);
				interaction.followUp(`Successfully loaded track **${res.tracks[0].title}**`);
				break;
			default:
				break;
		}

		if (player.state === "DISCONNECTED")
			player.setVoice(state.channelId).setText(interaction.channelId).connect();
		if (!player.playing && !player.paused) player.play();
	}
}
