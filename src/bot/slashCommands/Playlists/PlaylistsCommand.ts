import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { v4 as uuid } from "uuid";

@ApplyOptions<SlashCommand.Options>({
	name: "playlists",
	preconditions: [],
	description: "Shows all the playlists you created",
	tDescription: "playlists:playlists.description",
})
export default class PlaylistsCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const playlists = await this.client.prisma.playlist.findMany({
			where: { userId: interaction.user.id },
		});
		if (!playlists)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "playlists:playlists.noResults")
			);

		const items: Item[] = playlists.map((data, index) => ({
			title: data.name ?? "Unkown name",
			uri: `https://stereo-bot.tk/playlists/${data.id}`,
			index,
		}));

		const embed = this.client.utils.embed().setTitle(
			this.languageHandler.translate(interaction.guildId, "playlists:playlists.embed.title", {
				name: interaction.user.username,
			})
		);

		let page = 0;
		const maxPages = Math.ceil(playlists.length / 10);
		if ((page > maxPages || page < 1) && maxPages !== 0) page = 1;

		const display = items.slice((page - 1) * 10, page * 10);
		const buttons = [
			new MessageButton()
				.setEmoji("◀")
				.setStyle("SECONDARY")
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.user.id}-previous`),
			new MessageButton()
				.setEmoji("🗑")
				.setStyle("DANGER")
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.user.id}-delete`),
			new MessageButton()
				.setEmoji("▶")
				.setStyle("SECONDARY")
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.user.id}-next`),
		];

		const pages = this.generateEmbeds(items, embed);

		await interaction.reply({
			components: pages.length <= 1 ? undefined : [new MessageActionRow().addComponents(buttons)],
			embeds: [
				embed
					.setDescription(
						display
							.map(
								(data) =>
									`\`${(data.index + 1).toString().padStart(2, "0")}\` - [${data.title
										.replace(/\[/g, "")
										.replace(/\]/g, "")
										.substr(0, 45)}](${data.uri})`
							)
							.join("\n")
					)
					.setFooter(
						this.languageHandler.translate(
							interaction.guildId,
							"playlists:playlists.embed.footer",
							{
								page,
								maxPages,
							}
						)
					),
			],
		});

		if (pages.length <= 1) return;
		this.client.utils.pagination(interaction, pages, buttons, 12e4, page);
	}

	private generateEmbeds(items: Item[], base: MessageEmbed): MessageEmbed[] {
		const embeds: MessageEmbed[] = [];
		let count = 10;

		for (let i = 0; i < items.length; i += 10) {
			const current = items.slice(i, count);
			const map = current
				.map(
					(data) =>
						`\`${(data.index + 1).toString().padStart(2, "0")}\` - [${data.title
							.replace(/\[/g, "")
							.replace(/\]/g, "")
							.substr(0, 45)}](${data.uri})`
				)
				.join("\n");
			count += 10;

			embeds.push(new MessageEmbed(base).setDescription(map));
		}

		return embeds;
	}
}

interface Item {
	title: string;
	uri: string;
	index: number;
}
