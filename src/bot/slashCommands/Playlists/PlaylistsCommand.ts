import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import {
	CommandInteraction,
	MessageActionRow,
	MessageAttachment,
	MessageButton,
	MessageEmbed,
	VoiceChannel,
} from "discord.js";
import { v4 as uuid } from "uuid";

@ApplyOptions<SlashCommand.Options>({
	name: "playlists",
	description: "The playlists command, with multiple sub commands",
	tDescription: "playlists:playlists.description",
	arguments: [
		{
			name: "show",
			type: "SUB_COMMAND",
			description: "Shows all the playlists someone created",
			tDescription: "playlists:playlists.show.description",
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
					required: true,
				},
			],
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
					required: true,
				},
			],
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
					required: true,
				},
				{
					name: "type",
					type: "STRING",
					description: "The update type",
					required: true,
					choices: [
						{
							name: "Add",
							value: "add",
						},
						{
							name: "Overwrite",
							value: "overwrite",
						},
					],
				},
			],
		},
	],
})
export default class PlaylistsCommand extends SlashCommand {
	private commands: Record<
		string,
		(interaction: CommandInteraction, args: SlashCommand.Args) => unknown | Promise<unknown>
	> = {
		show: this.show.bind(this),
		create: this.create.bind(this),
		delete: this.delete.bind(this),
		update: this.update.bind(this),
	};

	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		const subcommand = args.getSubcommand(true);
		const command = this.commands[subcommand];

		if (command) {
			await interaction.deferReply();
			return command(interaction, args);
		}

		return interaction.reply(
			this.languageHandler.translate(interaction.guildId, "playlists:unknown")
		);
	}

	private async show(interaction: CommandInteraction) {
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
			this.languageHandler.translate(interaction.guildId, "playlists:playlists.show.embed.title", {
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
						this.languageHandler.translate(
							interaction.guildId,
							"playlists:playlists.show.embed.footer",
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

	private async create(interaction: CommandInteraction, args: SlashCommand.Args) {
		const playlists = await this.client.prisma.playlist.findMany({
			where: { userId: interaction.user.id },
		});
		if (playlists.length >= 100)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "playlists:playlists.create.limit")
			);

		const name = args.getString("name", true).slice(0, 32);
		const id = uuid();

		await this.client.prisma.playlist.create({
			data: { userId: interaction.user.id, name, id },
		});

		return interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "playlists:playlists.create.success", {
				url: `https://stereo-bot.tk/playlists/${id}`,
				left: playlists.length + 1,
			})
		);
	}

	private async delete(interaction: CommandInteraction, args: SlashCommand.Args) {
		const id = this.getId(args.getString("playlist", true));
		const playlist = await this.client.prisma.playlist.findFirst({
			where: { userId: interaction.user.id, id },
		});
		if (!playlist)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "playlists:playlists.noResult")
			);

		await this.client.prisma.playlist.delete({
			where: { id: playlist.id },
		});

		const msg = `${playlist.name}\n--------------------------\n${playlist.songs
			.map((str, i) => `${i.toString().padStart(3, "0")} - ${str}`)
			.join("\n")}`;
		const attachment = new MessageAttachment(
			Buffer.from(msg, "utf-8"),
			`${playlist.name}-${playlist.userId}.txt`
		);
		let success = true;

		try {
			const dm = await interaction.user.createDM();
			await dm.send({ files: [attachment] });
		} catch (e) {
			console.log(e);
			success = false;
		}

		return interaction.followUp({
			content: this.languageHandler.translate(
				interaction.guildId,
				`playlists:playlists.delete.success${success ? "" : "-file"}`,
				{
					name: playlist.name,
				}
			),
			files: success ? [] : [attachment],
		});
	}

	private async update(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild())
			return interaction.followUp(
				this.languageHandler.translate(
					interaction.guildId,
					"BotGeneral:errors.preconditionGuildOnly"
				)
			);

		const id = this.getId(args.getString("playlist", true));
		const playlist = await this.client.prisma.playlist.findFirst({
			where: { userId: interaction.user.id, id },
		});
		if (!playlist)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "playlists:playlists.noResult")
			);

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		if (!player.queue.current)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		let songs: string[] = [];
		const type = args.getString("type", true);
		if (type === "add") {
			const current = player.queue.current.externalUri || player.queue.current.uri;
			const next = player.queue.next
				.map((t) => t.externalUri || t.uri)
				.filter((str) => !!str) as string[];

			songs = [...playlist.songs, current, ...next];
		} else {
			const current = player.queue.current.externalUri || player.queue.current.uri;
			const next = player.queue.next
				.map((t) => t.externalUri || t.uri)
				.filter((str) => !!str) as string[];

			songs = [current, ...next];
		}

		songs = songs.slice(0, 100);
		await this.client.prisma.playlist.update({
			where: { id: playlist.id },
			data: { songs },
		});

		return interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "playlists:playlists.update.success", {
				name: playlist.name,
			})
		);
	}

	private getId(str: string): string {
		// eslint-disable-next-line no-useless-escape
		const regex = /(?:https:\/\/stereo-bot\.tk\/|stereo:)(playlists)?[\/:]([A-Za-z0-9|\-|_]{36})/;
		if (
			str.toLowerCase().startsWith("https://stereo-bot.tk/") ||
			str.toLowerCase().startsWith("stereo:playlists/")
		) {
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
