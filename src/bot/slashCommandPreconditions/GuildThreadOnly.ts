import type { CommandInteraction } from "discord.js";
import {
	Identifiers,
	SlashCommandPreconditionResult,
	SlashCommandPrecondition,
} from "../../client/structures/slashCommands";

export class CorePrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		return interaction.channel?.isThread()
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionThreadOnly,
					message: "You can only run this command in server thread channels.",
			  });
	}
}
