import { Command } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, VoiceChannel } from "discord.js";
import { v4 as uuid } from "uuid";

@ApplyOptions<Command.Options>({
	name: "playlists",
	description: "The playlists command, with multiple sub commands",
	tDescription: "playlists:playlists.description",
	cooldownDelay: 1e4,
	chatInputCommand: {
		messageCommand: true,
		register: true,
		options: [
			{
				name: "show",
				type: "SUB_COMMAND",
				description: "Shows all the playlists someone created",
				tDescription: "playlists:playlists.show.description"
			},
			{
				name: "create",
				type: "SUB_COMMAND",
				description: "Creates a new playlist with the provided name",
				tDescription: "playlists:playlists.create.description",
				options: [
					{
						name: "name",
						type: "STRING",
						description: "The name of the playlist (max: 32 characters)",
						required: true
					}
				]
			},
			{
				name: "delete",
				type: "SUB_COMMAND",
				description: "Deletes a playlist, requires the playlist id",
				tDescription: "playlists:playlists.delete.description",
				options: [
					{
						name: "playlist",
						type: "STRING",
						description: "The id/url of the playlist",
						required: true
					}
				]
			},
			{
				name: "update",
				type: "SUB_COMMAND",
				description: "Updates a playlist, requires the playlist id and the update type",
				tDescription: "playlists:playlists.update.description",
				options: [
					{
						name: "playlist",
						type: "STRING",
						description: "The id/url of the playlist",
						required: true
					},
					{
						name: "type",
						type: "STRING",
						description: "The update type",
						required: true,
						choices: [
							{
								name: "Add",
								value: "add"
							},
							{
								name: "Overwrite",
								value: "overwrite"
							}
						]
					}
				]
			}
		]
	}
})
export default class extends Command {
	private commands: Record<string, (interaction: CommandInteraction) => unknown | Promise<unknown>> = {
		show: this.show.bind(this),
		create: this.create.bind(this),
		delete: this.delete.bind(this),
		update: this.update.bind(this)
	};

	public async chatInputRun(interaction: CommandInteraction) {
		const subcommand = interaction.options.getSubcommand(true);
		const command = this.commands[subcommand];

		if (command) {
			await interaction.deferReply();
			await command(interaction);
			return;
		}

		await interaction.reply(this.translate.translate(interaction.guildId, "playlists:unknown"));
	}

	private async show(interaction: CommandInteraction) {
		const playlists = await this.client.prisma.playlist.findMany({
			where: { userId: interaction.user.id }
		});
		if (!playlists) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "playlists:playlists.noResults"));
			return;
		}

		const items: Item[] = playlists.map((data, index) => ({
			title: data.name ?? "Unkown name",
			uri: `https://stereo-bot.tk/playlists/${data.id}`,
			index
		}));

		const embed = this.client.utils.embed().setTitle(
			this.translate.translate(interaction.guildId, "playlists:playlists.show.embed.title", {
				name: interaction.user.username
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
				.setCustomId(`${uuid().slice(0, 20)}-${interaction.user.id}-next`)
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
									`\`${(data.index + 1).toString().padStart(2, "0")}\` - [${data.title
										.replace(/\[/g, "")
										.replace(/\]/g, "")
										.substr(0, 45)}](${data.uri})`
							)
							.join("\n")
					)
					.setFooter(
						this.translate.translate(interaction.guildId, "playlists:playlists.show.embed.footer", {
							page,
							maxPages
						})
					)
			]
		});

		if (pages.length <= 1) return;
		this.client.utils.pagination(interaction, pages, buttons, 12e4, page);
	}

	private async create(interaction: CommandInteraction) {
		const playlists = await this.client.prisma.playlist.findMany({
			where: { userId: interaction.user.id }
		});
		if (playlists.length >= 100) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "playlists:playlists.create.limit"));
			return;
		}

		const name = interaction.options.getString("name", true).slice(0, 32);
		const id = uuid();

		await this.client.prisma.playlist.create({
			data: { userId: interaction.user.id, name, id }
		});

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "playlists:playlists.create.success", {
				url: `https://stereo-bot.tk/playlists/${id}`,
				left: playlists.length + 1
			})
		);
	}

	private async delete(interaction: CommandInteraction) {
		const id = this.getId(interaction.options.getString("playlist", true));
		const playlist = await this.client.prisma.playlist.findFirst({
			where: { userId: interaction.user.id, id }
		});
		if (!playlist) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "playlists:playlists.noResult"));
			return;
		}

		await this.client.prisma.playlist.delete({
			where: { id: playlist.id }
		});

		const msg = `${playlist.name}\n--------------------------\n${playlist.songs
			.map((str, i) => `${i.toString().padStart(3, "0")} - ${str}`)
			.join("\n")}`;
		const attachment = new MessageAttachment(Buffer.from(msg, "utf-8"), `${playlist.name}-${playlist.userId}.txt`);
		let success = true;

		try {
			const dm = await interaction.user.createDM();
			await dm.send({ files: [attachment] });
		} catch (e) {
			console.log(e);
			success = false;
		}

		await interaction.followUp({
			content: this.translate.translate(interaction.guildId, `playlists:playlists.delete.success${success ? "" : "-file"}`, {
				name: playlist.name
			}),
			files: success ? [] : [attachment]
		});
	}

	private async update(interaction: CommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "BotGeneral:errors.preconditionGuildOnly"));
			return;
		}

		const id = this.getId(interaction.options.getString("playlist", true));
		const playlist = await this.client.prisma.playlist.findFirst({
			where: { userId: interaction.user.id, id }
		});
		if (!playlist) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "playlists:playlists.noResult"));
			return;
		}

		const player = this.client.manager.get(interaction.guildId);
		if (!player) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name
				})
			);
			return;
		}

		if (!player.queue.current) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "MusicGeneral:noTrack"));
			return;
		}

		let songs: string[] = [];
		const type = interaction.options.getString("type", true);
		if (type === "add") {
			const current = player.queue.current.externalUri || player.queue.current.uri;
			const next = player.queue.next.map((t) => t.externalUri || t.uri).filter((str) => Boolean(str)) as string[];

			songs = [...playlist.songs, current, ...next];
		} else {
			const current = player.queue.current.externalUri || player.queue.current.uri;
			const next = player.queue.next.map((t) => t.externalUri || t.uri).filter((str) => Boolean(str)) as string[];

			songs = [current, ...next];
		}

		songs = songs.slice(0, 100);
		await this.client.prisma.playlist.update({
			where: { id: playlist.id },
			data: { songs }
		});

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "playlists:playlists.update.success", {
				name: playlist.name
			})
		);
	}

	private getId(str: string): string {
		const regex = /(?:https:\/\/stereo-bot\.tk\/|stereo:)(playlists)?[\/:]([A-Za-z0-9|\-|_]{36})/;
		if (str.toLowerCase().startsWith("https://stereo-bot.tk/") || str.toLowerCase().startsWith("stereo:playlists/")) {
			const [, , id] = str.match(regex) ?? [];
			return id;
		}

		const match = str.match(/([A-Za-z0-9|\-|_]{36})/)?.[0] ?? "";
		return match;
	}

	private generateEmbeds(items: Item[], base: MessageEmbed): MessageEmbed[] {
		const embeds: MessageEmbed[] = [];
		let count = 10;

		for (let i = 0; i < items.length; i += 10) {
			const current = items.slice(i, count);
			const map = current
				.map(
					(data) =>
						`\`${(data.index + 1).toString().padStart(2, "0")}\` - [${data.title.replace(/\[/g, "").replace(/\]/g, "").substr(0, 45)}](${
							data.uri
						})`
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
