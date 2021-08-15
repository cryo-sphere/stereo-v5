import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import ms from "ms";

@ApplyOptions<SlashCommand.Options>({
	name: "ping",
	description: "Pong!",
	tDescription: "general:ping.description",
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction): Promise<void> {
		const interactionDate = Date.now();
		await interaction.reply(">>> 🏓 | Pinging...");
		const date = Date.now();

		await interaction.editReply({
			content: null,
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle("🏓 Pong!")
					.setDescription(
						this.languageHandler.translate(interaction.guildId, "general:ping.reply", {
							heartbeat: this.container.client.ws.ping,
							roundtrip: date - interactionDate,
							uptime: ms(this.container.client.uptime ?? 0, {
								long: true,
							}),
						})
					),
			],
		});
	}
}
