import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, Permissions } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "language",
	description: "Shows / Changes the language",
	tDescription: "settings:language.description",
	preconditions: ["GuildOnly"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "language",
				description: "The language name",
				tDescription: "settings:language.args.language",
				type: "STRING",
				required: false
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const language = interaction.options.getString("language");
		if (!language) {
			await interaction.reply(this.translate.translate(interaction.guildId, "settings:language.language"));
			return;
		}

		const key = this.translate.languageKeys[language.toLowerCase()];
		if (!key) {
			await interaction.reply({
				embeds: [
					this.client.utils
						.embed()
						.setTitle(this.translate.translate(interaction.guildId, "settings:language.embed.title"))
						.setDescription(
							Object.keys(this.translate.languageKeys)
								.map((k) => `\`${this.client.utils.capitalize(k)}\``)
								.join(" ")
						)
				]
			});
			return;
		}

		const permissions =
			typeof interaction.member.permissions === "string"
				? new Permissions(BigInt(interaction.member.permissions))
				: interaction.member.permissions;
		const hasPermission = permissions.has("MANAGE_GUILD", true);
		if (!hasPermission) {
			await interaction.reply(
				this.translate.translate(interaction.guildId, "BotGeneral:permissions", {
					missing: "`{MANAGE_GUILD}`"
				})
			);
			return;
		}

		await interaction.deferReply();
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { language: key },
			include: { permissions: true }
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(this.translate.translate(interaction.guildId, "settings:language.success"));
	}
}
