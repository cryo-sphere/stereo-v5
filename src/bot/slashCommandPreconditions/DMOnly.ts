import type { CommandInteraction } from "discord.js";
import {
	Identifiers,
	SlashCommandPrecondition,
	SlashCommandPreconditionResult,
} from "../../client/structures/slashCommands";

export class CorePrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		return interaction.guild === null
			? this.ok()
			: this.error({
					identifier: Identifiers.SlashCommandPreconditionDMOnly,
					message: "You cannot run this command outside DMs.",
			  });
	}
}
