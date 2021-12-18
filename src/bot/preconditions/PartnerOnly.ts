import type { CommandInteraction, ContextMenuInteraction, Interaction, Message } from "discord.js";
import { Precondition } from "../../client";

export default class extends Precondition {
	public messageRun(message: Message): Precondition.Result {
		if (!message.inGuild()) return this.ok();

		const config = this.container.client.config.get(message.guildId!);
		return config?.partner
			? this.ok()
			: this.error({
					identifier: "BotGeneral:partner"
			  });
	}

	public contextMenuRun(interaction: ContextMenuInteraction): Precondition.Result {
		return this.InteractionRun(interaction);
	}

	public chatInputRun(interaction: CommandInteraction): Precondition.Result {
		return this.InteractionRun(interaction);
	}

	private InteractionRun(interaction: Interaction): Precondition.Result {
		if (!interaction.inGuild()) return this.ok();

		const config = this.container.client.config.get(interaction.guildId);
		return config?.partner
			? this.ok()
			: this.error({
					identifier: "BotGeneral:partner"
			  });
	}
}
