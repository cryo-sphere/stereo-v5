import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "defaultvolume",
	description: "Changes the default volume for this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:defaultvol.description",
	userPermissions: ["MANAGE_GUILD"],
	arguments: [
		{
			name: "value",
			description: "The value the default volume has to change to",
			tDescription: "settings:defaultvol.args.value",
			type: "INTEGER",
			required: true,
		},
	],
})
export default class DefaultVolumeCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;

		const defaultvolume = args.getInteger("value", true);
		if (defaultvolume > 201 || defaultvolume < 1)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "settings:defaultvol.fail")
			);

		await interaction.deferReply();
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { defaultvolume },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:defaultvol.success", {
				defaultvolume,
			})
		);
	}
}
