import type { Message } from "discord.js";
import { Precondition } from "../../client";

export default class extends Precondition {
	public run(message: Message): Precondition.Result {
		return this.client.blacklistManager.isBlacklisted(message.author.id, message.guild?.id)
			? this.error({
					message:
						"You or this server is blacklisted, you can no longer use this bot. If you think that this is a mistake, please DM one of the developers of this bot!"
			  })
			: this.ok();
	}
}
