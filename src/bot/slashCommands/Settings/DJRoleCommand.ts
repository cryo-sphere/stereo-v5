import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "djrole",
	description: "Changes DJRole of this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:djrole.description",
	userPermissions: ["MANAGE_GUILD"],
	arguments: [
		{
			name: "role",
			description: "The role name/id/mention the DJRole has to change to",
			tDescription: "settings:djrole.args.role",
			type: "STRING",
			required: false,
		},
	],
})
export default class DJRoleCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;
		if (!interaction.guild) return;
		await interaction.deferReply();

		const role = args.getString("role");
		if (!role) {
			const newConfig = await this.client.prisma.guild.update({
				where: { id: interaction.guildId },
				data: { djrole: "" },
			});
			this.client.config.set(interaction.guildId, newConfig);

			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "settings:djrole.success2")
			);
		}

		const djrole = await this.client.utils.getRole(role, interaction.guild);
		if (!djrole)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "settings:djrole.fail", { role })
			);

		if (djrole.managed)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "settings:djrole.managed", {
					role: djrole.name,
				})
			);

		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { djrole: djrole.id },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:djrole.success", {
				djrole: djrole.name,
			})
		);
	}
}
