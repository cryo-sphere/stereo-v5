import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Command } from "../../../client";
import { v4 as uuid } from "uuid";
import { Utils } from "@stereo-bot/lavalink";

@ApplyOptions<Command.Options>({
	name: "queue",
	preconditions: ["GuildOnly"],
	description: "Shows all the songs in the queue",
	tDescription: "music:queue.description",
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		if (!player.queue.current) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noTrack"));
			return;
		}

		const items: Item[] = player.queue.next.map((data, index) => ({
			title: data.title ? (data.title.length > 20 ? data.title.substring(0, 40) : data.title) : "Unkown title",
			uri: data.externalUri ?? data.uri ?? "",
			duration: data.duration ?? 0,
			identifier: data.identifier ?? "",
			index
		}));

		await interaction.deferReply();

		let page = 0;
		const { current } = player.queue;
		const requester = await this.client.utils.fetchUser(player.queue.current.requester);

		const embed = this.client.utils
			.embed()
			.setTitle(
				this.translate.translate(interaction.guildId, "music:queue.embed.title", {
					name: interaction.guild?.name ?? "Unknown Guild"
				})
			)
			.setThumbnail(current.displayThumbnail("mqdefault"))
			.addField(
				this.translate.translate(interaction.guildId, "music:queue.embed.current", {
					requester: requester?.tag || "user#0000"
				}),
				`[${current.title.replace(/\[/g, "").replace(/\]/g, "")}](${current.uri}) - \`${Utils.convert(current.duration ?? 0)}\``
			);

		if (player.queue.next.length < 0) {
			await interaction.followUp({ embeds: [embed] });
			return;
		}

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
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.guildId}-next`)
		];

		const pages = this.generateEmbeds(items, embed);

		await interaction.followUp({
			components: pages.length <= 1 ? undefined : [new MessageActionRow().addComponents(buttons)],
			embeds: [
				embed
					.setDescription(
						display
							.map(
								(data) =>
									`\`${(data.index + 1).toString().padStart(2, "0")}\` | \`${Utils.convert(data.duration)}\` - [${data.title
										.replace(/\[/g, "")
										.replace(/\]/g, "")
										.substring(0, 45)}](${data.uri})`
							)
							.join("\n")
					)
					.setFooter(
						this.translate.translate(interaction.guildId, "music:queue.embed.footer", {
							page,
							maxPages
						})
					)
			]
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
						`\`${(data.index + 1).toString().padStart(2, "0")}\` | \`${Utils.convert(data.duration)}\` - [${data.title
							.replace(/\[/g, "")
							.replace(/\]/g, "")
							.substring(0, 45)}](${data.uri})`
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
	duration: number;
	identifier: string;
	index: number;
}
