/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ArgumentStore,
	CommandStore,
	ListenerStore,
	PreconditionStore,
	SapphireClient,
} from "@sapphire/framework";
import {
	ActivitiesOptions,
	BitFieldResolvable,
	Collection,
	IntentsString,
	PartialTypes,
	PresenceStatusData,
} from "discord.js";
import { join } from "path";
import Logger from "./structures/Logger";
import Utils from "./Utils";
import * as constants from "./constants";
import BlacklistManager from "./structures/BlacklistManager";
import { Guild, PrismaClient } from "@prisma/client";
import { SlashCommandStore, SlashCommandPreconditionStore } from "./structures/slashCommands";
import { Deezer, Manager, Spotify } from "@stereo-bot/lavalink";
import languageHandler from "./structures/languageHandler";
import { LavalinkListenerStore } from "./structures/lavalinkListener";
import { Api, AuthCookie } from "./structures/Api";
import { StereoPlaylist } from "./structures/plugins/StereoPlaylist";

import "./structures/plugins/StereoTrack";

export default class Client extends SapphireClient {
	public owners: string[];
	public constants = constants;

	public isOwner(id: string): boolean {
		return this.owners.includes(id);
	}

	public prisma = new PrismaClient();
	public manager = new Manager(
		[
			{
				id: "main",
				host: "localhost",
				port: 2333,
				password: "youshallnotpass",
			},
		],
		{
			send: (guildId, payload) => {
				const guild = this.guilds.cache.get(guildId);
				if (guild) guild.shard.send(payload);
			},
			plugins: [
				new Deezer(),
				new StereoPlaylist(),
				new Spotify({
					clientId: process.env.CLIENT_ID,
					clientSecret: process.env.CLIENT_SECRET,
				}),
			],
		}
	);

	public skips = new Collection<string, string[]>();
	public loggers = new Collection<string, Logger>();
	public config = new Collection<string, Guild>();
	public announcements = new Collection<string, string>();
	public timeouts = new Collection<string, NodeJS.Timeout>();
	public ApiCache = new Collection<string, any>();

	public blacklistManager = new BlacklistManager(this);
	public languageHandler = new languageHandler(this);
	public utils = new Utils(this);
	public Api: Api;

	constructor(options: ClientOptions) {
		super({
			intents: options.intents,
			allowedMentions: { users: [], roles: [], repliedUser: false },
			baseUserDirectory: join(__dirname, "..", "bot"),
			partials: options.partials,
			loadDefaultErrorListeners: false,
			presence: {
				activities: options.activity,
				status: options.status,
			},
		});

		this.owners = options.owners;

		const botLogger = new Logger({ name: "BOT", webhook: process.env.LOGS });
		this.loggers.set("bot", botLogger);

		const DataLogger = new Logger({ name: "DB", webhook: process.env.LOGS });
		this.loggers.set("db", DataLogger);

		const LavalinkLogger = new Logger({ name: "LAVALINK", webhook: process.env.LOGS });
		this.loggers.set("lavalink", LavalinkLogger);

		const ApiLogger = new Logger({ name: "API", webhook: process.env.LOGS });
		this.loggers.set("api", ApiLogger);

		this.Api = new Api(this);

		if (options.debug)
			this.on("debug", (msg) => {
				botLogger.debug(msg);
			});

		this.stores
			.register(new SlashCommandStore())
			.register(new SlashCommandPreconditionStore())
			.register(new LavalinkListenerStore());

		this.ws
			.on("VOICE_SERVER_UPDATE", (data) => this.manager.voiceServerUpdate(data))
			.on("VOICE_STATE_UPDATE", (data) => this.manager.voiceStateUpdate(data));
		
		process.on("unhandledRejection", this.handleRejection.bind(this));
	}

	private handleRejection(reason: unknown) {
		this.loggers.get("bot")?.error("Unhandled rejection: ", reason);
	}

	public async start(): Promise<void> {
		await this.prisma.$connect();
		this.loggers.get("db")?.info("Successfully connected to postgreSQL Database via Prisma!");

		const blacklisted = await this.prisma.botBlacklist.findMany();
		this.blacklistManager.setBlacklisted(blacklisted.map((b) => b.id));

		await this.login(process.env.TOKEN);
	}
}

interface ClientOptions {
	intents: BitFieldResolvable<IntentsString, number>;
	owners: string[];
	partials?: PartialTypes[] | undefined;
	activity?: ActivitiesOptions[] | undefined;
	status?: PresenceStatusData | undefined;
	debug?: boolean;
}

declare module "@sapphire/framework" {
	// eslint-disable-next-line @typescript-eslint/no-shadow
	class SapphireClient {
		constants: typeof constants;
		owners: string[];
		isOwner(id: string): boolean;

		utils: Utils;
		languageHandler: languageHandler;
		blacklistManager: BlacklistManager;
		manager: Manager;
		prisma: PrismaClient;
		Api: Api;

		skips: Collection<string, string[]>;
		loggers: Collection<string, Logger>;
		config: Collection<string, Guild>;
		ApiCache: Collection<string, any>;
		announcements: Collection<string, string>;
		timeouts: Collection<string, NodeJS.Timeout>;
	}
}

declare module "@sapphire/framework" {
	interface StoreRegistryEntries {
		arguments: ArgumentStore;
		commands: CommandStore;
		slashCommands: SlashCommandStore;
		listeners: ListenerStore;
		preconditions: PreconditionStore;
		slashCommandPreconditions: SlashCommandPreconditionStore;
		LavalinkListeners: LavalinkListenerStore;
	}
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		export interface Request {
			auth: AuthCookie | null;
		}
	}
}
