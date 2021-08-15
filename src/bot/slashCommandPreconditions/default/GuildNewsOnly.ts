import type { CommandInteraction } from "discord.js";
import {
	Identifiers,
	SlashCommandPreconditionResult,
	SlashCommandPrecondition,
} from "../../../client/structures/slashCommands";

export class CorePrecondition extends SlashCommandPrecondition {
	// @ts-expect-error
	private readonly allowedTypes: CommandInteraction["channel"]["type"][] = [
		"GUILD_NEWS",
		"GUILD_NEWS_THREAD",
	];

	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		return this.allowedTypes.includes(interaction.channel?.type)
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionGuildNewsOnly,
					message: "You can only run this command in server announcement channels.",
			  });
	}
}
