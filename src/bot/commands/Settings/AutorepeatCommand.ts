import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "autorepeat",
	description: "Enables or disables queue repeat when a player is created",
	preconditions: ["GuildOnly"],
	tDescription: "settings:autorepeat.description",
	requiredUserPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const config = this.client.config.get(interaction.guildId);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { autorepeat: !config?.autorepeat },
			include: { permissions: true }
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "settings:autorepeat.success", {
				enabled: this.translate.translate(interaction.guildId, `BotGeneral:${config?.autorepeat ? "disabled" : "enabled"}`)
			})
		);
	}
}
