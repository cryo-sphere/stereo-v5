/* eslint-disable no-inline-comments */
import { Logger } from "@daangamesdg/logger";
import { Guild } from "@prisma/client";
import { Request, Response, Router } from "express";
import Client from "../../../Client";
import { bassboost, defaultConfig, filters } from "../../../constants/settings";
import Utils from "../utils";

export class ApiRoute {
	public router: Router;
	public utils: Utils;

	constructor(public client: Client, public logger: Logger) {
		this.utils = new Utils(client);
		this.router = Router();
		this.router
			.get("/user", this.user.bind(this)) // get user
			.get("/guilds", this.guilds.bind(this)) // get guilds
			.get("/guild", this.guild.bind(this)) // get guild with config
			.post("/guild", this.updateGuild.bind(this)) // update guild
			.get("/playlists", this.playlists.bind(this)) // get playlists
			.get("/playlist", this.playlists.bind(this)) // get playlist with songs
			.put("/playlist", this.playlists.bind(this)) // create playlist
			.post("/playlist", this.playlists.bind(this)) // update playlist
			.delete("/playlist", this.playlists.bind(this)); // delete playlist
	}

	private async playlists(req: Request, res: Response) {
		if (!req.auth) return res.send(null);

		try {
			let playlists = this.client.ApiCache.get(`${req.auth.userId}-playlists`);
			if (!playlists) {
				const data = await this.client.prisma.playlist.findMany({
					where: { userId: req.auth.userId },
				});
				playlists = data.map((pl) => ({ id: pl.id, name: pl.name }));
				this.utils.setCache(`${req.auth.userId}-playlists`, playlists);
			}

			if (!playlists) throw new Error("unable to get playlists");

			res.send(playlists);
		} catch (e) {
			res.status(500).json({ message: "internal server error", error: e.message });
		}
	}

	private async user(req: Request, res: Response) {
		if (!req.auth) return res.send(null);

		try {
			const user =
				this.client.ApiCache.get(`${req.auth.userId}-user`) ??
				(await this.utils.getUser(req.auth.token, req.auth.userId));
			if (!user) throw new Error("unable to get user");

			res.send({ ...user, admin: this.client.isOwner(user.id) });
		} catch (e) {
			res.status(500).json({ message: "internal server error", error: e.message });
		}
	}

	private async guilds(req: Request, res: Response) {
		if (!req.auth) return res.send(null);

		try {
			const guilds =
				this.client.ApiCache.get(`${req.auth.userId}-guilds`) ??
				(await this.utils.getGuilds(req.auth.token, req.auth.userId));
			if (!guilds) throw new Error("unable to get guilds");

			res.send(this.utils.sortGuilds(guilds));
		} catch (e) {
			console.log(e);
			res.status(500).json({ message: "internal server error", error: e.message });
		}
	}

	private async guild(req: Request, res: Response) {
		const { guildId } = req.query;
		if (!guildId || !req.auth) return res.send(null);

		const guild = this.client.guilds.cache.get(this.utils.parseQuery(guildId));
		if (!guild) return res.send(null);

		const config = this.client.config.get(guild.id) ?? defaultConfig;

		const member = await this.client.utils.fetchMember(req.auth.userId, guild);
		if (!member || !member.permissions.has("MANAGE_GUILD", true)) return res.send(null);

		res.send({
			icon: guild.icon,
			name: guild.name,
			id: guild.id,
			partner: config.partner,
			roles: guild.roles.cache
				.map((r) => ({
					id: r.id,
					name: r.name,
					colour: r.hexColor,
					position: r.position,
					managed: r.managed || (guild.me?.roles.highest.position ?? 0) <= r.position,
				}))
				.sort((a, b) => b.position - a.position),
			config: { ...config, djrole: config.djrole ?? "" },
			languages: Object.keys(this.client.languageHandler.languageKeys).map((lang) => ({
				key: this.utils.capitalize(lang),
				value: this.client.languageHandler.languageKeys[lang],
			})),
			filters: [
				"none",
				"timescale",
				"karaoke",
				"tremolo",
				"pop",
				"eightD",
				"slowed",
				"vaporwave",
				"nightcore",
				"soft",
			],
			bassboost: ["none", "low", "medium", "hard", "extreme"],
		});
	}

	private async updateGuild(req: Request, res: Response) {
		if (!req.auth) return res.send(null);

		const body = req.body as {
			guildId: string;
			data: Guild;
		};
		if (!body || !body.guildId || !body.data) return res.sendStatus(400);

		const guild = this.client.guilds.cache.get(body.guildId);
		const config = this.client.config.get(body.guildId);
		if (!guild) return res.sendStatus(404);

		try {
			const member = await this.client.utils.fetchMember(req.auth.userId, guild);
			if (!member || !member.permissions.has("MANAGE_GUILD", true)) return res.send(null);

			const { data } = body;
			const valid: Guild = this.validate(guild.id, config as Guild, data);

			await this.client.prisma.guild.update({ where: { id: body.guildId }, data: valid });
			this.client.config.set(body.guildId, valid);
			res.sendStatus(204);
		} catch (e) {
			this.logger.fatal("ApiRoute#updateGuild", e);
			res.status(500).send("unexpected error occured");
		}
	}

	private validate(guild: string, config: Guild, data: Guild): Guild {
		data.afk = data.afk ?? config.afk ?? false;
		data.announce = data.announce ?? config.announce ?? true;
		data.autorepeat = data.autorepeat ?? data.autorepeat ?? false;
		data.autoshuffle = data.autoshuffle ?? config.autoshuffle ?? false;
		data.defaultbassboost = data.defaultbassboost || config.defaultbassboost || "none";
		data.defaultfilter = data.defaultfilter || config.defaultfilter || "none";
		data.defaultvolume =
			data.defaultvolume > 201 || data.defaultvolume < 1
				? config.defaultvolume ?? 100
				: data.defaultvolume;
		data.deleteAnnounce = data.deleteAnnounce ?? config.deleteAnnounce ?? true;
		data.djrole = data.djrole ?? config.djrole ?? "";
		data.id = guild;
		data.language = data.language ?? config.djrole ?? "en-US";
		data.partner = config.partner;

		return {
			afk: config.partner ? data.afk : false,
			announce: typeof data.announce === "boolean" ? data.announce : true,
			autorepeat: typeof data.autorepeat === "boolean" ? data.autorepeat : true,
			autoshuffle: typeof data.autoshuffle === "boolean" ? data.autoshuffle : true,
			deleteAnnounce: typeof data.deleteAnnounce === "boolean" ? data.deleteAnnounce : true,
			defaultbassboost: bassboost.includes(data.defaultbassboost) ? data.defaultbassboost : "none",
			defaultfilter: filters.includes(data.defaultfilter) ? data.defaultfilter : "none",
			defaultvolume: typeof data.defaultvolume === "number" ? data.defaultvolume : 100,
			djrole: typeof data.djrole === "string" ? data.djrole : "",
			id: data.id,
			partner: data.partner,
			language: Object.keys(this.client.languageHandler.languages).includes(data.language)
				? data.language
				: "en-US",
		};
	}
}
