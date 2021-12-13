import {
	Args as CommandArgs,
	PieceContext,
	UserError,
	MessageCommandContext,
	ChatInputCommandContext,
	AutocompleteCommandContext,
	ContextMenuCommandContext,
	ApplicationCommandRegistry,
	RegisterBehavior,
	ApplicationCommandRegistryRegisterOptions
} from "@sapphire/framework";
import { SubCommandPluginCommand } from "@sapphire/plugin-subcommands";
import type { ApplicationCommandOptionData, PermissionResolvable } from "discord.js";
import type { Client } from "../../../";

export abstract class Command extends SubCommandPluginCommand<CommandArgs, Command> {
	public declare readonly options: Command.Options;
	public readonly hidden: boolean;
	public readonly OwnerOnly: boolean;
	public readonly usage: string;

	public readonly cooldown: number;
	public readonly cooldownLimit: number;

	public readonly permissions: PermissionResolvable;
	public readonly clientPermissions: PermissionResolvable;

	public client: Client;

	public constructor(context: PieceContext, options: Command.Options) {
		super(context, {
			cooldownDelay: 5e3,
			cooldownLimit: 2,
			generateDashLessAliases: true,
			chatInputCommand: options.chatInputCommand ? { ...options.chatInputCommand, register: true } : undefined,
			...options
		});

		if (!options.name) this.container.logger.warn(`No name provided for command with aliases "${this.aliases.join('", "')}"`);

		this.usage = `${options.name} ${options.usage ?? ""}`.trim();

		this.hidden = options.hidden ?? false;
		this.OwnerOnly = options.preconditions?.includes("OwnerOnly") ?? false;

		this.cooldown = options.cooldownDelay ?? 5e3;
		this.cooldownLimit = options.cooldownLimit ?? 2;

		this.permissions = options.requiredUserPermissions ?? [];
		this.clientPermissions = options.requiredClientPermissions ?? [];

		this.client = this.container.client as Client;
		this.options.cooldownFilteredUsers = this.client.owners;
	}

	public override registerApplicationCommands(registery: ApplicationCommandRegistry) {
		if (!this.options.chatInputCommand || !this.options.enabled) return;

		const guildIds = [process.env.TEST_GUILD as string, process.env.SUPPORT_GUILD as string].filter(
			(str) => typeof str === "string" && str.length
		);
		const options: ApplicationCommandRegistryRegisterOptions = {
			behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
			guildIds: process.env.NODE_ENV === "development" || this.OwnerOnly ? guildIds : undefined
		};

		if (this.options.chatInputCommand.messageCommand)
			registery.registerChatInputCommand(
				{
					name: this.name,
					description: this.description,
					options: this.options.chatInputCommand.options
				},
				options
			);
		if (this.options.chatInputCommand.contextmenu)
			registery.registerContextMenuCommand(
				{
					name: this.name,
					type: this.options.chatInputCommand.contextmenu
				},
				options
			);
	}

	protected error(options: UserError.Options): UserError {
		return new UserError(options);
	}

	protected parseConstructorPreConditions(options: Command.Options): void {
		super.parseConstructorPreConditions(options);
		this.parseExtraPreConditions();
	}

	protected parseExtraPreConditions(): void {
		this.preconditions.append("Blacklisted");
	}
}

export namespace Command {
	export type Options = SubCommandPluginCommand.Options & {
		hidden?: boolean;
		usage?: string;
		permissions?: PermissionResolvable;
		chatInputCommand?: {
			options?: ApplicationCommandOptionData[];
			contextmenu?: "MESSAGE" | "USER";
			messageCommand?: boolean;
		};
	};

	export type MessageContext = MessageCommandContext;
	export type SlashCommandContext = ChatInputCommandContext;
	export type AutoCompleteContext = AutocompleteCommandContext;
	export type MenuContext = ContextMenuCommandContext;
	export type Args = CommandArgs;
}
