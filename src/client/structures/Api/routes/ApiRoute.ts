import { Logger } from "@daangamesdg/logger";
import { Guild } from "@prisma/client";
import { Request, Response, Router } from "express";
import Client from "../../../Client";
import Utils from "../utils";

export class ApiRoute {
	public router: Router;
	public utils: Utils;

	constructor(public client: Client, public logger: Logger) {
		this.utils = new Utils(client);
		this.router = Router();
		this.router
			.get("/user", this.user.bind(this))
			.get("/guilds", this.guilds.bind(this))
			.get("/guild", this.guild.bind(this))
			.post("/guild/update", this.updateGuild.bind(this));
	}

	private async user(req: Request, res: Response) {
		if (!req.auth) return res.sendStatus(204);

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
		if (!req.auth) return res.sendStatus(204);

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

		const config = this.client.config.get(guild.id) ?? {
			djrole: "",
			language: "english",
			defaultvolume: 100,
			defaultfilter: "none",
			defaultbassboost: "none",
			autoshuffle: false,
			autorepeat: false,
			announce: true,
			deleteAnnounce: true,
			afk: false,
			partner: false,
		};

		const member = await this.client.utils.fetchMember(req.auth.userId, guild);
		if (!member || !member.permissions.has("ADMINISTRATOR", true)) return res.send(null);

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
			languages: Object.keys(this.client.languageHandler.languages).map((lang) => ({
				key: this.utils.capitalize(lang),
				value: lang,
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
			if (!member || !member.permissions.has("ADMINISTRATOR", true)) return res.send(null);

			const valid: Guild = {
				...config,
				...body.data,
				afk: config?.partner ? body.data.afk : false,
				partner: config?.partner ?? false,
			};
			await this.client.prisma.guild.update({ where: { id: body.guildId }, data: valid });
			this.client.config.set(body.guildId, valid);
			res.sendStatus(204);
		} catch (e) {
			this.logger.fatal("ApiRoute#updateGuild", e);
			res.status(500).send("unexpected error occured");
		}
	}
}
