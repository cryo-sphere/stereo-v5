import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "invite",
	description: "Add the Stereo to another server",
	tDescription: "general:invite.description",
})
export default class InviteCommand extends SlashCommand {
	public async run(interaction: CommandInteraction): Promise<void> {
		await interaction.reply({
			content: this.languageHandler.translate(interaction.guildId, "general:invite.message"),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel("Invite")
						.setStyle("LINK")
						.setURL(
							`https://discord.com/oauth2/authorize?client_id=${this.client.user?.id}&scope=bot%20applications.commands&permissions=3411200`
						)
				),
			],
		});
	}
}
