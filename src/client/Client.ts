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
				new Spotify({
					clientId: process.env.CLIENT_ID,
					clientSecret: process.env.CLIENT_SECRET,
				}),
			],
		}
	);

	public languageHandler = new languageHandler(this);
	public config = new Collection<string, Guild>();

	public announcements = new Collection<string, string>();
	public timeouts = new Collection<string, NodeJS.Timeout>();

	public blacklistManager: BlacklistManager = new BlacklistManager(this);
	public loggers: Collection<string, Logger> = new Collection();
	public utils: Utils = new Utils(this);

	constructor(options: ClientOptions) {
		super({
			intents: options.intents,
			allowedMentions: { users: [], repliedUser: false, roles: [] },
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
		owners: string[];
		constants: typeof constants;

		isOwner(id: string): boolean;
		utils: Utils;

		languageHandler: languageHandler;
		blacklistManager: BlacklistManager;
		manager: Manager;
		prisma: PrismaClient;

		loggers: Collection<string, Logger>;
		config: Collection<string, Guild>;

		announcements: Collection<string, string>;
		timeouts: Collection<string, NodeJS.Timeout>;
	}
}

declare module "@sapphire/pieces" {
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
