import type { SlashCommand, SlashCommandStore } from ".";
import { ApplicationCommandData, Collection } from "discord.js";
import type Client from "../../Client";
import Logger from "../Logger";

export class SlashCommandRegistrar {
	private logger: Logger = new Logger({ name: "Registrar" });

	private slashStore!: SlashCommandStore;

	private hidden: Collection<string, SlashCommand> = new Collection();
	private global: Collection<string, SlashCommand> = new Collection();

	public constructor(private client: Client) {}

	public async refresh(): Promise<void> {
		this.slashStore = this.client.stores.get("slashCommands");

		const [hidden, global] = this.slashStore.partition((c) => c.ownerOnly);
		hidden.map((cmd, key) => this.hidden.set(key, cmd));
		global.map((cmd, key) => this.global.set(key, cmd));

		if (process.env.NODE_ENV === "development") {
			await this.testGuildRegister(true);
			await this.supportGuildRegister(true);
		} else {
			await this.testGuildRegister(false);
			await this.supportGuildRegister(false);
			await this.globalRegister();
		}
	}

	public async testGuildRegister(full = false): Promise<void> {
		const guild = this.client.guilds.cache.get(process.env.TEST_GUILD as string);
		if (!guild) {
			this.logger.warn(
				`Guild "${process.env.TEST_GUILD}" not found, cannot refresh the slash commands.`
			);
			return;
		}

		let commands: ApplicationCommandData[];
		if (full)
			commands = this.slashStore.map<ApplicationCommandData>((slash) => ({
				description: slash.description,
				name: slash.name,
				defaultPermission: slash.defaultPermission,
				options: slash.arguments,
			}));
		else
			commands = this.hidden.map<ApplicationCommandData>((slash) => ({
				description: slash.description,
				name: slash.name,
				defaultPermission: slash.defaultPermission,
				options: slash.arguments,
			}));

		await guild.commands.set(commands);
		this.logger.info("Successfully refreshed slash commands for test guild.");
	}

	public async supportGuildRegister(full = false): Promise<void> {
		const guild = this.client.guilds.cache.get(process.env.SUPPORT_GUILD as string);
		if (!guild) {
			this.logger.warn(
				`Guild "${process.env.SUPPORT_GUILD}" not found, cannot refresh the slash commands.`
			);
			return;
		}

		let commands: ApplicationCommandData[];
		if (full)
			commands = this.slashStore.map<ApplicationCommandData>((slash) => ({
				description: slash.description,
				name: slash.name,
				defaultPermission: slash.defaultPermission,
				options: slash.arguments,
			}));
		else
			commands = this.hidden.map<ApplicationCommandData>((slash) => ({
				description: slash.description,
				name: slash.name,
				defaultPermission: slash.defaultPermission,
				options: slash.arguments,
			}));

		await guild.commands.set(commands);
		this.logger.info("Successfully refreshed slash commands for support guild.");
	}

	public async globalRegister(): Promise<void> {
		const commands = this.global.map<ApplicationCommandData>((slash) => ({
			description: slash.description,
			name: slash.name,
			defaultPermission: slash.defaultPermission,
			options: slash.arguments,
		}));

		if (!this.client.application) {
			this.logger.fatal("No client.application class, unable to refresh global slash commands!");
			return;
		}

		await this.client.application.commands.set(commands);
		this.logger.info("Successfully refreshed global slash commands.");
	}
}
