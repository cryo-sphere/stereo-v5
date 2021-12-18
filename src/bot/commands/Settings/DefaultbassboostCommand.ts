import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";
import { bassboost } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "defaultbassboost",
	description: "Changes the default bassboost level for this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:defaultbass.description",
	requiredUserPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "level",
				description: "The level the default bassboost has to change to",
				tDescription: "settings:defaultbass.args.level",
				type: "STRING",
				required: true,
				choices: bassboost.map((str) => ({ name: str, value: str }))
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const defaultbassboost = interaction.options.getString("level", true);
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { defaultbassboost },
			include: { permissions: true }
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "settings:defaultbass.success", {
				defaultbassboost
			})
		);
	}
}
