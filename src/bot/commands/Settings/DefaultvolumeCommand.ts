import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "defaultvolume",
	description: "Changes the default volume for this server",
	preconditions: ["GuildOnly"],
	tDescription: "settings:defaultvol.description",
	requiredUserPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "value",
				description: "The value the default volume has to change to",
				tDescription: "settings:defaultvol.args.value",
				type: "INTEGER",
				required: true
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const defaultvolume = interaction.options.getInteger("value", true);
		if (defaultvolume > 201 || defaultvolume < 1) {
			await interaction.followUp(this.translate.translate(interaction.guildId, "settings:defaultvol.fail"));
			return;
		}

		await interaction.deferReply();
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { defaultvolume },
			include: { permissions: true }
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.translate.translate(interaction.guildId, "settings:defaultvol.success", {
				defaultvolume
			})
		);
	}
}
