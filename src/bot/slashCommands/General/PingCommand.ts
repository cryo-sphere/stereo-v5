import { SlashCommand } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import ms from "ms";

@ApplyOptions<SlashCommand.Options>({
	name: "ping",
	description: "Pong!"
})
export default class extends SlashCommand {
	public async run(interaction: CommandInteraction): Promise<void> {
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
