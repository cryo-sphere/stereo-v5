import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";
import { Utils } from "@stereo-bot/lavalink";

@ApplyOptions<SlashCommand.Options>({
	name: "play",
	preconditions: ["GuildOnly"],
	description: "Play a song",
	tDescription: "music:play.description",
	arguments: [
		{
			name: "query",
			description: "Search Query",
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
			this.client.manager.get(interaction.guildId) ||
			this.client.manager.create({ guild: interaction.guildId });

		if (!state || !state.channelId)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.none")
			);
		if (player.channels.voice && state.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		const query = args.getString("query", true);
		const res = await player.search(query, interaction.user.id, "yt");
		const config = this.client.config.get(interaction.guildId);

		switch (res.loadType) {
			case "LOAD_FAILED":
				return interaction.followUp(
					this.languageHandler.translate(interaction.guildId, "MusicGeneral:error", {
						error: res.exception?.message ?? "unknown loading error",
					})
				);
			case "NO_MATCHES":
				return interaction.followUp(
					this.languageHandler.translate(interaction.guildId, "music:play.noResults")
				);
			case "PLAYLIST_LOADED":
				player.queue.add(...res.tracks);
				await interaction.followUp(
					this.languageHandler.translate(interaction.guildId, "music:play.playlistLoaded", {
						playlist: res.playlistInfo?.name,
						duration: Utils.convert(res.playlistInfo?.duration ?? 0),
					})
				);
				break;
			case "SEARCH_RESULT":
			case "TRACK_LOADED":
				{
					const track = res.tracks[0];
					player.queue.add(track);

					await interaction.followUp(
						this.languageHandler.translate(interaction.guildId, "music:play.trackLoaded", {
							track: track.title,
							duration: Utils.convert(track.duration ?? 0),
						})
					);
				}
				break;
			default:
				break;
		}

		if (player.state === "DISCONNECTED")
			player.setVoice(state.channelId).setText(interaction.channelId).connect();
		if (!player.playing && !player.paused) {
			if (config?.autoshuffle) player.queue.shuffle();
			if (config?.autorepeat) player.queue.setRepeatQueue(true);

			player.play();
		}
	}
}
