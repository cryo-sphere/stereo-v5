import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Utils } from "@stereo-bot/lavalink";
import axios from "axios";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "play",
	preconditions: ["GuildOnly"],
	description: "Play a song",
	tDescription: "music:play.description",
	usage: "<query> [type]",
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "query",
				description: "The Search Query",
				tDescription: "music:play.args.query",
				type: "STRING",
				required: true
			},
			{
				name: "type",
				description: "Search type (you don't need it when searching via url)",
				tDescription: "music:play.args.type",
				type: "STRING",
				required: false,
				choices: [
					{
						name: "YouTube",
						value: "yt"
					},
					{
						name: "SoundCloud",
						value: "sc"
					},
					{
						name: "Radio",
						value: "radio"
					}
				]
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		const player = this.client.manager.get(interaction.guildId) || this.client.manager.create({ guild: interaction.guildId });

		if (!state || !state.channelId) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "MusicGeneral:vc.none"));
			return;
		}
		if (player.channels.voice && state.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;

			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name
				})
			);
			return;
		}

		if (!state.channel?.joinable) {
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.locked", {
					channel: state.channel?.name ?? "unknown channel"
				})
			);
			return;
		}

		let query = interaction.options.getString("query", true);
		let type: string | null = interaction.options.getString("type");
		if (type === "radio") {
			const api = `https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(query)}`;
			const { data } = await axios.get(api).catch(() => ({ data: null }));

			if (!data) {
				await interaction.followUp(this.translate.translate(interaction.guildId, "music:play.noResults"));
				return;
			}

			type = null;
			query = data[0]?.url_resolved || data[0]?.url;
			if (!query) {
				await interaction.followUp(this.translate.translate(interaction.guildId, "music:play.noResults"));
				return;
			}
		} else {
			type = type ? (["yt", "sc"].includes(type) ? type : "yt") : "yt";
		}

		const res = await player.search(query, interaction.user.id, type as "yt" | "sc");
		const config = this.client.config.get(interaction.guildId);

		switch (res.loadType) {
			case "LOAD_FAILED":
				await interaction.followUp(
					this.translate.translate(interaction.guildId, "MusicGeneral:error", {
						error: res.exception?.message ?? "unknown loading error"
					})
				);
				return;
			case "NO_MATCHES":
				await interaction.followUp(this.translate.translate(interaction.guildId, "music:play.noResults"));
				return;
			case "PLAYLIST_LOADED":
				player.queue.add(...res.tracks);
				await interaction.followUp(
					this.translate.translate(interaction.guildId, "music:play.playlistLoaded", {
						playlist: res.playlistInfo?.name,
						duration: Utils.convert(res.playlistInfo?.duration ?? 0)
					})
				);
				break;
			case "SEARCH_RESULT":
			case "TRACK_LOADED":
				{
					const track = res.tracks[0];
					player.queue.add(track);

					await interaction.followUp(
						this.translate.translate(interaction.guildId, "music:play.trackLoaded", {
							track: track.title || "unknown title",
							duration: Utils.convert(track.duration ?? 0)
						})
					);
				}
				break;
			default:
				break;
		}

		if (!player.connected) player.setVoice(state.channelId).setText(interaction.channelId).connect();
		if (!player.playing && !player.paused) {
			if (config?.autoshuffle) player.queue.shuffle();
			void player.play();
		}
	}
}
