import { CommandOptionsRunType, BucketScope } from "@sapphire/framework";
import { AliasPiece, PieceContext, PieceOptions } from "@sapphire/pieces";
import { Awaitable, isNullish } from "@sapphire/utilities";
import {
	SlashCommandPreconditionContainerArray,
	SlashCommandPreconditionEntryResolvable,
} from "../utils/SlashCommandPreconditionContainerArray";
import {
	CommandInteraction,
	PermissionResolvable,
	CommandInteractionOptionResolver,
	ApplicationCommandOptionData,
	ApplicationCommandPermissionData,
	PermissionString,
	CacheType,
} from "discord.js";
import { sep } from "path";
import Client from "../../../../Client";
import languageHandler from "../../../languageHandler";

export abstract class SlashCommand<
	T = Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
> extends AliasPiece {
	public description: string;
	public tDescription: string | null;
	public usage: string;

	public defaultPermission: boolean;
	public ownerOnly: boolean;
	public DJRole: boolean;

	public preconditions: SlashCommandPreconditionContainerArray;
	public arguments: CommandArg;
	public permissions: ApplicationCommandPermissionData[];
	public userPermissions: PermissionString[];

	public languageHandler: languageHandler;
	public client: Client;

	public cooldown: number;
	public limit: number;

	public readonly fullCategory: readonly string[];

	protected constructor(context: PieceContext, options: SlashCommandOptions = {}) {
		super(context, {
			...options,
			name: (options.name ?? context.name).toLowerCase(),
		});

		this.userPermissions = options.userPermissions ?? [];
		this.arguments = options.arguments ?? [];
		this.permissions = options.permissions ?? [];

		this.defaultPermission = options.defaultPermission ?? true;
		this.ownerOnly = options.preconditions?.includes("OwnerOnly") ?? false;
		this.DJRole = options.preconditions?.includes("DJRole") ?? false;

		this.description = options.description ?? "";
		this.tDescription = options.tDescription ?? null;
		this.usage = `${(options.name ?? context.name).toLowerCase()} ${options.usage ?? ""}`.trim();

		this.client = this.container.client as Client;
		this.languageHandler = this.container.client.languageHandler;

		this.cooldown = options.cooldownDelay ?? 5e3;
		this.limit = options.cooldownLimit ?? 2;

		this.preconditions = new SlashCommandPreconditionContainerArray(options.preconditions);
		this.parseConstructorPreConditions(options);

		const paths = context.path.split(sep);
		this.fullCategory = paths.slice(paths.indexOf("slashCommands") + 1, -1);
	}

	public abstract run(
		interaction: CommandInteraction,
		args: T,
		context: SlashCommandContext
	): Awaitable<unknown>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public toJSON() {
		return {
			...super.toJSON(),
			description: this.description,
			arguments: this.arguments,
			defaultPermission: this.defaultPermission,
			permissions: this.permissions,
			category: this.category,
			subCategory: this.subCategory,
			userPermissions: this.userPermissions,
		};
	}

	/**
	 * The main category for the command
	 */
	public get category(): string {
		return this.fullCategory?.length > 0 ? this.fullCategory[0] : "General";
	}

	/**
	 * The sub category for the command
	 */
	public get subCategory(): string {
		return this.fullCategory?.length > 1 ? this.fullCategory[1] : "General";
	}

	protected parseConstructorPreConditions(options: SlashCommandOptions): void {
		this.parseConstructorPreConditionsRunIn(options);
		this.parseConstructorPreConditionsNsfw(options);
		this.parseConstructorPreConditionsCooldown(options);
		if (options.userPermissions) this.preconditions.append("Permissions");
	}

	protected parseConstructorPreConditionsNsfw(options: SlashCommandOptions): void {
		if (options.nsfw) this.preconditions.append(SlashCommandPreConditions.NotSafeForWork);
	}

	protected parseConstructorPreConditionsRunIn(options: SlashCommandOptions): void {
		const runIn = this.resolveConstructorPreConditionsRunType(options.runIn);
		if (runIn) this.preconditions.append(runIn as never);
	}

	protected parseConstructorPreConditionsCooldown(options: SlashCommandOptions): void {
		const limit = options.cooldownLimit ?? 2;
		const delay = options.cooldownDelay ?? 5e3;

		if (limit && delay)
			this.preconditions.append({
				name: SlashCommandPreConditions.Cooldown,
				context: { scope: options.cooldownScope ?? BucketScope.User, limit, delay },
			});
	}

	private resolveConstructorPreConditionsRunType(
		runIn: SlashCommandOptions["runIn"]
	): SlashCommandPreconditionContainerArray | SlashCommandPreConditions | null {
		if (isNullish(runIn)) return null;

		if (typeof runIn === "string")
			switch (runIn) {
				case "DM":
					return SlashCommandPreConditions.DirectMessageOnly;
				case "GUILD_TEXT":
					return SlashCommandPreConditions.GuildTextOnly;
				case "GUILD_NEWS":
					return SlashCommandPreConditions.GuildNewsOnly;
				case "GUILD_NEWS_THREAD":
					return SlashCommandPreConditions.GuildNewsThreadOnly;
				case "GUILD_PUBLIC_THREAD":
					return SlashCommandPreConditions.GuildPublicThreadOnly;
				case "GUILD_PRIVATE_THREAD":
					return SlashCommandPreConditions.GuildPrivateThreadOnly;
				case "GUILD_ANY":
					return SlashCommandPreConditions.GuildOnly;
				default:
					return null;
			}

		// If there's no channel it can run on, throw an error:
		if (runIn.length === 0)
			throw new Error(
				`${this.constructor.name}[${this.name}]: "runIn" was specified as an empty array.`
			);

		if (runIn.length === 1) return this.resolveConstructorPreConditionsRunType(runIn[0]);

		const keys = new Set(runIn);
		const dm = keys.has("DM");
		const guildText = keys.has("GUILD_TEXT");
		const guildNews = keys.has("GUILD_NEWS");
		const guild = guildText && guildNews;

		// If runs everywhere, optimise to null:
		if (dm && guild) return null;

		const guildPublicThread = keys.has("GUILD_PUBLIC_THREAD");
		const guildPrivateThread = keys.has("GUILD_PRIVATE_THREAD");
		const guildNewsThread = keys.has("GUILD_NEWS_THREAD");
		const guildThreads = guildPublicThread && guildPrivateThread && guildNewsThread;

		// If runs in any thread, optimise to thread-only:
		if (guildThreads && keys.size === 3) return SlashCommandPreConditions.GuildThreadOnly;

		const preconditions = new SlashCommandPreconditionContainerArray();
		if (dm) preconditions.append(SlashCommandPreConditions.DirectMessageOnly);

		if (guild) {
			preconditions.append(SlashCommandPreConditions.GuildOnly);
		} else {
			// GuildText includes PublicThread and PrivateThread
			if (guildText) {
				preconditions.append(SlashCommandPreConditions.GuildTextOnly);
			} else {
				if (guildPublicThread)
					preconditions.append(SlashCommandPreConditions.GuildPublicThreadOnly);

				if (guildPrivateThread)
					preconditions.append(SlashCommandPreConditions.GuildPrivateThreadOnly);
			}

			// GuildNews includes NewsThread
			if (guildNews) preconditions.append(SlashCommandPreConditions.GuildNewsOnly);
			else if (guildNewsThread) preconditions.append(SlashCommandPreConditions.GuildNewsThreadOnly);
		}

		return preconditions;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SlashCommand {
	export type Context = SlashCommandContext;
	export type Options = SlashCommandOptions;
	export type Args<T = CommandInteractionOptionResolver> = T;
}

export const enum SlashCommandPreConditions {
	Cooldown = "Cooldown",
	DirectMessageOnly = "DMOnly",
	GuildNewsOnly = "GuildNewsOnly",
	GuildNewsThreadOnly = "GuildNewsThreadOnly",
	GuildOnly = "GuildOnly",
	GuildPrivateThreadOnly = "GuildPrivateThreadOnly",
	GuildPublicThreadOnly = "GuildPublicThreadOnly",
	GuildTextOnly = "GuildTextOnly",
	GuildThreadOnly = "GuildThreadOnly",
	NotSafeForWork = "NSFW",
}

export interface SlashCommandOptions extends PieceOptions {
	arguments?: CommandArg;
	description?: string;
	tDescription?: string;
	usage?: string;
	defaultPermission?: boolean;
	permissions?: ApplicationCommandPermissionData[];
	preconditions?: readonly SlashCommandPreconditionEntryResolvable[];
	nsfw?: boolean;
	cooldownLimit?: number;
	cooldownDelay?: number;
	cooldownScope?: BucketScope;
	requiredClientPermissions?: PermissionResolvable;
	userPermissions?: PermissionString[];
	runIn?: CommandOptionsRunType | readonly CommandOptionsRunType[] | null;
}

export interface SlashCommandContext extends Record<PropertyKey, unknown> {
	commandName: string;
}

export type CommandArg = (ApplicationCommandOptionData & { tDescription: string })[];
