import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "autorepeat",
	description: "Enables or disables queue repeat when a player is created",
	preconditions: ["GuildOnly"],
	tDescription: "settings:autorepeat.description",
	userPermissions: ["MANAGE_GUILD"],
})
export default class AutoRepeatCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		await interaction.deferReply();
		const config = this.client.config.get(interaction.guildId);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { autorepeat: !config?.autorepeat },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:autorepeat.success", {
				enabled: this.languageHandler.translate(
					interaction.guildId,
					`BotGeneral:${!config?.autorepeat ? "enabled" : "disabled"}`
				),
			})
		);
	}
}
