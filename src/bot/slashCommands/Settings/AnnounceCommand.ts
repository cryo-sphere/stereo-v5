import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "announce",
	description: "Changes the way Stereo announces new songs",
	preconditions: ["GuildOnly"],
	tDescription: "settings:announce.description",
	userPermissions: ["MANAGE_GUILD"],
	arguments: [
		{
			name: "enabled",
			description: "If announcing should be enabled or not",
			tDescription: "settings:announce.args.enabled",
			type: "BOOLEAN",
			required: true,
		},
		{
			name: "delete",
			description: "If old announcements should be deleted or not",
			tDescription: "settings:announce.args.delete",
			type: "BOOLEAN",
			required: true,
		},
	],
})
export default class AnnounceCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const enabled = args.getBoolean("enabled", true);
		const deleteAnnounce = args.getBoolean("delete", true);

		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { announce: enabled, deleteAnnounce },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:announce.success", {
				announce: this.languageHandler.translate(
					interaction.guildId,
					`BotGeneral:${enabled ? "enabled" : "disabled"}`
				),
				deleteAnnounce: this.languageHandler.translate(
					interaction.guildId,
					`BotGeneral:${deleteAnnounce ? "enabled" : "disabled"}`
				),
			})
		);
	}
}
