import { SlashCommandPrecondition } from "../../client";
import type { CommandInteraction } from "discord.js";
import { emojis } from "../../client/constants";

export default class extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPrecondition.Result {
		return this.client.owners.includes(interaction.user.id)
			? this.ok()
			: this.error({
					message: `>>> ${emojis.redcross} | Only bot developers of **${this.client.user?.tag}** are allowed to use this command!`,
					identifier: "BotGeneral:owneronly",
					context: { bot: this.client.user?.tag }
			  });
	}
}
