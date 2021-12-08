import type { CommandInteraction, ContextMenuInteraction, Interaction, Message } from "discord.js";
import { Precondition } from "../../client";

export default class extends Precondition {
	public run(message: Message): Precondition.Result {
		return this.client.owners.includes(message.author.id)
			? this.ok()
			: this.error({
					message: `Only bot developers of **${this.client.user!.tag}** are able to use this command.`
			  });
	}

	public contextMenuRun(interaction: ContextMenuInteraction): Precondition.Result {
		return this.InteractionRun(interaction);
	}

	public chatInputRun(interaction: CommandInteraction): Precondition.Result {
		return this.InteractionRun(interaction);
	}

	private InteractionRun(interaction: Interaction) {
		return this.client.owners.includes(interaction.user.id)
			? this.ok()
			: this.error({
					message: `Only bot developers of **${this.client.user!.tag}** are able to use this command.`
			  });
	}
}
