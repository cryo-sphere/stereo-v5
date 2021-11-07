import { SlashCommandPrecondition } from "../../client";
import type { Interaction } from "discord.js";

export default class extends SlashCommandPrecondition {
	public run(interaction: Interaction): SlashCommandPrecondition.Result {
		return this.client.blacklistManager.isBlacklisted(interaction.user.id, interaction.guild?.id)
			? this.error({
					identifier: "BotGeneral:blacklisted"
			  })
			: this.ok();
	}
}
