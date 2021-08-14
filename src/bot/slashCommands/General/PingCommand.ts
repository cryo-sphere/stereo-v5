import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import ms from "ms";

@ApplyOptions<SlashCommand.Options>({
	name: "ping",
	description: "Ping! Pong! 🏓",
	defaultPermission: true,
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction): Promise<void> {
		await interaction.reply(">>> 🏓 | Pinging...");
		const date = Date.now();

		await interaction.editReply({
			content: null,
			embeds: [
				this.container.client.utils
					.embed()
					.setTitle("🏓 Pong!")
					.setDescription(
						[
							`Heartbeat: \`${this.container.client.ws.ping}\` ms`,
							`Roundtrip took: \`${date - interaction.createdTimestamp}\` ms`,
							`Uptime: \`${ms(this.container.client.uptime ?? 0, {
								long: true,
							})}\``,
						].join("\n")
					),
			],
		});
	}
}
