import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "support",
	description: "Gives the invite to our support server",
	tDescription: "general:support.description",
})
export default class SupportCommand extends SlashCommand {
	public async run(interaction: CommandInteraction): Promise<void> {
		await interaction.reply({
			content: this.languageHandler.translate(interaction.guildId, "general:support.message"),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel("Discord server")
						.setStyle("LINK")
						.setURL("https://discord.gg/46v9tr3Wxp")
				),
			],
		});
	}
}
