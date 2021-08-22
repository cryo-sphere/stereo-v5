import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { filters } from "../../../client/constants/settings";

@ApplyOptions<SlashCommand.Options>({
	name: "defaultfilter",
	description: "Changes the default filter for this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:defaultfilter.description",
	userPermissions: ["MANAGE_GUILD"],
	arguments: [
		{
			name: "filter",
			description: "The name of the filter the default filter has to change to",
			tDescription: "settings:defaultfilter.args.filter",
			type: "STRING",
			required: true,
			choices: filters.map((str) => ({
				name: str.toLocaleLowerCase() === "eightd" ? "8D" : str,
				value: str,
			})),
		},
	],
})
export default class DefaultfilterCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const defaultfilter = args.getString("filter", true);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { defaultfilter },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:defaultfilter.success", {
				defaultfilter,
			})
		);
	}
}
