import type { CommandInteraction } from "discord.js";
import {
	Identifiers,
	SlashCommandPreconditionResult,
	SlashCommandPrecondition,
} from "../../client/structures/slashCommands";

export class CorePrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		return interaction.channel?.isThread() && interaction.channel?.type === "GUILD_PUBLIC_THREAD"
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionGuildPublicThreadOnly,
					message: "You can only run this command in public server thread channels.",
			  });
	}
}
