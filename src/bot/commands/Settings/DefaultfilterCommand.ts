import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";
import { filters } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "defaultfilter",
	description: "Changes the default filter for this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:defaultfilter.description",
	requiredUserPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "filter",
				description: "The name of the filter the default filter has to change to",
				tDescription: "settings:defaultfilter.args.filter",
				type: "STRING",
				required: true,
				choices: filters.map((str) => ({
					name: str.toLocaleLowerCase() === "eightd" ? "8D" : str,
					value: str
				}))
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const defaultfilter = interaction.options.getString("filter", true);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { defaultfilter },
			include: { permissions: true }
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "settings:defaultfilter.success", {
				defaultfilter
			})
		);
	}
}
