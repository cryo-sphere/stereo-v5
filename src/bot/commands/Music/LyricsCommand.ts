import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";
import { Client as GeniusClient } from "genius-lyrics";

const genius = new GeniusClient(process.env.GENIUS ?? "");

@ApplyOptions<Command.Options>({
	name: "lyrics",
	preconditions: ["GuildOnly"],
	description: "Shows the lyrics for the playing song",
	tDescription: "music:lyrics.description",
	usage: "<query>",
	cooldownDelay: 5e3,
	cooldownLimit: 1,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "query",
				description: "The song title",
				tDescription: "music:lyrics.args.query",
				type: "STRING",
				required: false
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const player = this.client.manager.get(interaction.guildId);
		const title = interaction.options.getString("query") ?? `${player?.queue.current?.title}`;
		if (!title) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "music:lyrics.fail"));
			return;
		}

		const query = await genius.songs.search(title);
		const track = query[0];
		if (!track) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "music:lyrics.noResult"));
			return;
		}

		const lyrics = (await track?.lyrics().catch(() => null)) ?? null;
		if (!lyrics?.length) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "music:lyrics.noResult"));
			return;
		}

		const embed = this.client.utils
			.embed()
			.setTitle(track.title)
			.setThumbnail(track.thumbnail)
			.setDescription(lyrics.substring(0, 4095))
			.setFooter("Api: genius.com")
			.setURL(track.url);

		await interaction.followUp({ embeds: [embed] });
	}
}
