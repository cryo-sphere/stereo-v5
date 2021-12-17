import { Command } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "support",
	description: "Gives the invite to our support server",
	tDescription: "general:support.description",
	chatInputCommand: {
		messageCommand: true,
		register: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction): Promise<void> {
		await interaction.reply({
			content: this.translate.translate(interaction.guildId, "general:support.message"),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton().setLabel("Support server").setStyle("LINK").setURL("https://discord.gg/46v9tr3Wxp")
				)
			]
		});
	}
}
