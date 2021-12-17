import { Command } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, MessageActionRow, MessageButton } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "invite",
	description: "Add the Stereo to another server",
	tDescription: "general:invite.description",
	chatInputCommand: {
		messageCommand: true,
		register: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction): Promise<void> {
		await interaction.reply({
			content: this.translate.translate(interaction.guildId, "general:invite.message"),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel("Invite")
						.setStyle("LINK")
						.setURL(
							`https://discord.com/oauth2/authorize?client_id=${this.client.user?.id}&scope=bot%20applications.commands&permissions=3411200`
						)
				)
			]
		});
	}
}
