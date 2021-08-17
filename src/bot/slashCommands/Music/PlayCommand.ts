import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";
import { Utils } from "@stereo-bot/lavalink";
import axios from "axios";

@ApplyOptions<SlashCommand.Options>({
	name: "play",
	preconditions: ["GuildOnly"],
	description: "Play a song",
	tDescription: "music:play.description",
	usage: "<query> [type (YouTube/SoundCloud/Radio)",
	arguments: [
		{
			name: "query",
			description: "The Search Query",
			type: "STRING",
			required: true,
		},
		{
			name: "type",
			description: "Search type (you don't need it when searching via url)",
			type: "STRING",
			required: false,
			choices: [
				{
					name: "YouTube",
					value: "yt",
				},
				{
					name: "SoundCloud",
					value: "sc",
				},
				{
					name: "Radio",
					value: "radio",
				},
			],
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

		let query = args.getString("query", true);
		let type: string | null = args.getString("type");
		if (type === "radio") {
			const api = `https://de1.api.radio-browser.info/json/stations/byname/${query}`;
			const { data } = await axios.get(api).catch(() => ({ data: null }));

			if (!data)
				return interaction.followUp(
					this.languageHandler.translate(interaction.guildId, "music:play.noResults")
				);

			type = null;
			query = data[0].url_resolved || data[0].url;
		} else {
			type = type ?? "yt";
		}

		const res = await player.search(query, interaction.user.id, type as "yt" | "sc");
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
							track: track.title || "unknown title",
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
			player.play();
		}
	}
}
