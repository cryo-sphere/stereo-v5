import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, Message } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "ping",
	aliases: ["pong"],
	description: "Ping! Pong! 🏓",
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async messageRun(message: Message): Promise<void> {
		const msg = await message.reply(">>> 🏓 | Pinging...");

		await msg.edit({
			content: null,
			embeds: [
				this.client.utils
					.embed()
					.setTitle("🏓 Pong!")
					.setDescription(
						[
							`API Latency: \`${this.client.ws.ping}\` ms`,
							`Edit Latency: \`${msg.createdTimestamp - message.createdTimestamp}\` ms`,
							`Uptime: \`${ms(this.client.uptime ?? 0, {
								long: true
							})}\``
						].join("\n")
					)
			]
		});
	}

	public async chatInputRun(interaction: CommandInteraction): Promise<void> {
		const interactionDate = Date.now();
		await interaction.reply(">>> 🏓 | Pinging...");
		const date = Date.now();

		await interaction.editReply({
			content: null,
			embeds: [
				this.client.utils
					.embed()
					.setTitle("🏓 Pong!")
					.setDescription(
						[
							`API Latency: \`${this.client.ws.ping}\` ms`,
							`Edit Latency: \`${date - interactionDate}\` ms`,
							`Uptime: \`${ms(this.client.uptime ?? 0, {
								long: true
							})}\``
						].join("\n")
					)
			]
		});
	}
}
