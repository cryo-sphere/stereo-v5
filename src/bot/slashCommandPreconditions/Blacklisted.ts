import { SlashCommandPrecondition } from "../../client/structures/slashCommands";
import { Interaction } from "discord.js";

export class BlacklistedPrecondition extends SlashCommandPrecondition {
	public run(interaction: Interaction): SlashCommandPrecondition.Result {
		return !this.container.client.blacklistManager.isBlacklisted(
			interaction.user.id,
			interaction.guild?.id
		)
			? this.ok()
			: this.error({
					identifier: "BotGeneral:blacklisted",
			  });
	}
}
