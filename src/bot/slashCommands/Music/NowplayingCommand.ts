import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { Utils } from "@stereo-bot/lavalink";

@ApplyOptions<SlashCommand.Options>({
	name: "nowplaying",
	preconditions: ["GuildOnly"],
	description: "Shows the information about the current playing song",
	tDescription: "music:nowplaying.description",
})
export default class NowplayingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		const config = this.client.config.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		const current = player.queue.current;
		const description = this.languageHandler.translate(
			interaction.guildId,
			"music:nowplaying.embedDescription",
			{
				user: current.requester,
				volume: player.volume,
				bassboost: player.filters.enabledKey?.startsWith("bassboost")
					? player.filters.enabledKey.replace("bassboost", "").toLowerCase()
					: "none",
				filter: player.filters.enabledKey?.startsWith("bassboost")
					? "none"
					: player.filters.enabledKey?.toLowerCase() ?? "none",
				afk: this.client.constants.emojis[config?.afk ? "greentick" : "redcross"],
				progress: `[${
					"▬".repeat(Math.floor((player.position / current.duration) * 15)) +
					"⚪" +
					"▬".repeat(15 - Math.floor((player.position / current.duration) * 15))
				}] - \`${Utils.convert(player.position) ?? "00:00"}\` / \`${Utils.convert(
					current.duration
				)}\``,
			}
		);

		await interaction.reply({
			embeds: [
				this.client.utils
					.embed()
					.setTitle(
						this.languageHandler.translate(interaction.guildId, "music:nowplaying.title", {
							title: current.title,
						})
					)
					.setURL(current.externalUri ?? current.uri)
					.setThumbnail(current.displayThumbnail("mqdefault"))
					.setDescription(description),
			],
		});
	}
}
