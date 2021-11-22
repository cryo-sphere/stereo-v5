import { SlashCommandPrecondition } from "../../client";
import type { Interaction } from "discord.js";
import { emojis } from "../../client/constants";

export default class extends SlashCommandPrecondition {
	public run(interaction: Interaction): SlashCommandPrecondition.Result {
		return this.client.blacklistManager.isBlacklisted(interaction.user.id, interaction.guild?.id)
			? this.error({
					identifier: "BotGeneral:blacklisted",
					message: `>>> ${emojis.redcross} | You've been blacklisted, you are unable to use this bot. If you think that this is a mistake, DM one of the developers of this bot!`
			  })
			: this.ok();
	}
}
