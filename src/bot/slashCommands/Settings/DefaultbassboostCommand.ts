import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { bassboost } from "../../../client/constants/settings";

@ApplyOptions<SlashCommand.Options>({
	name: "defaultbassboost",
	description: "Changes the default bassboost level for this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:defaultbass.description",
	userPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	arguments: [
		{
			name: "level",
			description: "The level the default bassboost has to change to",
			tDescription: "settings:defaultbass.args.level",
			type: "STRING",
			required: true,
			choices: bassboost.map((str) => ({ name: str, value: str })),
		},
	],
})
export default class DefaultbassboostCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const defaultbassboost = args.getString("level", true);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { defaultbassboost },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:defaultbass.success", {
				defaultbassboost,
			})
		);
	}
}
