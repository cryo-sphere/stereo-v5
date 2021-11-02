import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { Client as GeniusClient } from "genius-lyrics";

const genius = new GeniusClient(process.env.GENIUS ?? "");

@ApplyOptions<SlashCommand.Options>({
	name: "lyrics",
	preconditions: ["GuildOnly"],
	description: "Shows the lyrics for the playing song",
	tDescription: "music:lyrics.description",
	usage: "<query>",
	cooldownDelay: 5e3,
	cooldownLimit: 1,
	arguments: [
		{
			name: "query",
			description: "The song title",
			tDescription: "music:lyrics.args.query",
			type: "STRING",
			required: false,
		},
	],
})
export default class LyricsCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const player = this.client.manager.get(interaction.guildId);
		const title = args.getString("query") ?? `${player?.queue.current?.title}`;
		if (!title)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "music:lyrics.fail")
			);

		const query = await genius.songs.search(title);
		const track = query[0];
		if (!track)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "music:lyrics.noResult")
			);

		const lyrics = (await track?.lyrics().catch(() => null)) ?? null;
		if (!lyrics?.length)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "music:lyrics.noResult")
			);

		const embed = this.client.utils
			.embed()
			.setTitle(track.title)
			.setThumbnail(track.thumbnail)
			.setDescription(lyrics.substr(0, 4096))
			.setFooter("Api: genius.com")
			.setURL(track.url);

		await interaction.followUp({ embeds: [embed] });
	}
}
