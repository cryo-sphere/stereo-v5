import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { KSoftClient } from "@ksoft/api";

const ksoft = new KSoftClient(process.env.KSOFT_TOKEN ?? "");

@ApplyOptions<SlashCommand.Options>({
	name: "lyrics",
	preconditions: ["GuildOnly"],
	description: "Shows the lyrics for the playing song",
	tDescription: "music:lyrics.description",
	usage: "[title]",
	arguments: [
		{
			name: "title",
			description: "Song title",
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
		const title = args.getString("title") ?? player?.queue.current?.title;
		if (!title)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "music:lyrics.fail")
			);

		const lyrics = await ksoft.lyrics
			.search(title, { limit: 1, textOnly: false })
			.catch(() => void 0);
		if (!lyrics?.length)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "music:lyrics.noResult")
			);

		const track = lyrics[0];
		const embed = this.client.utils
			.embed()
			.setTitle(track.name)
			.setThumbnail(track.artwork)
			.setDescription(track.lyrics.substr(0, 4096))
			.setFooter("Api: ksoft.si")
			.setURL(`https://lyrics.ksoft.si/song/${track.id}/${track.name.replace(/ +/g, "-")}`);

		await interaction.followUp({ embeds: [embed] });
	}
}
