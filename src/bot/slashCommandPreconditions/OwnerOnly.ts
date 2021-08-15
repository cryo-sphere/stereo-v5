import { SlashCommandPrecondition } from "../../client/structures/slashCommands";
import { CommandInteraction } from "discord.js";

export class OwnerOnlyPrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPrecondition.Result {
		return this.container.client.owners.includes(interaction.user.id)
			? this.ok()
			: this.error({
					identifier: "BotGeneral:owneronly",
					context: { bot: this.container.client.user?.tag },
			  });
	}
}
