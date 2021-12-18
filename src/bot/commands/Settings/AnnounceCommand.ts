import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "announce",
	description: "Changes the way Stereo announces new songs",
	preconditions: ["GuildOnly"],
	tDescription: "settings:announce.description",
	requiredUserPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "enabled",
				description: "If announcing should be enabled or not",
				tDescription: "settings:announce.args.enabled",
				type: "BOOLEAN",
				required: true
			},
			{
				name: "delete",
				description: "If old announcements should be deleted or not",
				tDescription: "settings:announce.args.delete",
				type: "BOOLEAN",
				required: true
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const enabled = interaction.options.getBoolean("enabled", true);
		const deleteAnnounce = interaction.options.getBoolean("delete", true);

		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { announce: enabled, deleteAnnounce },
			include: { permissions: true }
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "settings:announce.success", {
				announce: this.translate.translate(interaction.guildId, `BotGeneral:${enabled ? "enabled" : "disabled"}`),
				deleteAnnounce: this.translate.translate(interaction.guildId, `BotGeneral:${deleteAnnounce ? "enabled" : "disabled"}`)
			})
		);
	}
}
