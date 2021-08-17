import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "247",
	preconditions: ["GuildOnly", "PartnerOnly"],
	description: "Toggles 24/7 mode, only for partners",
	tDescription: "music:247.description",
	userPermissions: ["MANAGE_GUILD"],
})
export default class AfkCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const config = this.client.config.get(interaction.guildId);
		if (!config) return;

		config.afk = !config.afk;
		await this.client.prisma.guild.update({ where: { id: interaction.guildId }, data: config });
		this.client.config.set(interaction.guildId, config);

		await interaction.followUp(
			this.languageHandler.translate(
				interaction.guildId,
				`music:247.${config.afk ? "enabled" : "disabled"}`
			)
		);
	}
}