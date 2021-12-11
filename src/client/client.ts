import { SapphireClient } from "@sapphire/framework";
import type { ActivitiesOptions, BitFieldResolvable, IntentsString, PartialTypes, PresenceStatusData } from "discord.js";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { BlacklistManager, Utils } from "./lib";

import "@daangamesdg/sapphire-logger/register";

export class Client extends SapphireClient {
	public owners: string[];

	// Classes
	public prisma = new PrismaClient();
	public utils: Utils = new Utils(this);

	// managers
	public blacklistManager: BlacklistManager = new BlacklistManager(this);

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

		// Classes
		public prisma: PrismaClient;
		public utils: Utils;

		// managers
		public blacklistManager: BlacklistManager;

		// functions
		public isOwner(id: string): boolean;
	}

	interface Preconditions {
		OwnerOnly: never;
		Blacklisted: never;
	}
}
