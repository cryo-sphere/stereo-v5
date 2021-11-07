import { SlashCommandPrecondition } from "../../client";
import type { CommandInteraction } from "discord.js";

export default class extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPrecondition.Result {
		return this.client.owners.includes(interaction.user.id)
			? this.ok()
			: this.error({
					identifier: "BotGeneral:owneronly",
					context: { bot: this.client.user?.tag }
			  });
	}
}
