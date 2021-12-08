import type { CommandInteraction, ContextMenuInteraction, Interaction, Message } from "discord.js";
import { Precondition } from "../../client";

export default class extends Precondition {
	public messageRun(message: Message): Precondition.Result {
		return this.client.blacklistManager.isBlacklisted(message.author.id, message.guildId ?? undefined)
			? this.error({
					message:
						"You or this server is blacklisted, you can no longer use this bot. If you think that this is a mistake, please DM one of the developers of this bot!"
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
					message:
						"You or this server is blacklisted, you can no longer use this bot. If you think that this is a mistake, please DM one of the developers of this bot!"
			  })
			: this.ok();
	}
}
