import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "ping",
	description: "Pong!",
	tDescription: "general:ping.description",
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
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
						this.translate.translate(interaction.guildId, "general:ping.reply", {
							heartbeat: this.container.client.ws.ping,
							roundtrip: date - interactionDate,
							uptime: ms(this.container.client.uptime ?? 0, {
								long: true
							})
						})
					)
			]
		});
	}
}
