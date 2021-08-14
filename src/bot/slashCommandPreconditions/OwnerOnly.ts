import { SlashCommandPrecondition } from "../../client/structures/slashCommands";
import { CommandInteraction } from "discord.js";

export class OwnerOnlyPrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPrecondition.Result {
		return this.container.client.owners.includes(interaction.user.id)
			? this.ok()
			: this.error({
					message: `Only bot developers of **${this.container.client.user?.tag}** are able to use this command.`,
			  });
	}
}
