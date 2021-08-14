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
					message:
						"You or this server is blacklisted, you can no longer use this bot. If you think that this is a mistake, please DM one of the developers of this bot!",
			  });
	}
}
