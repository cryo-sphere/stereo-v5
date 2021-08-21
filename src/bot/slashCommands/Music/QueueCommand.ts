import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import {
	ButtonInteraction,
	CommandInteraction,
	Interaction,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
} from "discord.js";
import { Utils } from "@stereo-bot/lavalink";
import { v4 as uuid } from "uuid";

@ApplyOptions<SlashCommand.Options>({
	name: "queue",
	preconditions: ["GuildOnly"],
	description: "Shows all the songs in the queue",
	tDescription: "music:queue.description",
})
export default class QueueCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		const items: Item[] = player.queue.next.map((data, index) => ({
			title: data.title
				? data.title.length > 20
					? data.title.substring(0, 40)
					: data.title
				: "Unkown title",
			uri: data.externalUri ?? data.uri ?? "",
			duration: data.duration ?? 0,
			identifier: data.identifier ?? "",
			index,
		}));

		let page = 0;
		const current = player.queue.current;
		const requester = await this.client.utils.fetchUser(player.queue.current.requester);

		const embed = this.client.utils
			.embed()
			.setTitle(
				this.languageHandler.translate(interaction.guildId, "music:queue.embed.title", {
					name: interaction.guild?.name ?? "Unknown Guild",
				})
			)
			.setThumbnail(current.displayThumbnail("mqdefault"))
			.addField(
				this.languageHandler.translate(interaction.guildId, "music:queue.current", {
					requester: requester?.tag || "user#0000",
				}),
				`[${current.title.replace(/\[/g, "").replace(/\]/g, "")}](${
					current.uri
				}) - \`${Utils.convert(current.duration ?? 0)}\``
			);

		if (player.queue.next.length < 0) return interaction.reply({ embeds: [embed] });

		const maxPages = Math.ceil(player.queue.next.length / 10);
		if ((page > maxPages || page < 1) && maxPages !== 0) page = 1;

		const display = items.slice((page - 1) * 10, page * 10);
		const buttons = [
			new MessageButton()
				.setEmoji("◀")
				.setStyle("SECONDARY")
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.guildId}-previous`),
			new MessageButton()
				.setEmoji("🗑")
				.setStyle("DANGER")
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.guildId}-delete`),
			new MessageButton()
				.setEmoji("▶")
				.setStyle("SECONDARY")
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.guildId}-next`),
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
									`\`${(data.index + 1).toString().padStart(2, "0")}\` | \`${Utils.convert(
										data.duration
									)}\` - [${data.title.replace(/\[/g, "").replace(/\]/g, "").substr(0, 45)}](${
										data.uri
									})`
							)
							.join("\n")
					)
					.setFooter(
						this.languageHandler.translate(interaction.guildId, "music:queue.embed.footer", {
							page,
							maxPages,
						})
					),
			],
		});

		if (pages.length <= 1) return;
		this.pagination(interaction, pages, buttons, 12e4, page);
	}

	private generateEmbeds(items: Item[], base: MessageEmbed): MessageEmbed[] {
		const embeds: MessageEmbed[] = [];
		let count = 10;

		for (let i = 0; i < items.length; i += 10) {
			const current = items.slice(i, count);
			const map = current
				.map(
					(data) =>
						`\`${(data.index + 1).toString().padStart(2, "0")}\` | \`${Utils.convert(
							data.duration
						)}\` - [${data.title.replace(/\[/g, "").replace(/\]/g, "").substr(0, 45)}](${data.uri})`
				)
				.join("\n");
			count += 10;

			embeds.push(new MessageEmbed(base).setDescription(map));
		}

		return embeds;
	}

	private pagination(
		interaction: CommandInteraction,
		pages: MessageEmbed[],
		buttons: MessageButton[],
		timeout = 12e4,
		pageNumber = 1
	) {
		let page = pageNumber;
		if (!interaction.channel) return;

		const ids = buttons.map((c) => c.customId);
		const filter = (i: Interaction) =>
			i.isButton() && i.inGuild() && i.guildId === interaction.guildId && ids.includes(i.customId);
		const collector = interaction.channel.createMessageComponentCollector({
			time: timeout,
			filter,
		});

		collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
			switch (buttonInteraction.customId) {
				case ids[0]:
					page = page === 1 ? pages.length : page - 1;
					break;
				case ids[2]:
					page = page === pages.length ? 1 : page + 1;
					break;
				case ids[1]:
					await interaction.deleteReply().catch(() => void 0);
					collector.stop("deleted");
					break;
				default:
					break;
			}

			await buttonInteraction.deferUpdate().catch(() => void 0);
			await interaction
				.editReply({
					embeds: [
						pages[page - 1].setFooter(
							this.languageHandler.translate(interaction.guildId, "music:queue.embed.footer", {
								page,
								maxPages: pages.length,
							})
						),
					],
				})
				.catch(() => void 0);
		});

		collector.on("end", (_, reason) => {
			if (reason === "deleted") return;

			const disabledRow = new MessageActionRow().addComponents(
				buttons[0].setDisabled(true),
				buttons[1].setDisabled(true),
				buttons[2].setDisabled(true)
			);

			interaction
				.editReply({
					embeds: [
						pages[page - 1].setFooter(
							this.languageHandler.translate(interaction.guildId, "music:queue.embed.footer", {
								page,
								maxPages: pages.length,
							})
						),
					],
					components: [disabledRow],
				})
				.catch(() => void 0);
		});
	}
}

interface Item {
	title: string;
	uri: string;
	duration: number;
	identifier: string;
	index: number;
}
