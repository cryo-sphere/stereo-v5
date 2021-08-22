import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "autoshuffle",
	description: "Enables or disables automatic shuffle when a player is created",
	preconditions: ["GuildOnly"],
	tDescription: "settings:autoshuffle.description",
	userPermissions: ["MANAGE_GUILD"],
})
export default class AutoshuffleCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		await interaction.deferReply();
		const config = this.client.config.get(interaction.guildId);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { autoshuffle: !config?.autoshuffle },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:autoshuffle.success", {
				enabled: this.languageHandler.translate(
					interaction.guildId,
					`BotGeneral:${!config?.autoshuffle ? "enabled" : "disabled"}`
				),
			})
		);
	}
}
