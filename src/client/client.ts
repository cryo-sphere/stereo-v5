import { SapphireClient } from "@sapphire/framework";
import { ActivitiesOptions, BitFieldResolvable, Collection, IntentsString, PartialTypes, PresenceStatusData } from "discord.js";
import { join } from "path";
import { Guild, PrismaClient } from "@prisma/client";
import { BlacklistManager, TranslationManager, Utils, StereoPlaylist } from "./lib";
import { Deezer, Manager, Spotify } from "@stereo-bot/lavalink";

import "@daangamesdg/sapphire-logger/register";
import "./lib/plugins/StereoTrack";

export class Client extends SapphireClient {
	public owners: string[];

	// collections
	public config = new Collection<string, Guild>();

	// Classes
	public prisma = new PrismaClient();
	public utils: Utils = new Utils(this);

	// managers
	public blacklistManager: BlacklistManager = new BlacklistManager(this);
	public translationManager = new TranslationManager(this);
	public manager: Manager = new Manager(
		[
			{
				id: "main",
				host: process.env.LAVALINK_HOST as string,
				port: Number(process.env.LAVALINK_PORT ?? 0) ?? 2333,
				password: process.env.LAVALINK_PASSWORD as string
			}
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
					clientSecret: process.env.CLIENT_SECRET
				})
			]
		}
	);

	public constructor(options: ClientOptions) {
		super({
			intents: options.intents,
			allowedMentions: { users: [], roles: [], repliedUser: false },
			baseUserDirectory: join(__dirname, "..", "bot"),
			defaultPrefix: process.env.PREFIX,
			partials: options.partials,
			loadDefaultErrorListeners: false,
			loadMessageCommandListeners: true,
			presence: {
				activities: options.activity,
				status: options.status
			}
		});

		this.owners = options.owners;

		process.on("unhandledRejection", this.handleRejection.bind(this));

		this.ws
			.on("VOICE_SERVER_UPDATE", (data) => this.manager.voiceServerUpdate(data))
			.on("VOICE_STATE_UPDATE", (data) => this.manager.voiceStateUpdate(data));
	}

	public isOwner(id: string): boolean {
		return this.owners.includes(id);
	}

	public async start(): Promise<void> {
		await this.prisma.$connect();
		this.logger.info("Successfully connected to postgreSQL Database via Prisma!");

		const blacklisted = await this.prisma.botBlacklist.findMany();
		this.blacklistManager.setBlacklisted(blacklisted.map((b) => b.id));

		await this.login(process.env.TOKEN);
	}

	private handleRejection(reason: unknown) {
		this.logger.fatal("[Process]: Unhandled rejection: ", reason);
	}
}

interface ClientOptions {
	intents: BitFieldResolvable<IntentsString, number>;
	owners: string[];
	partials?: PartialTypes[] | undefined;
	activity?: ActivitiesOptions[] | undefined;
	status?: PresenceStatusData | undefined;
}

declare module "@sapphire/framework" {
	class SapphireClient {
		// Data
		public owners: string[];

		// collections
		public config: Collection<string, Guild>;

		// Classes
		public prisma: PrismaClient;
		public utils: Utils;

		// managers
		public blacklistManager: BlacklistManager;
		public translationManager: TranslationManager;
		public manager: Manager;

		// functions
		public isOwner(id: string): boolean;
	}

	interface Preconditions {
		OwnerOnly: never;
		Blacklisted: never;
	}
}
