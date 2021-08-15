import type { CommandInteraction } from "discord.js";
import {
	Identifiers,
	SlashCommandPreconditionResult,
	SlashCommandPrecondition,
} from "../../../client/structures/slashCommands";

export class CorePrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		return interaction.guild === null
			? this.error({
					identifier: Identifiers.PreconditionGuildOnly,
					message: "You cannot run this command in DMs.",
			  })
			: this.ok();
	}
}
