import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Snowflake } from "discord-api-types/globals";
import { APIApplicationCommandOption } from "discord-api-types";
import { SlashCommand } from "./lib/structures/SlashCommand";
import { SlashCommandStore } from "./lib/structures/SlashCommandStore";
import Client from "../../Client";
import Logger from "../Logger";

export interface APIGuildApplicationCommand {
	id: Snowflake;
	application_id: Snowflake;
	name: string;
	description: string;
	version?: string;
	default_permission?: boolean;
	type?: number;
	guild_id: Snowflake;
	options?: APIApplicationCommandOption[];
}

interface APIApplicationCommand {
	application_id: Snowflake;
	guild_id?: Snowflake;
	name: string;
	description: string;
	options?: APIApplicationCommandOption[];
	default_permission?: boolean;
}

const ApplicationCommandOptionTypeMap: { [key: string]: number } = {
	SUBCOMMAND: 1,
	SUBCOMMANDGROUP: 2,
	STRING: 3,
	INTEGER: 4,
	BOOLEAN: 5,
	USER: 6,
	CHANNEL: 7,
	ROLE: 8,
	MENTIONABLE: 9,
	NUMBER: 10,
};

export class SlashCommandRegistrar {
	private static instance: SlashCommandRegistrar;
	private logger!: Logger;

	private rest!: REST;
	private client!: Client;
	private slashStore!: SlashCommandStore;
	private slashData!: APIApplicationCommand[];

	private hidden!: string[];

	constructor() {
		if (SlashCommandRegistrar.instance) return SlashCommandRegistrar.instance;
		SlashCommandRegistrar.instance = this;
	}

	public initializeData(client: Client): void {
		this.client = client;
		this.logger = client.loggers.get("bot") as Logger;
		this.rest = new REST({ version: "9" }).setToken(process.env.TOKEN as string);

		this.logger.debug("Initializing slash commands data...");

		this.slashStore = client.stores.get("slashCommands");
		this.hidden = this.slashStore.filter((c) => c.ownerOnly).map((c) => c.name);
		this.slashData = this.slashStore.map(this.generateSlash.bind(this));

		this.logger.debug(`Slash commands: ${this.slashData.map((command) => command.name)}`);
		this.logger.debug("Slash commands data initialized");
	}

	public async testGuildRegister(): Promise<void> {
		const guild = this.client.guilds.cache.get(process.env.TEST_GUILD as string);
		if (!guild) return;

		this.logger.debug("Refreshing commands for test guild...");

		const body = this.slashData.map((data) => ({ ...data, guild_id: guild.id }));

		const commands = (await this.rest.put(
			Routes.applicationGuildCommands(this.client.id as string, guild.id),
			{ body }
		)) as APIGuildApplicationCommand[];

		const withPerms = commands
			.flat()
			.filter((command) => (this.slashStore.get(command.name)?.permissions?.length ?? 0) > 0);

		const fullPermissions = withPerms.map((command) => ({
			permissions: this.slashStore.get(command.name)?.permissions ?? [],
			id: command.id,
		}));

		await guild.commands.permissions.set({ fullPermissions });

		this.logger.debug("Successfully refreshed slash commands for test guild.");
	}

	public async supportGuildRegister(): Promise<void> {
		const guild = this.client.guilds.cache.get(process.env.SUPPORT_GUILD as string);
		if (!guild) return;

		this.logger.debug("Refreshing commands for support guild...");

		const body = this.slashData.map((data) => ({ ...data, guild_id: guild.id }));

		const commands = (await this.rest.put(
			Routes.applicationGuildCommands(this.client.id as string, guild.id),
			{ body }
		)) as APIGuildApplicationCommand[];

		const withPerms = commands
			.flat()
			.filter((command) => (this.slashStore.get(command.name)?.permissions?.length ?? 0) > 0);

		const fullPermissions = withPerms.map((command) => ({
			permissions: this.slashStore.get(command.name)?.permissions ?? [],
			id: command.id,
		}));

		await guild.commands.permissions.set({ fullPermissions });

		this.logger.debug("Successfully refreshed slash commands for support guild.");
	}

	public async globalRegister(): Promise<void> {
		this.logger.debug("Refreshing global slash commands...");

		const id = this.client.application?.id ?? this.client.user?.id;
		await this.rest.put(Routes.applicationCommands(id ?? ""), {
			body: this.slashData.filter((c) => !this.hidden.includes(c.name)),
		});

		this.logger.debug("Successfully refreshed global slash commands");
	}

	private generateSlash(slashCommand: SlashCommand): APIApplicationCommand {
		const id = this.client.application?.id ?? this.client.user?.id;
		if (!id) {
			this.logger.error(
				"No applicationId found, terminating...",
				this.client.application?.toJSON() ?? null
			);
			process.exit(1);
		}

		return {
			application_id: id ?? "",
			guild_id: undefined,
			name: slashCommand.name,
			description: slashCommand.description,
			default_permission: slashCommand.defaultPermission,
			options: slashCommand.arguments.map((argument) => ({
				...argument,
				type: ApplicationCommandOptionTypeMap[argument.type.toString()],
			})),
		};
	}
}
