import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import type { Message } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "ping",
	aliases: ["ping", "pong"],
	description: "Ping! Pong! 🏓"
})
export default class extends Command {
	public async messageRun(message: Message): Promise<void> {
		const msg = await message.reply(">>> 🏓 | Pinging...");

		await msg.edit({
			content: null,
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle("🏓 Pong!")
					.setDescription(
						[
							`API Latency: \`${this.container.client.ws.ping}\` ms`,
							`Edit Latency: \`${msg.createdTimestamp - message.createdTimestamp}\` ms`,
							`Uptime: \`${ms(this.container.client.uptime ?? 0, {
								long: true
							})}\``
						].join("\n")
					)
			]
		});
	}
}
