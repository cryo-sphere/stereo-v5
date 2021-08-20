import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "language",
	description: "Shows / Changes the language",
	preconditions: ["GuildOnly"],
	tDescription: "settings:language.description",
	arguments: [
		{
			name: "language",
			description: "The language name",
			tDescription: "settings:language.args.language",
			type: "STRING",
			required: false,
		},
	],
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;

		const language = args.getString("language");
		if (!language)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "settings:language.language")
			);

		const key = this.languageHandler.languageKeys[language.toLowerCase()];
		if (!key)
			return interaction.reply({
				embeds: [
					this.client.utils
						.embed()
						.setTitle(
							this.languageHandler.translate(interaction.guildId, "settings:language.embed.title")
						)
						.setDescription(
							Object.keys(this.languageHandler.languageKeys)
								.map((k) => `\`${this.client.utils.capitalize(k)}\``)
								.join(" ")
						),
				],
			});

		await interaction.deferReply();
		const newConfig = await this.client.prisma.guild.update({
			where: { id: interaction.guildId },
			data: { language: key },
		});
		this.client.config.set(interaction.guildId, newConfig);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "settings:language.success")
		);
	}
}
