import { ApplyOptions } from "@sapphire/decorators";
import { Utils } from "@stereo-bot/lavalink";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "nowplaying",
	preconditions: ["GuildOnly"],
	description: "Shows the information about the current playing song",
	tDescription: "music:nowplaying.description",
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		const config = this.client.config.get(interaction.guildId);
		if (!player) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		if (!player.queue.current) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noTrack"));
			return;
		}

		const { current } = player.queue;
		const description = this.translate.translate(interaction.guildId, "music:nowplaying.embedDescription", {
			user: current.requester,
			volume: player.volume,
			bassboost: player.filters.enabledKey?.startsWith("bassboost") ? player.filters.enabledKey.replace("bassboost", "").toLowerCase() : "none",
			filter: player.filters.enabledKey?.startsWith("bassboost") ? "none" : player.filters.enabledKey?.toLowerCase() ?? "none",
			afk: emojis[config?.afk ? "greentick" : "redcross"],
			progress: `[${"▬".repeat(Math.floor((player.position / current.duration) * 15))}⚪${"▬".repeat(
				15 - Math.floor((player.position / current.duration) * 15)
			)}] - \`${Utils.convert(player.position) ?? "00:00"}\` / \`${Utils.convert(current.duration)}\``
		});

		await interaction.reply({
			embeds: [
				this.client.utils
					.embed()
					.setTitle(
						this.translate.translate(interaction.guildId, "music:nowplaying.title", {
							title: current.title
						})
					)
					.setURL(current.externalUri ?? current.uri)
					.setThumbnail(current.displayThumbnail("mqdefault"))
					.setDescription(description)
			]
		});
	}
}
