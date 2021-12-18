import type { CommandInteraction, ContextMenuInteraction, Interaction, Message } from "discord.js";
import { Precondition } from "../../client";

export default class extends Precondition {
	public messageRun(message: Message): Precondition.Result {
		return this.client.blacklistManager.isBlacklisted(message.author.id, message.guildId ?? undefined)
			? this.error({
					identifier: "BotGeneral:blacklisted"
			  })
			: this.ok();
	}

	public contextMenuRun(interaction: ContextMenuInteraction): Precondition.Result {
		return this.InteractionRun(interaction);
	}

	public chatInputRun(interaction: CommandInteraction): Precondition.Result {
		return this.InteractionRun(interaction);
	}

	private InteractionRun(interaction: Interaction): Precondition.Result {
		return this.client.blacklistManager.isBlacklisted(interaction.user.id, interaction.guildId)
			? this.error({
					identifier: "BotGeneral:blacklisted"
			  })
			: this.ok();
	}
}
