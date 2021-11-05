import type { Message } from "discord.js";
import { Precondition } from "../../client";

export default class extends Precondition {
	public run(message: Message): Precondition.Result {
		return this.client.owners.includes(message.author.id)
			? this.ok()
			: this.error({
					message: `Only bot developers of **${this.client.user!.tag}** are able to use this command.`
			  });
	}
}
