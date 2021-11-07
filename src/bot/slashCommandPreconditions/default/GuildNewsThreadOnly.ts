import type { CommandInteraction } from "discord.js";
import { Identifiers, SlashCommandPreconditionResult, SlashCommandPrecondition } from "../../../client";

export class CorePrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		return interaction.channel?.isThread() && interaction.channel?.type === "GUILD_NEWS_THREAD"
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionGuildNewsThreadOnly,
					message: "You can only run this command in server announcement thread channels."
			  });
	}
}
