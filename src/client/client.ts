import { SapphireClient } from "@sapphire/framework";
import type { ActivitiesOptions, BitFieldResolvable, IntentsString, PartialTypes, PresenceStatusData } from "discord.js";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { Logger, BlacklistManager, Utils } from "./lib";

export class Client extends SapphireClient {
	public owners: string[];

	// Classes
	public prisma = new PrismaClient();
	public utils: Utils = new Utils(this);

	// managers
	public blacklistManager: BlacklistManager = new BlacklistManager(this);

	// loggers
	public dbLogger = new Logger({ name: "Database" });
	public processLogger = new Logger({ name: "Process" });

	public constructor(options: ClientOptions) {
		super({
			intents: options.intents,
			allowedMentions: { users: [], roles: [], repliedUser: false },
			baseUserDirectory: join(__dirname, "..", "bot"),
			defaultPrefix: process.env.PREFIX,
			partials: options.partials,
			loadDefaultErrorListeners: false,
			presence: {
				activities: options.activity,
				status: options.status
			}
		});

		this.owners = options.owners;

		process.on("unhandledRejection", this.handleRejection.bind(this));
	}

	public isOwner(id: string): boolean {
		return this.owners.includes(id);
	}

	public async start(): Promise<void> {
		await this.prisma.$connect();
		this.dbLogger.info("Successfully connected to postgreSQL Database via Prisma!");

		const blacklisted = await this.prisma.botBlacklist.findMany();
		this.blacklistManager.setBlacklisted(blacklisted.map((b) => b.id));

		await this.login(process.env.TOKEN);
	}

	private handleRejection(reason: unknown) {
		this.processLogger.fatal("Unhandled rejection: ", reason);
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

		// Classes
		public prisma: PrismaClient;
		public utils: Utils;

		// managers
		public blacklistManager: BlacklistManager;

		// loggers
		public dbLogger: Logger;
		public processLogger: Logger;

		// functions
		public isOwner(id: string): boolean;
	}

	interface Preconditions {
		OwnerOnly: never;
		Blacklisted: never;
	}
}
